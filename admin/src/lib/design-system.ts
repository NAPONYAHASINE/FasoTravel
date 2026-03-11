/**
 * Design System FasoTravel Admin
 * 
 * Ce fichier définit TOUS les tokens de design pour garantir
 * une cohérence parfaite à travers toute l'application.
 */

// ============================================
// COULEURS - Identité Visuelle Burkina Faso
// ============================================

export const COLORS = {
  // Couleurs principales (drapeau burkinabé)
  primary: {
    red: '#dc2626',      // Rouge
    yellow: '#f59e0b',   // Jaune
    green: '#16a34a',    // Vert
  },
  
  // Nuances de rouge (couleur primaire)
  red: {
    50: '#fef2f2',
    100: '#fee2e2',
    500: '#dc2626',
    600: '#b91c1c',
    700: '#991b1b',
  },
  
  // Nuances de jaune
  yellow: {
    50: '#fefce8',
    100: '#fef9c3',
    500: '#f59e0b',
    600: '#d97706',
  },
  
  // Nuances de vert
  green: {
    50: '#f0fdf4',
    100: '#dcfce7',
    500: '#16a34a',
    600: '#15803d',
  },
  
  // Gris (UI)
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  
  // Couleurs fonctionnelles
  success: '#16a34a',
  warning: '#f59e0b',
  error: '#dc2626',
  info: '#3b82f6',
} as const;

// ============================================
// GRADIENTS
// ============================================

export const GRADIENTS = {
  // Gradient principal (drapeau)
  burkinabe: 'linear-gradient(to right, #dc2626, #f59e0b, #16a34a)',
  
  // Gradients pour items actifs
  activeRed: 'linear-gradient(to right, #dc2626, #b91c1c)',
  activeYellow: 'linear-gradient(to right, #f59e0b, #d97706)',
  activeGreen: 'linear-gradient(to right, #16a34a, #15803d)',
  
  // Backgrounds légers
  bgRed: 'linear-gradient(to bottom right, #fef2f2, #fee2e2)',
  bgYellow: 'linear-gradient(to bottom right, #fefce8, #fef9c3)',
  bgGreen: 'linear-gradient(to bottom right, #f0fdf4, #dcfce7)',
} as const;

// ============================================
// LAYOUT
// ============================================

export const LAYOUT = {
  // Sidebar
  sidebar: {
    width: {
      expanded: '288px',   // w-72
      collapsed: '80px',   // w-20
    },
    zIndex: 40,
  },
  
  // TopBar
  topbar: {
    height: '64px',        // h-16
    zIndex: 30,
  },
  
  // Page Container
  page: {
    padding: '32px',       // p-8
    maxWidth: '1536px',    // max-w-screen-2xl
  },
  
  // Z-Index Scale
  zIndex: {
    base: 0,
    dropdown: 20,
    sticky: 30,
    overlay: 40,
    modal: 50,
  },
} as const;

// ============================================
// TYPOGRAPHY
// ============================================

export const TYPOGRAPHY = {
  // Titres de pages
  pageTitle: {
    desktop: 'text-3xl font-bold text-gray-900',
    mobile: 'text-2xl font-bold text-gray-900',
  },
  
  // Sous-titres
  pageSubtitle: 'text-base text-gray-600',
  
  // Titres de sections
  sectionTitle: 'text-xl font-semibold text-gray-900',
  
  // Titres de cartes
  cardTitle: 'text-lg font-semibold text-gray-900',
  
  // Corps de texte
  body: 'text-sm text-gray-700',
  bodySecondary: 'text-sm text-gray-600',
  caption: 'text-xs text-gray-500',
} as const;

// ============================================
// SPACING
// ============================================

export const SPACING = {
  // Sections
  sectionGap: 'space-y-8',
  
  // Cards
  cardGap: 'gap-6',
  cardPadding: 'p-6',
  
  // Forms
  formGap: 'space-y-4',
  inputGap: 'gap-3',
} as const;

// ============================================
// COMPONENTS
// ============================================

export const COMPONENTS = {
  // Bouton principal (drapeau burkinabé)
  buttonPrimary: `
    inline-flex items-center gap-2 px-6 py-3 
    text-white font-medium rounded-lg
    shadow-lg hover:shadow-xl 
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500
  `,
  
  // Bouton secondaire
  buttonSecondary: `
    inline-flex items-center gap-2 px-6 py-3
    bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-lg
    border border-gray-300 dark:border-gray-600
    hover:bg-gray-50 dark:hover:bg-gray-700
    transition-colors duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500
  `,
  
  // Bouton danger
  buttonDanger: `
    inline-flex items-center gap-2 px-6 py-3
    bg-red-600 text-white font-medium rounded-lg
    hover:bg-red-700
    transition-colors duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500
  `,
  
  // Card standard
  card: `
    bg-white dark:bg-gray-800 rounded-xl shadow-md
    border border-gray-200 dark:border-gray-700
    hover:shadow-lg
    transition-all duration-200
  `,
  
  // Input
  input: `
    w-full px-4 py-3
    border border-gray-300 dark:border-gray-600 rounded-lg
    text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
    bg-white dark:bg-gray-700
    focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent
    transition-all duration-200
  `,
  
  // Badge status
  badgeActive: 'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
  badgeInactive: 'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
  badgePending: 'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
  badgeInfo: 'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
} as const;

// ============================================
// PAGE TEMPLATES
// ============================================

export const PAGE_CLASSES = {
  // Container principal de page
  container: 'min-h-screen bg-white dark:bg-gray-900 p-8 transition-colors',
  
  // Content wrapper (avec max-width)
  content: 'max-w-screen-2xl mx-auto',
  
  // Header de page
  header: 'mb-8',
  headerContent: 'flex items-start justify-between gap-4 flex-wrap',
  headerTexts: 'flex-1 min-w-0',
  headerActions: 'flex items-center gap-3',
  
  // Stats grid
  statsGrid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8',
  
  // Search section
  searchSection: 'bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700 transition-colors',
  
  // Content grid
  contentGrid: 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6',
  
  // Table container
  tableContainer: 'bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 transition-colors',
} as const;

// ============================================
// ANIMATIONS
// ============================================

export const ANIMATIONS = {
  transition: 'transition-all duration-200',
  transitionSlow: 'transition-all duration-300',
  hover: 'hover:scale-105 transition-transform duration-200',
  fadeIn: 'animate-fadeIn',
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Retourne les classes CSS pour un bouton avec gradient burkinabé
 */
export function getGradientButtonClasses(): string {
  return `${COMPONENTS.buttonPrimary}`.trim();
}

/**
 * Retourne les classes CSS pour un item de navigation actif
 */
export function getActiveNavClasses(): string {
  return 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30';
}

/**
 * Retourne les classes CSS pour un badge de statut
 */
export function getStatusBadgeClasses(status: 'active' | 'inactive' | 'pending' | 'info'): string {
  const badges = {
    active: COMPONENTS.badgeActive,
    inactive: COMPONENTS.badgeInactive,
    pending: COMPONENTS.badgePending,
    info: COMPONENTS.badgeInfo,
  };
  return badges[status];
}

/**
 * Retourne le style inline pour un bouton gradient
 */
export function getGradientButtonStyle(): Record<string, string> {
  return {
    background: GRADIENTS.burkinabe,
  };
}