/**
 * CONFIGURATION BUSINESS - TransportBF Dashboard
 * 
 * Ce fichier centralise toutes les constantes métier de l'application.
 * Modifiez ces valeurs pour ajuster le comportement business sans toucher au code.
 */

export const BUSINESS_CONFIG = {
  /**
   * 💰 COMMISSIONS & REVENUS
   * Business model FasoTravel
   */
  COMMISSION: {
    /** Taux de commission sur ventes en ligne (app mobile) */
    RATE: 0.05, // 5%
    
    /** Commission minimum en FCFA */
    MIN_AMOUNT: 100,
    
    /** Description affichée */
    DESCRIPTION: 'Commission sur ventes via app mobile FasoTravel',
  },

  /**
   * 🎯 OBJECTIFS & KPIs
   */
  ADOPTION: {
    /** Objectif de taux d'adoption de l'app mobile (%) */
    TARGET: 60,
    
    /** Seuil considéré comme "bon" (%) */
    MIN_GOOD: 50,
    
    /** Seuil d'alerte bas (%) */
    WARNING: 30,
  },

  /**
   * ⏰ FENÊTRES TEMPORELLES
   */
  TIME_WINDOWS: {
    /** Fenêtre "Prochains départs" en heures */
    UPCOMING_TRIPS_HOURS: 6,
    
    /** Période "récente" en jours (pour historiques) */
    RECENT_DAYS: 7,
    
    /** Période "mois" en jours */
    MONTH_DAYS: 30,
  },

  /**
   * 🚌 CAPACITÉS VÉHICULES
   */
  VEHICLE_CAPACITY: {
    /** Bus standard (places) */
    STANDARD: 45,
    
    /** Bus VIP (places) - Plus spacieux */
    VIP: 35,
    
    /** Mini-bus */
    MINIBUS: 25,
  },

  /**
   * ❌ POLITIQUE D'ANNULATION
   */
  CANCELLATION: {
    /** Délai pour remboursement 100% (heures avant départ) */
    FULL_REFUND_HOURS: 24,
    
    /** Délai pour remboursement partiel (heures avant départ) */
    PARTIAL_REFUND_HOURS: 12,
    
    /** Pourcentage de remboursement partiel */
    PARTIAL_REFUND_PERCENT: 50,
    
    /** Frais administratifs en FCFA */
    ADMIN_FEE: 500,
  },

  /**
   * 🎫 TARIFICATION
   */
  PRICING: {
    /** Majoration prix VIP vs Standard (%) */
    VIP_MARKUP: 30, // +30%
    
    /** Réduction étudiants (%) */
    STUDENT_DISCOUNT: 15, // -15%
    
    /** Réduction enfants (%) */
    CHILD_DISCOUNT: 25, // -25%
  },

  /**
   * 💵 GESTION CAISSE
   */
  CASH_MANAGEMENT: {
    /** Montant minimum en caisse (FCFA) */
    MIN_CASH_BALANCE: 10000,
    
    /** Alerte montant élevé en caisse (FCFA) */
    HIGH_CASH_ALERT: 500000,
    
    /** Versement bancaire recommandé au-delà de (FCFA) */
    BANK_DEPOSIT_THRESHOLD: 1000000,
  },

  /**
   * 📊 SEUILS PERFORMANCE
   */
  PERFORMANCE: {
    /** Taux de remplissage excellent (%) */
    FILL_RATE_EXCELLENT: 80,
    
    /** Taux de remplissage bon (%) */
    FILL_RATE_GOOD: 50,
    
    /** Taux de remplissage minimum acceptable (%) */
    FILL_RATE_MIN: 30,
  },

  /**
   * 📱 NOTIFICATIONS & ALERTES
   */
  ALERTS: {
    /** Délai avant départ pour notifier passagers (minutes) */
    DEPARTURE_REMINDER_MINUTES: 60,
    
    /** Délai avant départ pour bloquer ventes (minutes) */
    SALES_CUTOFF_MINUTES: 15,
  },

} as const;

/**
 * 📝 GÉNÉRATEUR DE TEXTE POLITIQUE ANNULATION
 * Génère dynamiquement le texte selon la config
 */
export function getCancellationPolicyText(): string {
  const { FULL_REFUND_HOURS, PARTIAL_REFUND_HOURS, PARTIAL_REFUND_PERCENT, ADMIN_FEE } = 
    BUSINESS_CONFIG.CANCELLATION;

  return `• Annulation >${FULL_REFUND_HOURS}h avant départ : remboursement 100%
• Annulation ${PARTIAL_REFUND_HOURS}-${FULL_REFUND_HOURS}h avant : remboursement ${PARTIAL_REFUND_PERCENT}%
• Annulation <${PARTIAL_REFUND_HOURS}h avant : aucun remboursement
• Frais administratifs : ${ADMIN_FEE.toLocaleString('fr-FR')} FCFA`;
}

/**
 * 💰 CALCULATEUR DE COMMISSION
 */
export function calculateCommission(price: number): number {
  const commission = price * BUSINESS_CONFIG.COMMISSION.RATE;
  return Math.max(commission, BUSINESS_CONFIG.COMMISSION.MIN_AMOUNT);
}

/**
 * 🎯 VÉRIFICATEUR OBJECTIF ADOPTION
 */
export function checkAdoptionRate(rate: number): {
  status: 'excellent' | 'good' | 'warning' | 'critical';
  message: string;
} {
  const { TARGET, MIN_GOOD, WARNING } = BUSINESS_CONFIG.ADOPTION;

  if (rate >= TARGET) {
    return { 
      status: 'excellent', 
      message: `✓ Objectif atteint (${TARGET}%+)` 
    };
  } else if (rate >= MIN_GOOD) {
    return { 
      status: 'good', 
      message: `Bon taux - Objectif: ${TARGET}% (${TARGET - rate}% à atteindre)` 
    };
  } else if (rate >= WARNING) {
    return { 
      status: 'warning', 
      message: `⚠️ Faible adoption - Objectif: ${TARGET}%` 
    };
  } else {
    return { 
      status: 'critical', 
      message: `🚨 Très faible adoption (${rate}%) - Actions urgentes requises` 
    };
  }
}

/**
 * 🚌 CALCULATEUR TAUX REMPLISSAGE
 */
export function getFillRateStatus(fillRate: number): {
  color: string;
  label: string;
  status: 'excellent' | 'good' | 'low';
} {
  const { FILL_RATE_EXCELLENT, FILL_RATE_GOOD } = BUSINESS_CONFIG.PERFORMANCE;

  if (fillRate >= FILL_RATE_EXCELLENT) {
    return { color: '#16a34a', label: 'Excellent', status: 'excellent' };
  } else if (fillRate >= FILL_RATE_GOOD) {
    return { color: '#f59e0b', label: 'Bon', status: 'good' };
  } else {
    return { color: '#dc2626', label: 'Faible', status: 'low' };
  }
}

/**
 * 💵 CALCULATEUR REMBOURSEMENT ANNULATION
 */
export function calculateRefund(
  price: number, 
  hoursBeforeDeparture: number
): {
  refundAmount: number;
  refundPercent: number;
  adminFee: number;
  netRefund: number;
} {
  const { FULL_REFUND_HOURS, PARTIAL_REFUND_HOURS, PARTIAL_REFUND_PERCENT, ADMIN_FEE } = 
    BUSINESS_CONFIG.CANCELLATION;

  let refundPercent = 0;

  if (hoursBeforeDeparture >= FULL_REFUND_HOURS) {
    refundPercent = 100;
  } else if (hoursBeforeDeparture >= PARTIAL_REFUND_HOURS) {
    refundPercent = PARTIAL_REFUND_PERCENT;
  } else {
    refundPercent = 0;
  }

  const refundAmount = (price * refundPercent) / 100;
  const netRefund = Math.max(0, refundAmount - ADMIN_FEE);

  return {
    refundAmount,
    refundPercent,
    adminFee: refundPercent > 0 ? ADMIN_FEE : 0,
    netRefund,
  };
}

/**
 * 💰 CALCULATEUR PRIX VIP
 */
export function calculateVIPPrice(standardPrice: number): number {
  return Math.round(standardPrice * (1 + BUSINESS_CONFIG.PRICING.VIP_MARKUP / 100));
}

// Export par défaut
export default BUSINESS_CONFIG;
