import { useState, useCallback } from 'react';

/**
 * TYPE DEFINITIONS
 */
export interface ConfirmOptions {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

export interface ConfirmState {
  isOpen: boolean;
  options: ConfirmOptions;
  resolve?: (value: boolean) => void;
}

/**
 * HOOK useConfirm
 * Gestion des dialogues de confirmation pour Admin et Société
 * Permet d'attendre la réponse de l'utilisateur de manière asynchrone
 */
export function useConfirm() {
  const [state, setState] = useState<ConfirmState>({
    isOpen: false,
    options: {},
  });

  /**
   * Afficher un dialogue de confirmation
   */
  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        options: {
          title: 'Confirmation',
          message: 'Êtes-vous sûr de vouloir continuer ?',
          confirmText: 'Confirmer',
          cancelText: 'Annuler',
          variant: 'info',
          ...options,
        },
        resolve,
      });
    });
  }, []);

  /**
   * Confirmer l'action
   */
  const handleConfirm = useCallback(async () => {
    if (state.options.onConfirm) {
      await state.options.onConfirm();
    }
    state.resolve?.(true);
    setState({ isOpen: false, options: {} });
  }, [state]);

  /**
   * Annuler l'action
   */
  const handleCancel = useCallback(() => {
    if (state.options.onCancel) {
      state.options.onCancel();
    }
    state.resolve?.(false);
    setState({ isOpen: false, options: {} });
  }, [state]);

  /**
   * Dialogues pré-configurés
   */
  const presets = {
    delete: (entity: string) =>
      confirm({
        title: 'Confirmer la suppression',
        message: `Êtes-vous sûr de vouloir supprimer ${entity} ? Cette action est irréversible.`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        variant: 'danger',
      }),

    discard: () =>
      confirm({
        title: 'Annuler les modifications',
        message: 'Vous avez des modifications non enregistrées. Voulez-vous vraiment les abandonner ?',
        confirmText: 'Abandonner',
        cancelText: 'Continuer l\'édition',
        variant: 'warning',
      }),

    archive: (entity: string) =>
      confirm({
        title: 'Archiver',
        message: `Voulez-vous archiver ${entity} ?`,
        confirmText: 'Archiver',
        cancelText: 'Annuler',
        variant: 'warning',
      }),

    activate: (entity: string) =>
      confirm({
        title: 'Activer',
        message: `Voulez-vous activer ${entity} ?`,
        confirmText: 'Activer',
        cancelText: 'Annuler',
        variant: 'info',
      }),

    deactivate: (entity: string) =>
      confirm({
        title: 'Désactiver',
        message: `Voulez-vous désactiver ${entity} ?`,
        confirmText: 'Désactiver',
        cancelText: 'Annuler',
        variant: 'warning',
      }),
  };

  return {
    confirm,
    handleConfirm,
    handleCancel,
    isOpen: state.isOpen,
    options: state.options,
    presets,
  };
}

/**
 * EXAMPLES D'UTILISATION
 * 
 * // Dans un composant
 * const { confirm, presets, isOpen, options, handleConfirm, handleCancel } = useConfirm();
 * 
 * // Confirmation simple
 * const handleDelete = async () => {
 *   const confirmed = await confirm({
 *     title: 'Supprimer le véhicule',
 *     message: 'Êtes-vous sûr ?',
 *   });
 *   
 *   if (confirmed) {
 *     // Supprimer
 *   }
 * };
 * 
 * // Avec preset
 * const handleDelete = async () => {
 *   if (await presets.delete('ce véhicule')) {
 *     // Supprimer
 *   }
 * };
 * 
 * // Afficher le dialogue dans le JSX
 * <AlertDialog open={isOpen}>
 *   <AlertDialogContent>
 *     <AlertDialogHeader>
 *       <AlertDialogTitle>{options.title}</AlertDialogTitle>
 *       <AlertDialogDescription>{options.message}</AlertDialogDescription>
 *     </AlertDialogHeader>
 *     <AlertDialogFooter>
 *       <AlertDialogCancel onClick={handleCancel}>
 *         {options.cancelText}
 *       </AlertDialogCancel>
 *       <AlertDialogAction onClick={handleConfirm}>
 *         {options.confirmText}
 *       </AlertDialogAction>
 *     </AlertDialogFooter>
 *   </AlertDialogContent>
 * </AlertDialog>
 */
