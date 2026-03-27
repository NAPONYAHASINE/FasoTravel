/**
 * @file permissions.ts
 * @description Système de permissions granulaires pour FasoTravel Admin
 * 
 * ARCHITECTURE:
 * - Rôles prédéfinis (SUPER_ADMIN, OPERATOR_ADMIN, SUPPORT_ADMIN, FINANCE_ADMIN)
 * - Permissions par ressource (TRIPS, OPERATORS, BOOKINGS, etc.)
 * - Actions (CREATE, READ, UPDATE, DELETE, EXPORT, APPROVE)
 * - Scopes (ALL, OWN_OPERATOR, DASHBOARD_ONLY)
 */

// ==================== TYPES ====================

export type UserRole = 
  | 'SUPER_ADMIN'       // Accès complet au système
  | 'OPERATOR_ADMIN'    // Gestion trajets/réservations de son opérateur
  | 'SUPPORT_ADMIN'     // Gestion support client et tickets
  | 'FINANCE_ADMIN';    // Gestion paiements et analytics

export type ResourceType =
  | 'TRIPS'
  | 'OPERATORS'
  | 'STATIONS'
  | 'BOOKINGS'
  | 'PAYMENTS'
  | 'USERS'
  | 'PASSENGERS'
  | 'CONTENT'
  | 'ANALYTICS'
  | 'SETTINGS'
  | 'SUPPORT'
  | 'INCIDENTS'
  | 'LOGS'
  | 'INTEGRATIONS'
  | 'ADVERTISING'
  | 'PROMOTIONS'
  | 'REVIEWS'
  | 'SESSIONS'
  | 'POLICIES'
  | 'SERVICES'
  | 'NOTIFICATIONS'
  | 'TICKETS'
  | 'MAP'
  | 'REFERRALS';

export type ActionType =
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'EXPORT'
  | 'APPROVE'
  | 'SUSPEND'
  | 'MANAGE';

export type ScopeType =
  | 'ALL'              // Toutes les données
  | 'OWN_OPERATOR'     // Uniquement les données de son opérateur
  | 'DASHBOARD_ONLY';  // Vue lecture seule dashboard

export interface Permission {
  resource: ResourceType;
  action: ActionType;
  scope: ScopeType;
}

export interface RoleDefinition {
  name: string;
  description: string;
  permissions: Permission[];
  level: number;  // 1-4 (4 = le plus haut)
}

// ==================== DÉFINITIONS DES RÔLES ====================

/**
 * SUPER_ADMIN - Accès complet au système
 * Peut tout faire, partout
 */
export const SUPER_ADMIN_ROLE: RoleDefinition = {
  name: 'Super Admin',
  description: 'Accès complet au système FasoTravel',
  level: 4,
  permissions: [
    // Toutes les permissions sur toutes les ressources
    { resource: 'TRIPS', action: 'MANAGE', scope: 'ALL' },
    { resource: 'OPERATORS', action: 'MANAGE', scope: 'ALL' },
    { resource: 'STATIONS', action: 'MANAGE', scope: 'ALL' },
    { resource: 'BOOKINGS', action: 'MANAGE', scope: 'ALL' },
    { resource: 'PAYMENTS', action: 'MANAGE', scope: 'ALL' },
    { resource: 'USERS', action: 'MANAGE', scope: 'ALL' },
    { resource: 'PASSENGERS', action: 'MANAGE', scope: 'ALL' },
    { resource: 'CONTENT', action: 'MANAGE', scope: 'ALL' },
    { resource: 'ANALYTICS', action: 'MANAGE', scope: 'ALL' },
    { resource: 'SETTINGS', action: 'MANAGE', scope: 'ALL' },
    { resource: 'SUPPORT', action: 'MANAGE', scope: 'ALL' },
    { resource: 'INCIDENTS', action: 'MANAGE', scope: 'ALL' },
    { resource: 'LOGS', action: 'MANAGE', scope: 'ALL' },
    { resource: 'INTEGRATIONS', action: 'MANAGE', scope: 'ALL' },
    { resource: 'ADVERTISING', action: 'MANAGE', scope: 'ALL' },
    { resource: 'PROMOTIONS', action: 'MANAGE', scope: 'ALL' },
    { resource: 'REVIEWS', action: 'MANAGE', scope: 'ALL' },
    { resource: 'SESSIONS', action: 'MANAGE', scope: 'ALL' },
    { resource: 'POLICIES', action: 'MANAGE', scope: 'ALL' },
    { resource: 'SERVICES', action: 'MANAGE', scope: 'ALL' },
    { resource: 'NOTIFICATIONS', action: 'MANAGE', scope: 'ALL' },
    { resource: 'TICKETS', action: 'MANAGE', scope: 'ALL' },
    { resource: 'REFERRALS', action: 'MANAGE', scope: 'ALL' },
    { resource: 'MAP', action: 'READ', scope: 'ALL' }
  ]
};

/**
 * OPERATOR_ADMIN - Gestion trajets et réservations de son opérateur
 * Limité aux données de son opérateur uniquement
 */
export const OPERATOR_ADMIN_ROLE: RoleDefinition = {
  name: 'Admin Opérateur',
  description: 'Gestion trajets et réservations de son opérateur',
  level: 3,
  permissions: [
    // Trajets - CRUD complet pour son opérateur
    { resource: 'TRIPS', action: 'CREATE', scope: 'OWN_OPERATOR' },
    { resource: 'TRIPS', action: 'READ', scope: 'OWN_OPERATOR' },
    { resource: 'TRIPS', action: 'UPDATE', scope: 'OWN_OPERATOR' },
    { resource: 'TRIPS', action: 'DELETE', scope: 'OWN_OPERATOR' },
    
    // Réservations - Lecture + Modification (annulation, modification)
    { resource: 'BOOKINGS', action: 'READ', scope: 'OWN_OPERATOR' },
    { resource: 'BOOKINGS', action: 'UPDATE', scope: 'OWN_OPERATOR' },
    { resource: 'BOOKINGS', action: 'EXPORT', scope: 'OWN_OPERATOR' },
    
    // Tickets - Lecture
    { resource: 'TICKETS', action: 'READ', scope: 'OWN_OPERATOR' },
    
    // Paiements - Lecture seule
    { resource: 'PAYMENTS', action: 'READ', scope: 'OWN_OPERATOR' },
    { resource: 'PAYMENTS', action: 'EXPORT', scope: 'OWN_OPERATOR' },
    
    // Opérateurs - Lecture de ses propres données
    { resource: 'OPERATORS', action: 'READ', scope: 'OWN_OPERATOR' },
    { resource: 'OPERATORS', action: 'UPDATE', scope: 'OWN_OPERATOR' },
    
    // Stations - Lecture seule
    { resource: 'STATIONS', action: 'READ', scope: 'ALL' },
    
    // Analytics - Vue de ses données
    { resource: 'ANALYTICS', action: 'READ', scope: 'OWN_OPERATOR' },
    { resource: 'ANALYTICS', action: 'EXPORT', scope: 'OWN_OPERATOR' },
    
    // Incidents - Gestion pour ses trajets
    { resource: 'INCIDENTS', action: 'CREATE', scope: 'OWN_OPERATOR' },
    { resource: 'INCIDENTS', action: 'READ', scope: 'OWN_OPERATOR' },
    { resource: 'INCIDENTS', action: 'UPDATE', scope: 'OWN_OPERATOR' },
    
    // Avis - Lecture
    { resource: 'REVIEWS', action: 'READ', scope: 'OWN_OPERATOR' },
    
    // Map - Lecture
    { resource: 'MAP', action: 'READ', scope: 'OWN_OPERATOR' }
  ]
};

/**
 * SUPPORT_ADMIN - Gestion support client et tickets
 * Peut gérer réservations, annulations, support
 */
export const SUPPORT_ADMIN_ROLE: RoleDefinition = {
  name: 'Support Client',
  description: 'Gestion support, tickets et assistance utilisateurs',
  level: 2,
  permissions: [
    // Réservations - CRUD pour aide clients
    { resource: 'BOOKINGS', action: 'READ', scope: 'ALL' },
    { resource: 'BOOKINGS', action: 'UPDATE', scope: 'ALL' },  // Annulation
    { resource: 'BOOKINGS', action: 'EXPORT', scope: 'ALL' },
    
    // Tickets - CRUD complet
    { resource: 'TICKETS', action: 'READ', scope: 'ALL' },
    { resource: 'TICKETS', action: 'UPDATE', scope: 'ALL' },
    
    // Support - Gestion complète
    { resource: 'SUPPORT', action: 'CREATE', scope: 'ALL' },
    { resource: 'SUPPORT', action: 'READ', scope: 'ALL' },
    { resource: 'SUPPORT', action: 'UPDATE', scope: 'ALL' },
    { resource: 'SUPPORT', action: 'DELETE', scope: 'ALL' },
    
    // Passagers - Lecture + Modification limitée
    { resource: 'PASSENGERS', action: 'READ', scope: 'ALL' },
    { resource: 'PASSENGERS', action: 'UPDATE', scope: 'ALL' },  // Suspend/activate
    
    // Sessions - Gestion pour sécurité
    { resource: 'SESSIONS', action: 'READ', scope: 'ALL' },
    { resource: 'SESSIONS', action: 'DELETE', scope: 'ALL' },  // Révocation
    
    // Incidents - Lecture
    { resource: 'INCIDENTS', action: 'READ', scope: 'ALL' },
    { resource: 'INCIDENTS', action: 'UPDATE', scope: 'ALL' },
    
    // Trajets - Lecture seule
    { resource: 'TRIPS', action: 'READ', scope: 'ALL' },
    
    // Opérateurs - Lecture seule
    { resource: 'OPERATORS', action: 'READ', scope: 'ALL' },
    
    // Stations - Lecture seule
    { resource: 'STATIONS', action: 'READ', scope: 'ALL' },
    
    // Avis - Modération
    { resource: 'REVIEWS', action: 'READ', scope: 'ALL' },
    { resource: 'REVIEWS', action: 'UPDATE', scope: 'ALL' },
    { resource: 'REVIEWS', action: 'APPROVE', scope: 'ALL' }
  ]
};

/**
 * FINANCE_ADMIN - Gestion paiements et analytics
 * Accès finances et rapports
 */
export const FINANCE_ADMIN_ROLE: RoleDefinition = {
  name: 'Finance',
  description: 'Gestion paiements, remboursements et rapports financiers',
  level: 2,
  permissions: [
    // Paiements - Gestion complète
    { resource: 'PAYMENTS', action: 'READ', scope: 'ALL' },
    { resource: 'PAYMENTS', action: 'UPDATE', scope: 'ALL' },  // Remboursements
    { resource: 'PAYMENTS', action: 'APPROVE', scope: 'ALL' },
    { resource: 'PAYMENTS', action: 'EXPORT', scope: 'ALL' },
    
    // Réservations - Lecture pour contexte
    { resource: 'BOOKINGS', action: 'READ', scope: 'ALL' },
    { resource: 'BOOKINGS', action: 'EXPORT', scope: 'ALL' },
    
    // Analytics - Accès complet
    { resource: 'ANALYTICS', action: 'READ', scope: 'ALL' },
    { resource: 'ANALYTICS', action: 'EXPORT', scope: 'ALL' },
    
    // Opérateurs - Lecture pour rapports
    { resource: 'OPERATORS', action: 'READ', scope: 'ALL' },
    
    // Trajets - Lecture pour rapports
    { resource: 'TRIPS', action: 'READ', scope: 'ALL' },
    
    // Passagers - Lecture pour rapports
    { resource: 'PASSENGERS', action: 'READ', scope: 'ALL' }
  ]
};

// ==================== MAPPING RÔLES ====================

export const ROLES: Record<UserRole, RoleDefinition> = {
  SUPER_ADMIN: SUPER_ADMIN_ROLE,
  OPERATOR_ADMIN: OPERATOR_ADMIN_ROLE,
  SUPPORT_ADMIN: SUPPORT_ADMIN_ROLE,
  FINANCE_ADMIN: FINANCE_ADMIN_ROLE
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Vérifie si un rôle a une permission spécifique
 */
export function roleHasPermission(
  role: UserRole,
  resource: ResourceType,
  action: ActionType,
  scope: ScopeType = 'ALL'
): boolean {
  const roleDefinition = ROLES[role];
  
  // Super Admin a tout
  if (role === 'SUPER_ADMIN') return true;
  
  // Cherche permission exacte
  const hasExactPermission = roleDefinition.permissions.some(
    p => p.resource === resource && 
         (p.action === action || p.action === 'MANAGE') &&
         (p.scope === scope || p.scope === 'ALL')
  );
  
  return hasExactPermission;
}

/**
 * Obtient toutes les permissions d'un rôle
 */
export function getRolePermissions(role: UserRole): Permission[] {
  const roleDefinition = ROLES[role];
  if (!roleDefinition) {
    console.warn(`[Permissions] Unknown role: ${role}. Defaulting to empty permissions.`);
    return [];
  }
  return roleDefinition.permissions;
}

/**
 * Vérifie si un rôle peut accéder à une page
 */
export function canAccessPage(role: UserRole, page: string): boolean {
  // Mapping pages → permissions requises
  const PAGE_PERMISSIONS: Record<string, { resource: ResourceType; action: ActionType }> = {
    'dashboard': { resource: 'ANALYTICS', action: 'READ' },
    'companies': { resource: 'OPERATORS', action: 'READ' },
    'passengers': { resource: 'PASSENGERS', action: 'READ' },
    'stations': { resource: 'STATIONS', action: 'READ' },
    'trips': { resource: 'TRIPS', action: 'READ' },
    'bookings': { resource: 'BOOKINGS', action: 'READ' },
    'payments': { resource: 'PAYMENTS', action: 'READ' },
    'tickets': { resource: 'TICKETS', action: 'READ' },
    'support': { resource: 'SUPPORT', action: 'READ' },
    'incidents': { resource: 'INCIDENTS', action: 'READ' },
    'advertising': { resource: 'ADVERTISING', action: 'READ' },
    'promotions': { resource: 'PROMOTIONS', action: 'READ' },
    'reviews': { resource: 'REVIEWS', action: 'READ' },
    'services': { resource: 'SERVICES', action: 'READ' },
    'notifications': { resource: 'NOTIFICATIONS', action: 'READ' },
    'analytics': { resource: 'ANALYTICS', action: 'READ' },
    'sessions': { resource: 'SESSIONS', action: 'READ' },
    'policies': { resource: 'POLICIES', action: 'READ' },
    'settings': { resource: 'SETTINGS', action: 'READ' },
    'logs': { resource: 'LOGS', action: 'READ' },
    'integrations': { resource: 'INTEGRATIONS', action: 'READ' },
    'map': { resource: 'MAP', action: 'READ' },
    'referrals': { resource: 'REFERRALS', action: 'READ' }
  };
  
  const requiredPermission = PAGE_PERMISSIONS[page];
  if (!requiredPermission) return true;  // Page publique
  
  return roleHasPermission(role, requiredPermission.resource, requiredPermission.action);
}

/**
 * Liste des pages accessibles pour un rôle
 */
export function getAccessiblePages(role: UserRole): string[] {
  const allPages = [
    'dashboard', 'companies', 'passengers', 'stations', 'trips',
    'bookings', 'payments', 'tickets', 'support', 'incidents',
    'advertising', 'promotions', 'reviews', 'services',
    'notifications', 'analytics', 'sessions', 'policies',
    'settings', 'logs', 'integrations', 'map', 'referrals'
  ];
  
  return allPages.filter(page => canAccessPage(role, page));
}

/**
 * Obtient le niveau hiérarchique du rôle
 */
export function getRoleLevel(role: UserRole): number {
  const roleDefinition = ROLES[role];
  if (!roleDefinition) {
    console.warn(`[Permissions] Unknown role: ${role}. Defaulting to level 0.`);
    return 0;
  }
  return roleDefinition.level;
}

/**
 * Compare deux rôles (true si role1 >= role2)
 */
export function isRoleHigherOrEqual(role1: UserRole, role2: UserRole): boolean {
  return getRoleLevel(role1) >= getRoleLevel(role2);
}