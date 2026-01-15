/**
 * CONSTANTES PARTAGÉES MOBILE + DASHBOARD
 * 
 * ⚠️ CRITICAL: Ces valeurs DOIVENT être identiques entre:
 * - FasoTravel Mobile (app passagers)
 * - Dashboard Web (backoffice sociétés)
 * - Backend API
 * 
 * Toute modification ici doit être synchronisée avec le mobile !
 */

export const SHARED_BUSINESS_RULES = {
  // ========================================
  // RÉSERVATIONS
  // ========================================
  
  /**
   * Durée de maintien d'une réservation (HOLD) en minutes
   * Utilisé pour les réservations en attente de paiement
   */
  RESERVATION_TTL_MINUTES: 10,
  
  /**
   * Délai minimum avant le départ pour annuler un billet (en heures)
   * Les annulations sont refusées si le départ est dans moins de X heures
   */
  CANCELLATION_HOURS_BEFORE: 1,
  
  /**
   * Nombre minimum de places par réservation
   */
  MIN_SEATS_PER_BOOKING: 1,
  
  /**
   * Nombre maximum de places par réservation
   */
  MAX_SEATS_PER_BOOKING: 10,
  
  // ========================================
  // COMMISSION & PAIEMENTS
  // ========================================
  
  /**
   * Taux de commission pour les ventes en ligne (5%)
   * Appliqué UNIQUEMENT quand salesChannel='online'
   * 
   * ⚠️ CRITIQUE: Cette commission est prélevée sur les ventes app mobile
   * et représente le business model principal de FasoTravel
   */
  COMMISSION_RATE_ONLINE: 0.05,
  
  /**
   * Moyens de paiement autorisés pour ventes ONLINE (app mobile)
   * ⚠️ CASH interdit pour online (pas de paiement physique possible)
   */
  ONLINE_PAYMENT_METHODS: ['mobile_money', 'card'] as const,
  
  /**
   * Moyens de paiement autorisés pour ventes COUNTER (guichet)
   * Cash autorisé car paiement physique au guichet
   */
  COUNTER_PAYMENT_METHODS: ['cash', 'mobile_money', 'card'] as const,
  
  // ========================================
  // DONNÉES & PRIVACY
  // ========================================
  
  /**
   * Nombre de jours avant purge automatique des données de géolocalisation
   * Conformité RGPD / privacy
   */
  GEOLOCATION_PURGE_DAYS: 7,
  
  /**
   * Nombre maximum de transferts autorisés pour un billet
   * Limite les abus de revente
   */
  MAX_TRANSFER_COUNT: 1,
  
  // ========================================
  // STORIES (PUBLICITÉS)
  // ========================================
  
  /**
   * Durée minimale d'affichage d'une story (en secondes)
   */
  STORY_MIN_DURATION: 5,
  
  /**
   * Durée maximale d'affichage d'une story (en secondes)
   */
  STORY_MAX_DURATION: 30,
  
  /**
   * Durée par défaut d'une story si non spécifiée (en secondes)
   */
  STORY_DEFAULT_DURATION: 10,
  
  // ========================================
  // STATUTS
  // ========================================
  
  /**
   * Statuts possibles pour un trajet
   */
  TRIP_STATUSES: [
    'scheduled',  // Programmé (pas encore en embarquement)
    'boarding',   // En embarquement
    'departed',   // Parti (en route)
    'arrived',    // Arrivé
    'cancelled'   // Annulé
  ] as const,
  
  /**
   * Statuts possibles pour un billet
   */
  TICKET_STATUSES: [
    'valid',      // Valide (acheté, pas encore utilisé)
    'used',       // Utilisé (voyage effectué)
    'refunded',   // Remboursé
    'cancelled'   // Annulé
  ] as const,
  
  /**
   * Canaux de vente possibles
   * CRITIQUE pour le business model
   */
  SALES_CHANNELS: [
    'online',   // App mobile FasoTravel (avec commission 5%)
    'counter'   // Vente au guichet (sans commission)
  ] as const,
  
  // ========================================
  // VALIDATION
  // ========================================
  
  /**
   * Regex pour validation numéro de téléphone burkinabè
   * Format: +226 XX XX XX XX
   */
  PHONE_REGEX: /^\+226\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}$/,
  
  /**
   * Regex pour validation numéro de siège
   * Format: 1A, 2B, 12C, etc.
   */
  SEAT_NUMBER_REGEX: /^[0-9]{1,2}[A-D]$/,
  
} as const;

/**
 * Type helper pour les canaux de vente
 */
export type SalesChannel = typeof SHARED_BUSINESS_RULES.SALES_CHANNELS[number];

/**
 * Type helper pour les statuts de trajet
 */
export type TripStatus = typeof SHARED_BUSINESS_RULES.TRIP_STATUSES[number];

/**
 * Type helper pour les statuts de billet
 */
export type TicketStatus = typeof SHARED_BUSINESS_RULES.TICKET_STATUSES[number];

/**
 * Type helper pour les moyens de paiement online
 */
export type OnlinePaymentMethod = typeof SHARED_BUSINESS_RULES.ONLINE_PAYMENT_METHODS[number];

/**
 * Type helper pour les moyens de paiement counter
 */
export type CounterPaymentMethod = typeof SHARED_BUSINESS_RULES.COUNTER_PAYMENT_METHODS[number];

/**
 * RÈGLES MÉTIER CRITIQUES
 * 
 * Ces règles DOIVENT être respectées dans tout le code
 */
export const BUSINESS_LOGIC_RULES = {
  /**
   * Règle 1: Séparation stricte online/counter
   * - salesChannel='online' → SEULEMENT mobile_money ou card
   * - salesChannel='counter' → cash, mobile_money, ou card
   */
  validatePaymentMethod(
    salesChannel: SalesChannel, 
    paymentMethod: OnlinePaymentMethod | CounterPaymentMethod
  ): boolean {
    if (salesChannel === 'online') {
      return SHARED_BUSINESS_RULES.ONLINE_PAYMENT_METHODS.includes(paymentMethod as OnlinePaymentMethod);
    } else {
      return SHARED_BUSINESS_RULES.COUNTER_PAYMENT_METHODS.includes(paymentMethod as CounterPaymentMethod);
    }
  },
  
  /**
   * Règle 2: Commission calculée UNIQUEMENT pour online
   */
  calculateCommission(price: number, salesChannel: SalesChannel): number {
    if (salesChannel === 'online') {
      return price * SHARED_BUSINESS_RULES.COMMISSION_RATE_ONLINE;
    }
    return 0;
  },
  
  /**
   * Règle 3: Validation annulation selon délai
   */
  canCancelTicket(departureTime: string): boolean {
    const departure = new Date(departureTime);
    const now = new Date();
    const hoursUntilDeparture = (departure.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilDeparture >= SHARED_BUSINESS_RULES.CANCELLATION_HOURS_BEFORE;
  },
  
  /**
   * Règle 4: Validation durée de story
   */
  isValidStoryDuration(duration: number): boolean {
    return duration >= SHARED_BUSINESS_RULES.STORY_MIN_DURATION && 
           duration <= SHARED_BUSINESS_RULES.STORY_MAX_DURATION;
  },
  
  /**
   * Règle 5: Validation nombre de sièges
   */
  isValidSeatsCount(count: number): boolean {
    return count >= SHARED_BUSINESS_RULES.MIN_SEATS_PER_BOOKING && 
           count <= SHARED_BUSINESS_RULES.MAX_SEATS_PER_BOOKING;
  },
} as const;

/**
 * EXPORT PAR DÉFAUT
 */
export default SHARED_BUSINESS_RULES;
