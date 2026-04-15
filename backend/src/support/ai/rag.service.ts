import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { KnowledgeArticle } from '../../database/entities';

/**
 * RAG Service — Retrieval-Augmented Generation
 *
 * Handles:
 * 1. Embedding generation for knowledge articles
 * 2. Similarity search (cosine) to find relevant docs
 * 3. Knowledge base seeding with FasoTravel documentation
 *
 * Uses Google Gemini embeddings API (free tier available).
 * Embeddings stored as JSONB arrays in PostgreSQL.
 * For production scale, migrate to pgvector extension.
 */
@Injectable()
export class RagService implements OnModuleInit {
  private readonly logger = new Logger(RagService.name);
  private embeddingModel: string;
  private geminiApiKey: string;
  private topK: number;

  constructor(
    @InjectRepository(KnowledgeArticle)
    private readonly articleRepo: Repository<KnowledgeArticle>,
    private readonly configService: ConfigService,
  ) {
    this.geminiApiKey = this.configService.get<string>('ai.geminiApiKey', '');
    this.embeddingModel = this.configService.get<string>(
      'ai.embeddingModel',
      'text-embedding-004',
    );
    this.topK = this.configService.get<number>('ai.topK', 5);
  }

  async onModuleInit() {
    const count = await this.articleRepo.count();
    if (count === 0) {
      this.logger.log(
        'Knowledge base is empty — seeding with FasoTravel documentation...',
      );
      await this.seedKnowledgeBase();
    } else {
      this.logger.log(`Knowledge base loaded: ${count} articles`);
    }
  }

  /**
   * Retrieve the most relevant knowledge articles for a user query.
   */
  async retrieveRelevant(
    query: string,
    topK?: number,
  ): Promise<{ article: KnowledgeArticle; score: number }[]> {
    const k = topK ?? this.topK;

    // If no API key, fall back to keyword search
    if (!this.geminiApiKey) {
      return this.keywordSearch(query, k);
    }

    try {
      const queryEmbedding = await this.generateEmbedding(query);
      return this.cosineSimilaritySearch(queryEmbedding, k);
    } catch (error) {
      this.logger.warn(
        `Embedding generation failed, falling back to keyword search: ${error}`,
      );
      return this.keywordSearch(query, k);
    }
  }

  /**
   * Generate embedding vector for text using Google Gemini API.
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.embeddingModel}:embedContent?key=${this.geminiApiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: `models/${this.embeddingModel}`,
        content: { parts: [{ text }] },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini embedding API error: ${response.statusText}`);
    }

    const data = (await response.json()) as {
      embedding: { values: number[] };
    };
    return data.embedding.values;
  }

  /**
   * Cosine similarity search against stored embeddings.
   */
  private async cosineSimilaritySearch(
    queryEmbedding: number[],
    topK: number,
  ): Promise<{ article: KnowledgeArticle; score: number }[]> {
    const articles = await this.articleRepo.find({
      where: { isActive: true },
    });

    const scored = articles
      .filter((a) => a.embedding && a.embedding.length > 0)
      .map((article) => ({
        article,
        score: this.cosineSimilarity(queryEmbedding, article.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return scored;
  }

  /**
   * Fallback keyword search when embeddings are unavailable.
   */
  private async keywordSearch(
    query: string,
    topK: number,
  ): Promise<{ article: KnowledgeArticle; score: number }[]> {
    const words = query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2);

    if (words.length === 0) {
      const articles = await this.articleRepo.find({
        where: { isActive: true },
        take: topK,
      });
      return articles.map((a) => ({ article: a, score: 0.3 }));
    }

    // Use ILIKE for each word
    const qb = this.articleRepo
      .createQueryBuilder('a')
      .where('a.is_active = true');

    const conditions = words.map(
      (_, i) => `(LOWER(a.content) LIKE :w${i} OR LOWER(a.title) LIKE :w${i})`,
    );
    const params: Record<string, string> = {};
    words.forEach((w, i) => {
      params[`w${i}`] = `%${w}%`;
    });

    qb.andWhere(`(${conditions.join(' OR ')})`, params);
    qb.take(topK);

    const articles = await qb.getMany();

    // Score by number of keyword matches
    return articles.map((article) => {
      const lower = (article.content + ' ' + article.title).toLowerCase();
      const matches = words.filter((w) => lower.includes(w)).length;
      return { article, score: matches / words.length };
    });
  }

  /**
   * Cosine similarity between two vectors.
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }

  /**
   * Seed the knowledge base with FasoTravel documentation.
   * In production, this would be loaded from files or an admin interface.
   */
  async seedKnowledgeBase(): Promise<void> {
    const articles = this.getFasoTravelDocs();

    for (const doc of articles) {
      const article = this.articleRepo.create(doc);

      // Try to generate embedding if API key is available
      if (this.geminiApiKey) {
        try {
          article.embedding = await this.generateEmbedding(doc.content!);
        } catch {
          this.logger.warn(
            `Could not generate embedding for "${doc.title}", will use keyword search`,
          );
        }
      }

      await this.articleRepo.save(article);
    }

    this.logger.log(`Seeded ${articles.length} knowledge base articles`);
  }

  /**
   * Add or update a knowledge article (admin use).
   */
  async upsertArticle(data: {
    category: string;
    title: string;
    content: string;
    metadata?: Record<string, unknown>;
  }): Promise<KnowledgeArticle> {
    const article = this.articleRepo.create({
      ...data,
      isActive: true,
      language: 'fr',
    });

    if (this.geminiApiKey) {
      try {
        article.embedding = await this.generateEmbedding(data.content);
      } catch {
        this.logger.warn(`Could not generate embedding for "${data.title}"`);
      }
    }

    return this.articleRepo.save(article);
  }

  // ─────────────────────────────────────────────────────
  // FasoTravel Knowledge Base — Complete Documentation
  // ─────────────────────────────────────────────────────

  private getFasoTravelDocs(): Partial<KnowledgeArticle>[] {
    return [
      // ── Réservation ──
      {
        category: 'reservation',
        title: 'Comment réserver un billet',
        content: `Pour réserver un billet sur FasoTravel :
1. Ouvrez l'application et recherchez votre trajet (ville de départ → ville d'arrivée).
2. Choisissez la date et l'heure qui vous conviennent parmi les trajets disponibles.
3. Sélectionnez le nombre de places souhaitées.
4. Choisissez vos sièges si le bus dispose d'un plan de siège.
5. Renseignez les informations du passager (nom, téléphone).
6. Confirmez et procédez au paiement.
Votre billet sera disponible dans "Mes billets" une fois le paiement confirmé.`,
        metadata: { source: 'guide_utilisateur', priority: 'high' },
      },
      {
        category: 'reservation',
        title: 'Réservation avec plusieurs passagers',
        content: `Vous pouvez réserver pour plusieurs passagers en une seule fois :
- Lors de la sélection des places, choisissez le nombre de passagers.
- L'application vous demandera les informations de chaque passager.
- Chaque passager recevra son propre billet avec un QR code unique.
- Le paiement couvre l'ensemble des billets.`,
        metadata: { source: 'guide_utilisateur' },
      },
      {
        category: 'reservation',
        title: 'Statuts de réservation',
        content: `Votre réservation peut avoir les statuts suivants :
- "En attente" (PENDING) : La réservation est créée mais le paiement n'est pas encore confirmé. Vous disposez de 15 minutes pour payer.
- "Confirmée" (CONFIRMED) : Le paiement a été reçu, vos billets sont générés.
- "Annulée" (CANCELLED) : La réservation a été annulée par vous ou automatiquement (expiration du délai de paiement).
- "Expirée" : Le délai de paiement de 15 minutes est passé sans paiement.
Si votre réservation expire, les sièges sont libérés et vous devez en créer une nouvelle.`,
        metadata: { source: 'guide_utilisateur', priority: 'high' },
      },

      // ── Annulation ──
      {
        category: 'annulation',
        title: 'Comment annuler un billet',
        content: `Pour annuler un billet :
1. Allez dans "Mes billets" depuis le menu principal.
2. Sélectionnez le billet que vous souhaitez annuler.
3. Appuyez sur "Annuler le billet".
4. Confirmez l'annulation.
Conditions d'annulation :
- Annulation gratuite jusqu'à 24h avant le départ (selon la politique de la compagnie).
- Des frais d'annulation peuvent s'appliquer selon la compagnie de transport.
- Le remboursement est effectué sur le même moyen de paiement dans un délai de 3 à 7 jours ouvrables.
- Les billets déjà utilisés ou dont le trajet est passé ne peuvent pas être annulés.`,
        metadata: { source: 'politique_annulation', priority: 'high' },
      },
      {
        category: 'annulation',
        title: 'Politique de remboursement',
        content: `Politique de remboursement FasoTravel :
- Le remboursement dépend de la politique de chaque compagnie de transport.
- En général : annulation > 24h avant départ = remboursement complet, < 24h = frais de 20-30%.
- Le remboursement est crédité sur votre moyen de paiement original (Orange Money, Moov Money, ou carte bancaire).
- Délai de traitement : 3 à 7 jours ouvrables.
- Pour vérifier le statut de votre remboursement, consultez "Mes billets" > billet annulé > "Statut remboursement".`,
        metadata: { source: 'politique_remboursement' },
      },

      // ── Paiement ──
      {
        category: 'paiement',
        title: 'Moyens de paiement acceptés',
        content: `FasoTravel accepte les moyens de paiement suivants :
- Orange Money : Paiement via votre compte Orange Money. Vous recevrez une demande de validation sur votre téléphone.
- Moov Money : Paiement via votre compte Moov Money.
- Carte bancaire : Visa et Mastercard acceptées.
- Paiement en espèces : Disponible uniquement aux guichets des gares partenaires.
Tous les paiements sont sécurisés et cryptés. Vous recevrez une confirmation par SMS et dans l'application.`,
        metadata: { source: 'guide_paiement', priority: 'high' },
      },
      {
        category: 'paiement',
        title: 'Problème de paiement',
        content: `Si vous rencontrez un problème de paiement :
- "Paiement refusé" : Vérifiez que votre solde est suffisant ou que votre carte est valide.
- "Paiement en attente" : Le paiement mobile peut prendre jusqu'à 2 minutes. Patientez et vérifiez votre téléphone pour la validation.
- "Double débit" : Si vous avez été débité deux fois, contactez le support immédiatement. Le remboursement du doublon sera traité sous 48h.
- "Paiement confirmé mais pas de billet" : Attendez quelques minutes, le billet peut prendre du temps à se générer. Si après 10 minutes il n'apparaît pas dans "Mes billets", contactez le support avec votre référence de paiement.`,
        metadata: { source: 'faq_paiement', priority: 'high' },
      },

      // ── Trajets ──
      {
        category: 'trajet',
        title: 'Rechercher un trajet',
        content: `Pour trouver un trajet :
1. Sur la page d'accueil, entrez votre ville de départ et votre ville d'arrivée.
2. Sélectionnez la date de voyage.
3. L'application affiche tous les trajets disponibles avec : compagnie, heure de départ, durée estimée, prix, places disponibles.
4. Vous pouvez filtrer par compagnie, prix, ou heure de départ.
Les principales routes desservies au Burkina Faso incluent : Ouagadougou-Bobo Dioulasso, Ouagadougou-Koudougou, Ouagadougou-Ouahigouya, Bobo-Banfora, et plus encore.`,
        metadata: { source: 'guide_utilisateur' },
      },
      {
        category: 'trajet',
        title: 'Trajets multi-segments',
        content: `Certains trajets comportent des arrêts intermédiaires (segments) :
- Exemple : Ouagadougou → Koudougou → Bobo Dioulasso est composé de 2 segments.
- Vous pouvez réserver pour le trajet complet ou uniquement un segment (ex: Ouagadougou → Koudougou).
- Les prix sont calculés par segment : vous ne payez que la portion que vous utilisez.
- Les sièges sont gérés par segment, ce qui optimise le remplissage du bus.`,
        metadata: { source: 'guide_segments' },
      },

      // ── Gares ──
      {
        category: 'gare',
        title: 'Trouver une gare',
        content: `Pour trouver une gare routière :
- Utilisez la fonctionnalité "Gares à proximité" qui utilise votre position GPS.
- Vous verrez les gares les plus proches avec la distance et les prochains départs.
- Chaque fiche de gare affiche : adresse, horaires d'ouverture, équipements disponibles (WiFi, parking, salle d'attente), numéro de contact.
Les principales gares du réseau FasoTravel sont situées dans les grandes villes : Ouagadougou, Bobo Dioulasso, Koudougou, Ouahigouya, Banfora, Kaya.`,
        metadata: { source: 'guide_gares' },
      },

      // ── Bagages ──
      {
        category: 'bagage',
        title: 'Franchise de bagages',
        content: `Politique de bagages sur FasoTravel :
- Chaque passager a droit à un bagage en soute (max 25 kg) inclus dans le prix du billet.
- Un bagage à main (max 7 kg) est autorisé en cabine.
- Les bagages supplémentaires sont facturés selon la politique de chaque compagnie (généralement 500 à 2000 FCFA par bagage supplémentaire).
- Les objets volumineux ou fragiles doivent être signalés à l'avance.
- FasoTravel et les compagnies ne sont pas responsables des objets de valeur dans les bagages en soute. Gardez vos objets précieux avec vous.`,
        metadata: { source: 'politique_bagages' },
      },

      // ── Incidents ──
      {
        category: 'incident',
        title: 'Signaler un incident',
        content: `Pour signaler un incident :
1. Depuis la page du trajet en cours, appuyez sur "Signaler un incident".
2. Choisissez le type d'incident : retard, panne, accident, problème véhicule, autre.
3. Décrivez brièvement la situation.
4. Vous pouvez ajouter des photos si nécessaire.
5. L'incident sera transmis à la compagnie et au support FasoTravel.
En cas d'incident grave (accident), appelez immédiatement les secours (numéro d'urgence : 112) puis signalez dans l'application.`,
        metadata: { source: 'guide_incidents', priority: 'high' },
      },
      {
        category: 'incident',
        title: 'Retard de bus',
        content: `En cas de retard de votre bus :
- L'application vous notifie automatiquement si un retard est signalé par la compagnie.
- Vous pouvez suivre l'état de votre trajet en temps réel (si le suivi GPS est activé par la compagnie).
- Si le retard dépasse 2 heures, vous pouvez demander un remboursement ou un report de trajet.
- Contactez le support via le chat si vous avez besoin d'assistance immédiate.`,
        metadata: { source: 'faq_incidents' },
      },

      // ── Compte utilisateur ──
      {
        category: 'compte',
        title: 'Créer et gérer son compte',
        content: `Pour créer un compte FasoTravel :
- Inscription avec numéro de téléphone ou email.
- Vérification par code OTP envoyé par SMS.
- Complétez votre profil : nom, prénom, email, photo (optionnel).
Pour modifier vos informations :
- Allez dans Profil > Modifier le profil.
- Vous pouvez changer votre nom, email, photo de profil et mot de passe.
Pour supprimer votre compte :
- Contactez le support. La suppression est irréversible et entraîne la perte de l'historique de voyages.`,
        metadata: { source: 'guide_compte' },
      },
      {
        category: 'compte',
        title: 'Parrainage et réductions',
        content: `Programme de parrainage FasoTravel :
- Partagez votre code de parrainage avec vos amis.
- Quand un ami s'inscrit avec votre code et effectue son premier voyage, vous recevez tous les deux une réduction.
- Les réductions sont appliquées automatiquement sur votre prochain achat.
- Consultez vos parrainages dans Profil > "Mes parrainages".
Des promotions temporaires sont également proposées régulièrement. Consultez la section "Promotions" dans l'application.`,
        metadata: { source: 'guide_parrainage' },
      },

      // ── Sécurité ──
      {
        category: 'securite',
        title: 'Sécurité du voyage',
        content: `Mesures de sécurité FasoTravel :
- Tous les véhicules sont régulièrement inspectés.
- Les compagnies partenaires respectent les normes de sécurité routière.
- En cas d'urgence pendant le trajet, le chauffeur dispose d'un kit de premiers secours et d'un extincteur.
- Le numéro d'urgence national est le 112.
- FasoTravel ne gère pas les chauffeurs directement — ce sont les compagnies de transport qui emploient et gèrent leurs conducteurs.`,
        metadata: { source: 'guide_securite' },
      },

      // ── Application ──
      {
        category: 'application',
        title: "À propos de l'application FasoTravel",
        content: `FasoTravel est la plateforme de réservation de bus et transport interurbain au Burkina Faso.
Fonctionnalités principales :
- Recherche et réservation de trajets entre les principales villes du Burkina Faso.
- Paiement mobile (Orange Money, Moov Money) et par carte bancaire.
- Billets électroniques avec QR code.
- Suivi de trajet en temps réel (quand disponible).
- Signalement d'incidents.
- Support client par assistant intelligent et agents humains.
- Programme de parrainage et promotions.
L'application est disponible sur Android et iOS.`,
        metadata: { source: 'presentation_app', priority: 'high' },
      },
      {
        category: 'application',
        title: 'Problèmes techniques courants',
        content: `Solutions aux problèmes techniques courants :
- "L'application ne se charge pas" : Vérifiez votre connexion internet. Essayez de fermer et rouvrir l'application.
- "Je ne reçois pas le code OTP" : Vérifiez que votre numéro est correct. Attendez 60 secondes avant de renvoyer. Si le problème persiste, essayez par email.
- "Mes billets n'apparaissent pas" : Tirez vers le bas pour rafraîchir. Si le problème persiste, déconnectez-vous et reconnectez-vous.
- "L'application plante" : Mettez à jour vers la dernière version depuis le Play Store ou l'App Store. Si le problème persiste, désinstallez et réinstallez l'application.`,
        metadata: { source: 'faq_technique' },
      },

      // ── Compagnies ──
      {
        category: 'compagnie',
        title: 'Compagnies de transport partenaires',
        content: `FasoTravel travaille avec plusieurs compagnies de transport au Burkina Faso :
- Chaque compagnie a ses propres véhicules, horaires et politiques.
- Les prix peuvent varier d'une compagnie à l'autre pour le même trajet.
- Les conditions d'annulation et de remboursement dépendent de chaque compagnie.
- Vous pouvez consulter les avis et notes des autres voyageurs pour chaque compagnie.
- FasoTravel est un intermédiaire de réservation et ne gère pas directement les opérations de transport.`,
        metadata: { source: 'guide_compagnies' },
      },

      // ── Contact / Escalade ──
      {
        category: 'contact',
        title: 'Contacter le support',
        content: `Pour contacter le support FasoTravel :
- Chat intelligent : Disponible 24h/24 via le bouton "Chat" dans l'application. Un assistant IA vous répondra instantanément.
- Escalade vers un agent : Si l'assistant ne peut pas résoudre votre problème, il vous transfère automatiquement vers un agent humain.
- Email : support@fasotravel.bf
- Téléphone : +226 25 00 00 00 (Lundi-Vendredi 8h-18h, Samedi 8h-12h)
- Les agents humains sont disponibles pendant les heures ouvrables. En dehors de ces heures, l'assistant IA prend le relais.`,
        metadata: { source: 'guide_contact', priority: 'high' },
      },
    ];
  }
}
