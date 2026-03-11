/**
 * @file ConfirmWrapper.tsx
 * @description Wrapper autour de AlertDialog pour simplifier son usage
 * UTILISE le composant AlertDialog existant - ZÉRO DUPLICATION
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface ConfirmWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  type?: 'danger' | 'success' | 'warning';
  loading?: boolean;
}

export function ConfirmWrapper({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'warning',
  loading = false
}: ConfirmWrapperProps) {
  
  const config = {
    danger: {
      icon: XCircle,
      iconColor: 'text-red-500',
      buttonClass: 'bg-red-600 hover:bg-red-700'
    },
    success: {
      icon: CheckCircle,
      iconColor: 'text-green-500',
      buttonClass: 'bg-green-600 hover:bg-green-700'
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-yellow-500',
      buttonClass: 'bg-yellow-600 hover:bg-yellow-700'
    }
  };

  const Icon = config[type].icon;

  const handleConfirm = async () => {
    await onConfirm();
    // Ne pas fermer ici - le composant parent gère la fermeture après le succès
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <Icon className={`w-6 h-6 ${config[type].iconColor}`} />
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Annuler</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            className={config[type].buttonClass}
            disabled={loading}
          >
            {loading ? 'Chargement...' : 'Confirmer'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}