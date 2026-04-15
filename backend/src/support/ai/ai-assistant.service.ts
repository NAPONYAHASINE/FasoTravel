import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  AssistantConversation,
  ConversationMessage,
} from '../../database/entities';
import { RagService } from './rag.service';

export interface AssistantReply {
  answer: string;
  escalate: boolean;
  confidence: number;
  sources: string[];
  conversationId: string;
}

@Injectable()
export class AiAssistantService {
  private readonly logger = new Logger(AiAssistantService.name);
  private readonly geminiApiKey: string;
  private readonly model: string;
  private readonly maxTokens: number;
  private readonly temperature: number;
  private readonly escalationThreshold: number;
  private readonly maxHistoryMessages: number;

  constructor(
    @InjectRepository(AssistantConversation)
    private readonly conversationRepo: Repository<AssistantConversation>,
    private readonly ragService: RagService,
    private readonly configService: ConfigService,
  ) {
    this.geminiApiKey = this.configService.get<string>('ai.geminiApiKey', '');
    this.model = this.configService.get<string>(
      'ai.geminiModel',
      'gemini-2.5-flash',
    );
    this.maxTokens = this.configService.get<number>('ai.maxTokens', 500);
    this.temperature = this.configService.get<number>('ai.temperature', 0.3);
    this.escalationThreshold = this.configService.get<number>(
      'ai.escalationThreshold',
      0.4,
    );
    this.maxHistoryMessages = this.configService.get<number>(
      'ai.maxHistoryMessages',
      10,
    );
  }

  /**
   * Main chat entry point — processes user message, queries RAG, calls LLM.
   * Returns answer matching mobile frontend's AssistantReply interface.
   */
  async chat(
    message: string,
    conversationId?: string,
    userId?: string,
    userEmail?: string,
  ): Promise<AssistantReply> {
    // 1. Load or create conversation
    const conversation = await this.getOrCreateConversation(
      conversationId,
      userId,
      userEmail,
    );

    // If already escalated, tell user
    if (conversation.isEscalated) {
      return {
        answer:
          'Votre conversation a déjà été transférée à un agent humain. Un membre de notre équipe vous répondra bientôt.',
        escalate: true,
        confidence: 1,
        sources: [],
        conversationId: conversation.id,
      };
    }

    // 2. Add user message to history
    const userMsg: ConversationMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    conversation.messages.push(userMsg);

    // 3. Retrieve relevant knowledge
    const relevantDocs = await this.ragService.retrieveRelevant(message);
    const sources = relevantDocs.map((d) => d.article.title);
    const avgRelevance =
      relevantDocs.length > 0
        ? relevantDocs.reduce((s, d) => s + d.score, 0) / relevantDocs.length
        : 0;

    // 4. Build context from knowledge base
    const knowledgeContext = relevantDocs
      .map(
        (d, i) => `[Source ${i + 1}: ${d.article.title}]\n${d.article.content}`,
      )
      .join('\n\n');

    // 5. Build conversation history for LLM
    const history = conversation.messages
      .slice(-this.maxHistoryMessages)
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    // 6. Call LLM
    let answer: string;
    let confidence: number;

    if (!this.geminiApiKey) {
      // Fallback mode: generate answer from knowledge context
      const result = this.fallbackAnswer(message, relevantDocs);
      answer = result.answer;
      confidence = result.confidence;
    } else {
      try {
        const result = await this.callLLM(message, knowledgeContext, history);
        answer = result.answer;
        // Confidence = blend of doc relevance + LLM self-assessed confidence
        confidence = Math.min(1, avgRelevance * 0.6 + result.confidence * 0.4);
      } catch (error) {
        this.logger.error(`LLM call failed: ${error}`);
        const result = this.fallbackAnswer(message, relevantDocs);
        answer = result.answer;
        confidence = result.confidence;
      }
    }

    // 7. Determine escalation
    const shouldEscalate = confidence < this.escalationThreshold;

    if (shouldEscalate) {
      answer +=
        '\n\nJe ne suis pas sûr de pouvoir répondre complètement à votre question. Je vais vous transférer à un agent humain qui pourra mieux vous aider.';
    }

    // 8. Add assistant reply to conversation
    const assistantMsg: ConversationMessage = {
      role: 'assistant',
      content: answer,
      timestamp: new Date().toISOString(),
      sources,
      confidence,
    };
    conversation.messages.push(assistantMsg);

    if (shouldEscalate) {
      conversation.isEscalated = true;
      conversation.status = 'escalated';
      conversation.escalationReason = `Confidence trop basse (${(confidence * 100).toFixed(0)}%) pour la question: "${message.slice(0, 100)}"`;
    }

    await this.conversationRepo.save(conversation);

    return {
      answer,
      escalate: shouldEscalate,
      confidence: Math.round(confidence * 100) / 100,
      sources,
      conversationId: conversation.id,
    };
  }

  /**
   * Get conversation by ID or create a new one.
   */
  private async getOrCreateConversation(
    conversationId?: string,
    userId?: string,
    userEmail?: string,
  ): Promise<AssistantConversation> {
    if (conversationId) {
      const existing = await this.conversationRepo.findOne({
        where: { id: conversationId },
      });
      if (existing) return existing;
    }

    const conversation = this.conversationRepo.create({
      userId: userId ?? 'anonymous',
      userEmail: userEmail ?? '',
      messages: [],
      isEscalated: false,
      status: 'active',
    });
    return this.conversationRepo.save(conversation);
  }

  /**
   * Call Google Gemini API with RAG context.
   */
  private async callLLM(
    userMessage: string,
    knowledgeContext: string,
    history: { role: string; content: string }[],
  ): Promise<{ answer: string; confidence: number }> {
    const systemPrompt = this.buildSystemPrompt(knowledgeContext);

    // Build Gemini contents array from conversation history
    const contents: { role: string; parts: { text: string }[] }[] = [];

    // Add history (excluding last user message which we add below)
    for (const msg of history.slice(0, -1)) {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    }

    // Add current user message with JSON instruction
    contents.push({
      role: 'user',
      parts: [
        {
          text: `${userMessage}\n\n[INSTRUCTION: Réponds en JSON avec les clés "answer" (ta réponse en français) et "confidence" (un nombre entre 0 et 1 indiquant ta confiance dans la réponse). Si tu ne trouves pas l'information dans le contexte fourni, mets une confidence basse.]`,
        },
      ],
    });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.geminiApiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: {
          maxOutputTokens: this.maxTokens,
          temperature: this.temperature,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = (await response.json()) as {
      candidates: { content: { parts: { text: string }[] } }[];
    };
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';

    try {
      const parsed = JSON.parse(raw) as {
        answer?: string;
        confidence?: number;
      };
      return {
        answer:
          parsed.answer ??
          "Je m'excuse, je n'ai pas pu formuler une réponse. Voulez-vous parler à un agent ?",
        confidence:
          typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
      };
    } catch {
      // If JSON parsing fails, use raw text
      return { answer: raw, confidence: 0.5 };
    }
  }

  /**
   * Build system prompt with RAG context injection.
   */
  private buildSystemPrompt(knowledgeContext: string): string {
    return `Tu es l'assistant virtuel de FasoTravel, la plateforme de réservation de bus et transport interurbain au Burkina Faso.

RÈGLES :
- Réponds UNIQUEMENT en français.
- Sois poli, concis et utile.
- Base tes réponses UNIQUEMENT sur le contexte fourni ci-dessous. N'invente pas d'informations.
- Si tu ne trouves pas la réponse dans le contexte, indique-le honnêtement et mets une confidence basse.
- Ne donne JAMAIS de conseils médicaux, juridiques ou financiers.
- FasoTravel ne gère PAS les chauffeurs directement — ce sont les compagnies de transport.
- Oriente le client vers le support humain si sa demande est complexe ou urgente.

CONTEXTE (Documentation FasoTravel) :
${knowledgeContext || 'Aucun contexte disponible pour cette question.'}

FORMAT DE RÉPONSE : JSON avec "answer" (string) et "confidence" (number 0-1).`;
  }

  /**
   * Fallback answer when no LLM is available — uses retrieved docs directly.
   */
  private fallbackAnswer(
    message: string,
    docs: { article: { title: string; content: string }; score: number }[],
  ): { answer: string; confidence: number } {
    if (docs.length === 0) {
      return {
        answer:
          "Je n'ai pas trouvé d'information pertinente pour votre question. Souhaitez-vous être mis en contact avec un agent humain ?",
        confidence: 0.1,
      };
    }

    const bestDoc = docs[0];
    const lowerMsg = message.toLowerCase();

    // Simple keyword confidence boost
    const keywords = [
      'réserver',
      'billet',
      'annuler',
      'payer',
      'paiement',
      'trajet',
      'gare',
      'bagage',
      'incident',
      'retard',
      'compte',
      'parrainage',
    ];
    const matchedKeywords = keywords.filter((k) => lowerMsg.includes(k));
    const keywordBoost = matchedKeywords.length > 0 ? 0.15 : 0;

    const confidence = Math.min(1, bestDoc.score + keywordBoost);

    const answer =
      `D'après nos informations :\n\n${bestDoc.article.content.slice(0, 600)}` +
      (bestDoc.article.content.length > 600 ? '...' : '');

    return { answer, confidence };
  }

  /**
   * Get conversation history for admin view.
   */
  async getConversation(
    conversationId: string,
  ): Promise<AssistantConversation | null> {
    return this.conversationRepo.findOne({
      where: { id: conversationId },
    });
  }

  /**
   * Get all escalated conversations (admin).
   */
  async getEscalatedConversations(): Promise<AssistantConversation[]> {
    return this.conversationRepo.find({
      where: { isEscalated: true },
      order: { updatedAt: 'DESC' },
    });
  }
}
