/**
 * @file usePermission.ts
 * @description Hook pour vérifier les permissions utilisateur
 * 
 * UTILISATION:
 * ```tsx
 * const { hasPermission, canAccessPage, currentRole } = usePermission();
 * 
 * // Vérifier permission
 * if (hasPermission('TRIPS', 'CREATE')) {
 *   return <Button>Créer trajet</Button>;
 * }
 * 
 * // Vérifier accès page
 * if (!canAccessPage('users')) {
 *   return <AccessDenied />;
 * }
 * ```
 */

import { useAdminApp } from '../context/AdminAppContext';
import {
  UserRole,
  ResourceType,
  ActionType,
  ScopeType,
  Permission,
  roleHasPermission,
  canAccessPage as canAccessPageUtil,
  getAccessiblePages,
  getRolePermissions,
  getRoleLevel,
  isRoleHigherOrEqual
} from '../lib/permissions';

export interface UsePermissionReturn {
  /**
   * Rôle de l'utilisateur actuel
   */
  currentRole: UserRole | null;
  
  /**
   * Vérifie si l'utilisateur a une permission spécifique
   * @param resource - Ressource (ex: 'TRIPS', 'BOOKINGS')
   * @param action - Action (ex: 'CREATE', 'READ', 'UPDATE')
   * @param scope - Portée (optionnel, défaut: 'ALL')
   */
  hasPermission: (
    resource: ResourceType,
    action: ActionType,
    scope?: ScopeType
  ) => boolean;
  
  /**
   * Vérifie si l'utilisateur peut accéder à une page
   * @param page - Nom de la page (ex: 'trips', 'bookings')
   */
  canAccessPage: (page: string) => boolean;
  
  /**
   * Liste des pages accessibles pour l'utilisateur
   */
  accessiblePages: string[];
  
  /**
   * Toutes les permissions de l'utilisateur
   */
  permissions: Permission[];
  
  /**
   * Niveau hiérarchique du rôle (1-4, 4 = le plus haut)
   */
  roleLevel: number;
  
  /**
   * Vérifie si le rôle actuel >= rôle donné
   */
  isRoleHigherOrEqual: (role: UserRole) => boolean;
  
  /**
   * Raccourcis pour rôles communs
   */
  isSuperAdmin: boolean;
  isOperatorAdmin: boolean;
  isSupportAdmin: boolean;
  isFinanceAdmin: boolean;
  
  /**
   * ID de l'opérateur (si OPERATOR_ADMIN)
   */
  operatorId: string | null;
}

/**
 * Hook usePermission
 * Centralise toute la logique de vérification des permissions
 */
export function usePermission(): UsePermissionReturn {
  const { currentUser } = useAdminApp();
  
  // Si pas d'utilisateur connecté, pas de permissions
  if (!currentUser || !currentUser.role) {
    return {
      currentRole: null,
      hasPermission: () => false,
      canAccessPage: () => false,
      accessiblePages: [],
      permissions: [],
      roleLevel: 0,
      isRoleHigherOrEqual: () => false,
      isSuperAdmin: false,
      isOperatorAdmin: false,
      isSupportAdmin: false,
      isFinanceAdmin: false,
      operatorId: null
    };
  }
  
  // Vérifier que le rôle est valide
  const role = currentUser.role as UserRole;
  
  // Protection: si le rôle n'est pas reconnu, logger et retourner vide
  const permissions = getRolePermissions(role);
  if (permissions.length === 0 && role !== 'SUPER_ADMIN') {
    console.error(`[usePermission] Invalid role: ${role}. User needs to re-login.`);
    return {
      currentRole: null,
      hasPermission: () => false,
      canAccessPage: () => false,
      accessiblePages: [],
      permissions: [],
      roleLevel: 0,
      isRoleHigherOrEqual: () => false,
      isSuperAdmin: false,
      isOperatorAdmin: false,
      isSupportAdmin: false,
      isFinanceAdmin: false,
      operatorId: null
    };
  }
  
  const accessiblePages = getAccessiblePages(role);
  const roleLevel = getRoleLevel(role);
  
  /**
   * Vérifie une permission
   */
  const hasPermission = (
    resource: ResourceType,
    action: ActionType,
    scope: ScopeType = 'ALL'
  ): boolean => {
    return roleHasPermission(role, resource, action, scope);
  };
  
  /**
   * Vérifie accès page
   */
  const canAccessPage = (page: string): boolean => {
    return canAccessPageUtil(role, page);
  };
  
  /**
   * Compare rôle actuel avec un autre rôle
   */
  const isHigherOrEqual = (otherRole: UserRole): boolean => {
    return isRoleHigherOrEqual(role, otherRole);
  };
  
  return {
    currentRole: role,
    hasPermission,
    canAccessPage,
    accessiblePages,
    permissions,
    roleLevel,
    isRoleHigherOrEqual: isHigherOrEqual,
    
    // Raccourcis
    isSuperAdmin: role === 'SUPER_ADMIN',
    isOperatorAdmin: role === 'OPERATOR_ADMIN',
    isSupportAdmin: role === 'SUPPORT_ADMIN',
    isFinanceAdmin: role === 'FINANCE_ADMIN',
    
    // ID opérateur (pour scope OWN_OPERATOR)
    operatorId: currentUser.operatorId || null
  };
}

/**
 * Hook useRequirePermission
 * Lance une erreur si l'utilisateur n'a pas la permission
 * 
 * UTILISATION:
 * ```tsx
 * function TripsPage() {
 *   useRequirePermission('TRIPS', 'READ');
 *   // Si pas de permission, erreur lancée
 *   return <div>...</div>;
 * }
 * ```
 */
export function useRequirePermission(
  resource: ResourceType,
  action: ActionType,
  scope?: ScopeType
): void {
  const { hasPermission } = usePermission();
  
  if (!hasPermission(resource, action, scope)) {
    throw new Error(
      `Permission denied: ${resource}:${action}${scope ? `:${scope}` : ''}`
    );
  }
}

/**
 * Hook useRequirePage
 * Lance une erreur si l'utilisateur ne peut pas accéder à la page
 */
export function useRequirePage(page: string): void {
  const { canAccessPage } = usePermission();
  
  if (!canAccessPage(page)) {
    throw new Error(`Access denied to page: ${page}`);
  }
}