/**
 * @file PermissionGuard.tsx
 * @description Composant pour contrôle d'accès basé sur les permissions
 * 
 * UTILISATION:
 * ```tsx
 * // Protéger un bouton
 * <PermissionGuard resource="TRIPS" action="CREATE">
 *   <Button>Créer trajet</Button>
 * </PermissionGuard>
 * 
 * // Protéger une page entière
 * <PermissionGuard 
 *   resource="USERS" 
 *   action="READ"
 *   fallback={<AccessDenied />}
 * >
 *   <UsersPage />
 * </PermissionGuard>
 * 
 * // Vérifier accès page
 * <PermissionGuard page="analytics">
 *   <AnalyticsPage />
 * </PermissionGuard>
 * 
 * // Afficher message personnalisé
 * <PermissionGuard 
 *   resource="PAYMENTS" 
 *   action="APPROVE"
 *   fallback={<p>Vous n'avez pas les droits Finance</p>}
 * >
 *   <ApproveButton />
 * </PermissionGuard>
 * ```
 */

import { ReactNode } from 'react';
import { usePermission } from '../../hooks/usePermission';
import { ResourceType, ActionType, ScopeType } from '../../lib/permissions';
import { AlertCircle, Lock } from 'lucide-react';

// ==================== TYPES ====================

interface PermissionGuardProps {
  children: ReactNode;
  
  // Option 1: Vérifier permission ressource/action
  resource?: ResourceType;
  action?: ActionType;
  scope?: ScopeType;
  
  // Option 2: Vérifier accès page
  page?: string;
  
  // Fallback si pas de permission
  fallback?: ReactNode;
  
  // Mode strict (throw error si pas de permission)
  strict?: boolean;
}

// ==================== COMPOSANT ====================

/**
 * PermissionGuard
 * Affiche les enfants uniquement si l'utilisateur a la permission requise
 */
export function PermissionGuard({
  children,
  resource,
  action,
  scope,
  page,
  fallback,
  strict = false
}: PermissionGuardProps) {
  const { hasPermission, canAccessPage: canAccessPageCheck } = usePermission();
  
  // Valider les props
  if (!resource && !page) {
    console.warn('PermissionGuard: Either resource or page must be provided');
    return null;
  }
  
  if (resource && !action) {
    console.warn('PermissionGuard: action is required when resource is provided');
    return null;
  }
  
  // Vérifier permission
  let hasAccess = false;
  
  if (page) {
    hasAccess = canAccessPageCheck(page);
  } else if (resource && action) {
    hasAccess = hasPermission(resource, action, scope);
  }
  
  // Si pas d'accès
  if (!hasAccess) {
    if (strict) {
      throw new Error(
        `Permission denied: ${resource ? `${resource}:${action}` : `page:${page}`}`
      );
    }
    
    // Afficher fallback ou fallback par défaut
    if (fallback !== undefined) {
      return <>{fallback}</>;
    }
    
    return null;  // Ne rien afficher par défaut
  }
  
  // Afficher les enfants si permission OK
  return <>{children}</>;
}

/**
 * AccessDenied
 * Composant par défaut pour afficher un message d'accès refusé
 */
export function AccessDenied({ 
  message = "Vous n'avez pas les permissions nécessaires pour accéder à cette ressource.",
  compact = false 
}: { 
  message?: string;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <Lock className="h-4 w-4 text-red-600 dark:text-red-400" />
        <span className="text-sm text-red-700 dark:text-red-300">Accès refusé</span>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-red-500/10 rounded-full blur-2xl"></div>
          <div className="relative w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900 dark:to-red-800 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <Lock className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>
        </div>
        
        {/* Titre */}
        <h2 className="text-2xl text-gray-900 dark:text-white mb-3">
          Accès Refusé
        </h2>
        
        {/* Message */}
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {message}
        </p>
        
        {/* Alert info */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 rounded-lg border border-red-300 dark:border-red-700">
          <AlertCircle className="h-4 w-4 text-red-700 dark:text-red-400" />
          <span className="text-sm text-red-800 dark:text-red-300">
            Contactez un administrateur si vous pensez que c'est une erreur
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * RoleGuard
 * Variante qui vérifie directement le rôle (plus simple)
 * 
 * UTILISATION:
 * ```tsx
 * <RoleGuard allowedRoles={['SUPER_ADMIN', 'FINANCE_ADMIN']}>
 *   <PaymentApproval />
 * </RoleGuard>
 * ```
 */
export function RoleGuard({
  children,
  allowedRoles,
  fallback
}: {
  children: ReactNode;
  allowedRoles: string[];
  fallback?: ReactNode;
}) {
  const { currentRole } = usePermission();
  
  if (!currentRole || !allowedRoles.includes(currentRole)) {
    return fallback !== undefined ? <>{fallback}</> : null;
  }
  
  return <>{children}</>;
}

/**
 * OperatorScopeGuard
 * Vérifie que l'utilisateur peut accéder aux données d'un opérateur
 * 
 * UTILISATION:
 * ```tsx
 * <OperatorScopeGuard operatorId={trip.operator_id}>
 *   <Button>Modifier trajet</Button>
 * </OperatorScopeGuard>
 * ```
 */
export function OperatorScopeGuard({
  children,
  operatorId,
  fallback
}: {
  children: ReactNode;
  operatorId: string;
  fallback?: ReactNode;
}) {
  const { isSuperAdmin, operatorId: userOperatorId } = usePermission();
  
  // Super Admin a accès à tout
  if (isSuperAdmin) {
    return <>{children}</>;
  }
  
  // Operator Admin uniquement à son opérateur
  if (userOperatorId && userOperatorId === operatorId) {
    return <>{children}</>;
  }
  
  // Pas d'accès
  return fallback !== undefined ? <>{fallback}</> : null;
}
