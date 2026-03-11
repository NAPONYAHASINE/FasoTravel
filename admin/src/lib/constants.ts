// ==================== COLORS ====================

export const COLORS = {
  red: '#EF2B2D',      // Rouge exact du drapeau burkinabé
  yellow: '#FCD116',   // Jaune/Or exact du drapeau burkinabé
  green: '#009E49',    // Vert exact du drapeau burkinabé
  blue: '#3b82f6',
  gray: '#6b7280',
  
  // Aliases pour compatibilité
  redBright: '#EF2B2D',
  yellowBright: '#FCD116',
  greenBright: '#009E49',
} as const;

// ==================== BRAND ====================

export const BRAND = {
  name: 'FasoTravel',
  tagline: 'Plateforme de Transport au Burkina Faso',
  adminTagline: 'Admin Dashboard',
  logoAsset: 'figma:asset/ddaf4c7eb0e28936f4d0223e859065e25d5c3fc8.png'
} as const;

export const GRADIENTS = {
  primary: 'linear-gradient(to right, #EF2B2D, #FCD116, #009E49)',
  diagonal: 'linear-gradient(135deg, #EF2B2D 0%, #FCD116 50%, #009E49 100%)',
  subtle: {
    light: 'linear-gradient(to bottom right, #fef2f2, #fef3c7, #f0fdf4)',
    dark: 'linear-gradient(to bottom right, #1f2937, #1c1917, #14532d)'
  }
} as const;

// ==================== REGIONS ====================

export const BURKINA_REGIONS = [
  'Centre',
  'Hauts-Bassins',
  'Sud-Ouest',
  'Nord',
  'Est',
  'Centre-Est',
  'Centre-Ouest',
  'Boucle du Mouhoun',
  'Sahel',
  'Centre-Nord',
  'Plateau-Central',
  'Cascades',
  'Centre-Sud'
] as const;

export const MAJOR_CITIES = [
  'Ouagadougou',
  'Bobo-Dioulasso',
  'Koudougou',
  'Ouahigouya',
  'Banfora',
  'Fada N\'Gourma',
  'Kaya',
  'Tenkodogo',
  'Dédougou',
  'Gaoua',
  'Dori',
  'Ziniaré'
] as const;

// ==================== POPULAR ROUTES ====================

export const POPULAR_ROUTES = [
  { from: 'Ouagadougou', to: 'Bobo-Dioulasso', distance: 365 },
  { from: 'Ouagadougou', to: 'Koudougou', distance: 97 },
  { from: 'Bobo-Dioulasso', to: 'Banfora', distance: 85 },
  { from: 'Ouagadougou', to: 'Fada N\'Gourma', distance: 219 },
  { from: 'Ouagadougou', to: 'Kaya', distance: 100 },
  { from: 'Ouagadougou', to: 'Tenkodogo', distance: 198 },
  { from: 'Bobo-Dioulasso', to: 'Ouahigouya', distance: 250 },
] as const;

// ==================== COMPANY NAMES ====================

export const TRANSPORT_COMPANIES = [
  'TSR Transport',
  'STAF Express',
  'Rakieta Transport',
  'SOGEBAF',
] as const;

// ==================== TIME CONSTANTS ====================

export const TIME = {
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
} as const;

// ==================== STATUS LABELS ====================

export const STATUS_LABELS = {
  bus: {
    'en-route': 'En Route',
    'delay': 'Retard',
    'incident': 'Incident',
    'maintenance': 'Maintenance',
    'parked': 'Garé'
  },
  booking: {
    'EN_ATTENTE': 'En Attente',
    'CONFIRMÉ': 'Confirmé',
    'ANNULÉ': 'Annulé',
    'TERMINÉ': 'Terminé'
  },
  ticket: {
    'ACTIF': 'Actif',
    'EMBARQUÉ': 'Embarqué',
    'EXPIRÉ': 'Expiré',
    'ANNULÉ': 'Annulé'
  },
  supportTicket: {
    'open': 'Ouvert',
    'in-progress': 'En Cours',
    'resolved': 'Résolu',
    'closed': 'Fermé'
  },
  incident: {
    'open': 'Ouvert',
    'in-progress': 'En Cours',
    'resolved': 'Résolu'
  },
  integration: {
    'active': 'Actif',
    'inactive': 'Inactif',
    'error': 'Erreur'
  },
  payment: {
    'pending': 'En Attente',
    'completed': 'Complété',
    'failed': 'Échoué',
    'refunded': 'Remboursé'
  },
  review: {
    'PENDING': 'En Attente',
    'APPROVED': 'Approuvé',
    'REJECTED': 'Rejeté'
  }
} as const;

// ==================== PAYMENT METHOD LABELS ====================
// Clés alignées sur les valeurs mock de adminMockData.ts (mobile_money, card, cash)

export const PAYMENT_METHOD_LABELS = {
  'mobile_money': 'Mobile Money',
  'card': 'Carte Bancaire',
  'cash': 'Espèces'
} as const;

// ==================== USER ROLE LABELS ====================

export const USER_ROLE_LABELS = {
  'USER': 'Utilisateur',
  'OPERATOR_ADMIN': 'Admin Opérateur',
  'SUPER_ADMIN': 'Super Admin'
} as const;

// ==================== DEVICE TYPE LABELS ====================

export const DEVICE_TYPE_LABELS = {
  'MOBILE_APP': 'Application Mobile',
  'MOBILE_WEB': 'Web Mobile',
  'DESKTOP_WEB': 'Web Desktop',
  'KIOSK': 'Borne'
} as const;

// ==================== PRIORITY LABELS ====================

export const PRIORITY_LABELS = {
  'low': 'Basse',
  'medium': 'Moyenne',
  'high': 'Élevée',
  'urgent': 'Urgent',
  'critical': 'Critique'
} as const;

// ==================== CURRENCY ====================

export const CURRENCY = {
  symbol: 'FCFA',
  code: 'XOF',
  locale: 'fr-BF'
} as const;

// ==================== PAGINATION ====================

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100]
} as const;