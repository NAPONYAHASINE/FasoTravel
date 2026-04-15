import { registerAs } from '@nestjs/config';

export default registerAs('ai', () => ({
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  embeddingModel: process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004',
  /** Max tokens for assistant response */
  maxTokens: parseInt(process.env.AI_MAX_TOKENS || '500', 10),
  /** Temperature for response generation (0 = deterministic, 1 = creative) */
  temperature: parseFloat(process.env.AI_TEMPERATURE || '0.3'),
  /** Confidence threshold below which escalation is suggested */
  escalationThreshold: parseFloat(process.env.AI_ESCALATION_THRESHOLD || '0.4'),
  /** Max conversation history messages to include in context */
  maxHistoryMessages: parseInt(process.env.AI_MAX_HISTORY || '10', 10),
  /** Number of knowledge chunks to retrieve */
  topK: parseInt(process.env.AI_RAG_TOP_K || '5', 10),
}));
