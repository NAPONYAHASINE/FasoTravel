/**
 * @file ResetPasswordModal.tsx
 * @description Modal pour réinitialiser le mot de passe d'un passager
 */

import { useState } from 'react';
import { X, Key, Copy, CheckCircle, Loader, AlertTriangle } from 'lucide-react';
import { PassengerUser } from '../../shared/types/standardized';
import { Button } from '../ui/button';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  passenger: PassengerUser | null;
  onReset: (id: string) => Promise<string>;
}

export function ResetPasswordModal({ isOpen, onClose, passenger, onReset }: ResetPasswordModalProps) {
  const [loading, setLoading] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !passenger) return null;

  const handleReset = async () => {
    try {
      setLoading(true);
      const newPassword = await onReset(passenger.id);
      setTemporaryPassword(newPassword);
    } catch (error) {
      console.error('Erreur lors de la réinitialisation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (temporaryPassword) {
      navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setTemporaryPassword(null);
    setCopied(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl text-gray-900 dark:text-white">
            Réinitialiser le mot de passe
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Passenger Info */}
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Passager</p>
            <p className="text-gray-900 dark:text-white">{passenger.name}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{passenger.email}</p>
          </div>

          {!temporaryPassword ? (
            <>
              {/* Warning */}
              <div className="flex gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-orange-800 dark:text-orange-200">
                  <p className="font-medium mb-1">Attention</p>
                  <p>Un mot de passe temporaire sera généré et envoyé au passager par email. L'ancien mot de passe ne fonctionnera plus.</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                  disabled={loading}
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Réinitialisation...
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4 mr-2" />
                      Réinitialiser
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Success */}
              <div className="flex gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-green-800 dark:text-green-200">
                  <p className="font-medium mb-1">Mot de passe réinitialisé</p>
                  <p>Un email a été envoyé à {passenger.email} avec le nouveau mot de passe.</p>
                </div>
              </div>

              {/* Temporary Password */}
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Mot de passe temporaire
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={temporaryPassword}
                    readOnly
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCopy}
                    className="px-4"
                  >
                    {copied ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Le passager devra changer ce mot de passe lors de sa première connexion.
                </p>
              </div>

              {/* Close Button */}
              <div className="pt-2">
                <Button
                  type="button"
                  onClick={handleClose}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  Fermer
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
