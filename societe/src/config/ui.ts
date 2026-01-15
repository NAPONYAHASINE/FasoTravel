/**
 * CONFIGURATION UI/UX - TransportBF Dashboard
 * 
 * Constantes pour l'interface utilisateur, thèmes, et préférences d'affichage.
 */

export const UI_CONFIG = {
  /**
   * 🎨 COULEURS THÉMATIQUES
   * Basées sur le drapeau du Burkina Faso
   */
  COLORS: {
    /** Rouge - Couleur primaire */
    PRIMARY_RED: '#dc2626',
    PRIMARY_RED_BRIGHT: '#EF2B2D',
    
    /** Jaune/Or - Couleur secondaire */
    SECONDARY_YELLOW: '#f59e0b',
    SECONDARY_YELLOW_BRIGHT: '#FCD116',
    
    /** Vert - Couleur tertiaire */
    TERTIARY_GREEN: '#16a34a',
    TERTIARY_GREEN_BRIGHT: '#009E49',
    
    /** Gradient Burkina Faso */
    GRADIENT_BF: 'linear-gradient(135deg, #EF2B2D 0%, #FCD116 50%, #009E49 100%)',
  },

  /**
   * 📊 SEUILS VISUELS
   */
  THRESHOLDS: {
    /** Taux de remplissage bus */
    BUS_FILL: {
      EXCELLENT: 80,  // Vert
      GOOD: 50,       // Jaune
      // < 50 = Rouge
    },
    
    /** Taux d'adoption app */
    ADOPTION: {
      TARGET: 60,     // Objectif
      GOOD: 50,       // Acceptable
      WARNING: 30,    // Alerte
    },
    
    /** Performance caissier (ventes/jour) */
    CASHIER_SALES: {
      EXCELLENT: 30,
      GOOD: 15,
      LOW: 5,
    },
  },

  /**
   * 📅 PÉRIODES DE FILTRAGE
   */
  TIME_FILTERS: {
    /** Options de filtrage standard */
    OPTIONS: [
      { value: 'today', label: "Aujourd'hui", days: 0 },
      { value: 'week', label: '7 derniers jours', days: 7 },
      { value: 'month', label: '30 derniers jours', days: 30 },
      { value: 'all', label: 'Tout', days: null },
    ],
    
    /** Période par défaut */
    DEFAULT: 'today',
  },

  /**
   * 📏 PAGINATION & LIMITES
   */
  PAGINATION: {
    /** Éléments par page par défaut */
    DEFAULT_PAGE_SIZE: 10,
    
    /** Options de taille de page */
    PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
    
    /** Maximum d'éléments à afficher avant pagination */
    MAX_ITEMS_BEFORE_PAGINATION: 20,
  },

  /**
   * 📱 RESPONSIVE BREAKPOINTS
   */
  BREAKPOINTS: {
    /** Mobile */
    MOBILE: 640,
    
    /** Tablette */
    TABLET: 768,
    
    /** Desktop */
    DESKTOP: 1024,
    
    /** Large desktop */
    DESKTOP_XL: 1280,
  },

  /**
   * 🔔 NOTIFICATIONS
   */
  NOTIFICATIONS: {
    /** Durée d'affichage par défaut (ms) */
    DEFAULT_DURATION: 3000,
    
    /** Durée pour erreurs (ms) */
    ERROR_DURATION: 5000,
    
    /** Durée pour succès (ms) */
    SUCCESS_DURATION: 2000,
    
    /** Position */
    POSITION: 'top-right' as const,
  },

  /**
   * 📊 GRAPHIQUES
   */
  CHARTS: {
    /** Couleurs pour graphiques (ordre: online, counter, autres) */
    COLORS: ['#dc2626', '#f59e0b', '#16a34a', '#3b82f6', '#8b5cf6'],
    
    /** Hauteur par défaut */
    DEFAULT_HEIGHT: 300,
    
    /** Animation */
    ANIMATION_DURATION: 300,
  },

  /**
   * 🔍 RECHERCHE
   */
  SEARCH: {
    /** Délai avant recherche (debounce en ms) */
    DEBOUNCE_MS: 300,
    
    /** Minimum de caractères avant recherche */
    MIN_CHARS: 2,
  },

  /**
   * 💾 CACHE & REFRESH
   */
  REFRESH: {
    /** Auto-refresh dashboard (secondes) */
    DASHBOARD_INTERVAL: 30,
    
    /** Auto-refresh départs en temps réel (secondes) */
    DEPARTURES_INTERVAL: 10,
    
    /** Désactivé par défaut (utilisateur peut activer) */
    AUTO_ENABLED: false,
  },

  /**
   * 🎭 ANIMATIONS
   */
  ANIMATIONS: {
    /** Durée standard (ms) */
    DURATION_STANDARD: 200,
    
    /** Durée lente (ms) */
    DURATION_SLOW: 300,
    
    /** Durée rapide (ms) */
    DURATION_FAST: 100,
    
    /** Easing function */
    EASING: 'ease-in-out',
  },

  /**
   * 📝 FORMATS D'AFFICHAGE
   */
  FORMATS: {
    /** Format date courte */
    DATE_SHORT: 'dd/MM/yyyy',
    
    /** Format date longue */
    DATE_LONG: 'dd MMMM yyyy',
    
    /** Format heure */
    TIME: 'HH:mm',
    
    /** Format datetime */
    DATETIME: 'dd/MM/yyyy HH:mm',
    
    /** Locale */
    LOCALE: 'fr-FR',
    
    /** Devise */
    CURRENCY: 'FCFA',
  },

  /**
   * 🖼️ IMAGES & ICÔNES
   */
  IMAGES: {
    /** Taille avatar par défaut */
    AVATAR_SIZE: 40,
    
    /** Taille logo */
    LOGO_SIZE: 48,
    
    /** Format image préféré */
    PREFERRED_FORMAT: 'webp',
  },

  /**
   * 📊 TABLEAUX
   */
  TABLES: {
    /** Lignes par page par défaut */
    ROWS_PER_PAGE: 10,
    
    /** Hauteur ligne */
    ROW_HEIGHT: 56,
    
    /** Afficher bordures */
    SHOW_BORDERS: true,
    
    /** Couleur alternée */
    STRIPED_ROWS: false,
  },

  /**
   * 🎯 BADGES & STATUTS
   */
  STATUS_COLORS: {
    // Statuts trips
    scheduled: { bg: '#dbeafe', text: '#1e40af', label: 'Programmé' },
    boarding: { bg: '#fef3c7', text: '#92400e', label: 'Embarquement' },
    departed: { bg: '#dcfce7', text: '#166534', label: 'Parti' },
    arrived: { bg: '#f3f4f6', text: '#4b5563', label: 'Arrivé' },
    cancelled: { bg: '#fee2e2', text: '#991b1b', label: 'Annulé' },
    
    // Statuts tickets
    valid: { bg: '#dcfce7', text: '#166534', label: 'Valide' },
    used: { bg: '#f3f4f6', text: '#4b5563', label: 'Utilisé' },
    refunded: { bg: '#fef3c7', text: '#92400e', label: 'Remboursé' },
    
    // Statuts incidents
    open: { bg: '#fee2e2', text: '#991b1b', label: 'Ouvert' },
    in_progress: { bg: '#fef3c7', text: '#92400e', label: 'En cours' },
    resolved: { bg: '#dcfce7', text: '#166534', label: 'Résolu' },
    
    // Statuts généraux
    active: { bg: '#dcfce7', text: '#166534', label: 'Actif' },
    inactive: { bg: '#fee2e2', text: '#991b1b', label: 'Inactif' },
    pending: { bg: '#fef3c7', text: '#92400e', label: 'En attente' },
  },

  /**
   * 🎨 THÈME DARK MODE
   */
  DARK_MODE: {
    /** Activé par défaut */
    DEFAULT_ENABLED: true,
    
    /** Autoriser switch utilisateur */
    ALLOW_TOGGLE: true,
    
    /** Persister préférence */
    PERSIST_PREFERENCE: true,
  },

} as const;

/**
 * 🎨 HELPER: Obtenir couleur de statut
 */
export function getStatusColor(status: string, type: 'bg' | 'text' = 'bg'): string {
  const statusConfig = UI_CONFIG.STATUS_COLORS[status as keyof typeof UI_CONFIG.STATUS_COLORS];
  return statusConfig ? statusConfig[type] : '#f3f4f6';
}

/**
 * 🏷️ HELPER: Obtenir label de statut
 */
export function getStatusLabel(status: string): string {
  const statusConfig = UI_CONFIG.STATUS_COLORS[status as keyof typeof UI_CONFIG.STATUS_COLORS];
  return statusConfig ? statusConfig.label : status;
}

/**
 * 💰 HELPER: Formater montant
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(UI_CONFIG.FORMATS.LOCALE, {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ` ${UI_CONFIG.FORMATS.CURRENCY}`;
}

/**
 * 📅 HELPER: Formater date
 */
export function formatDate(date: Date | string, format: 'short' | 'long' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (format === 'long') {
    return d.toLocaleDateString(UI_CONFIG.FORMATS.LOCALE, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
  
  return d.toLocaleDateString(UI_CONFIG.FORMATS.LOCALE);
}

/**
 * ⏰ HELPER: Formater heure
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString(UI_CONFIG.FORMATS.LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 📊 HELPER: Obtenir couleur graphique par index
 */
export function getChartColor(index: number): string {
  return UI_CONFIG.CHARTS.COLORS[index % UI_CONFIG.CHARTS.COLORS.length];
}

// Export par défaut
export default UI_CONFIG;
