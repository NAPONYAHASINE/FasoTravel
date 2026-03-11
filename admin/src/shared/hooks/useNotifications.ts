import { useCallback } from 'react';
import { toast } from 'sonner@2.0.3';

/**
 * TYPE DEFINITIONS
 */
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationOptions {
  title?: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * HOOK useNotifications
 * Gestion centralisée des notifications pour Admin et Société
 * Utilise sonner pour l'affichage des toasts
 */
export function useNotifications() {
  /**
   * Afficher une notification de succès
   */
  const success = useCallback((message: string, options?: NotificationOptions) => {
    toast.success(options?.title || 'Succès', {
      description: options?.description || message,
      duration: options?.duration || 4000,
      action: options?.action,
    });
  }, []);

  /**
   * Afficher une notification d'erreur
   */
  const error = useCallback((message: string, options?: NotificationOptions) => {
    toast.error(options?.title || 'Erreur', {
      description: options?.description || message,
      duration: options?.duration || 5000,
      action: options?.action,
    });
  }, []);

  /**
   * Afficher une notification d'avertissement
   */
  const warning = useCallback((message: string, options?: NotificationOptions) => {
    toast.warning(options?.title || 'Attention', {
      description: options?.description || message,
      duration: options?.duration || 4000,
      action: options?.action,
    });
  }, []);

  /**
   * Afficher une notification d'information
   */
  const info = useCallback((message: string, options?: NotificationOptions) => {
    toast.info(options?.title || 'Information', {
      description: options?.description || message,
      duration: options?.duration || 4000,
      action: options?.action,
    });
  }, []);

  /**
   * Afficher une notification de chargement
   */
  const loading = useCallback((message: string) => {
    return toast.loading(message);
  }, []);

  /**
   * Afficher une promesse avec feedback automatique
   */
  const promise = useCallback(
    <T,>(
      promise: Promise<T>,
      messages: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((error: any) => string);
      }
    ) => {
      return toast.promise(promise, messages);
    },
    []
  );

  /**
   * Fermer une notification spécifique
   */
  const dismiss = useCallback((toastId?: string | number) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  }, []);

  /**
   * Notifications pré-configurées pour les actions communes
   */
  const presets = {
    created: (entity: string) => success(`${entity} créé avec succès`),
    updated: (entity: string) => success(`${entity} mis à jour avec succès`),
    deleted: (entity: string) => success(`${entity} supprimé avec succès`),
    saved: () => success('Modifications enregistrées'),
    
    createError: (entity: string) => error(`Erreur lors de la création de ${entity}`),
    updateError: (entity: string) => error(`Erreur lors de la mise à jour de ${entity}`),
    deleteError: (entity: string) => error(`Erreur lors de la suppression de ${entity}`),
    loadError: () => error('Erreur lors du chargement des données'),
    
    confirmDelete: (entity: string) => warning(`Êtes-vous sûr de vouloir supprimer ${entity} ?`),
    unsavedChanges: () => warning('Vous avez des modifications non enregistrées'),
    
    networkError: () => error('Erreur de connexion au serveau', {
      description: 'Vérifiez votre connexion internet',
    }),
    unauthorized: () => error('Non autorisé', {
      description: 'Vous n\'avez pas les permissions nécessaires',
    }),
  };

  return {
    success,
    error,
    warning,
    info,
    loading,
    promise,
    dismiss,
    presets,
  };
}

/**
 * EXAMPLES D'UTILISATION
 * 
 * // Dans un composant
 * const notify = useNotifications();
 * 
 * // Notifications simples
 * notify.success('Opération réussie');
 * notify.error('Une erreur est survenue');
 * 
 * // Avec options
 * notify.success('Véhicule créé', {
 *   description: 'Le véhicule a été ajouté à la flotte',
 *   duration: 5000,
 *   action: {
 *     label: 'Voir',
 *     onClick: () => navigate('/vehicles/123'),
 *   },
 * });
 * 
 * // Avec promesse
 * notify.promise(
 *   api.createVehicle(data),
 *   {
 *     loading: 'Création du véhicule...',
 *     success: 'Véhicule créé avec succès',
 *     error: 'Erreur lors de la création',
 *   }
 * );
 * 
 * // Presets
 * notify.presets.created('Véhicule');
 * notify.presets.networkError();
 */
