/**
 * @file PassengerDetailsModal.tsx
 * @description Modal pour afficher les détails complets d'un passager
 */

import { X, Mail, Phone, Calendar, Shield, CheckCircle, XCircle, CreditCard } from 'lucide-react';
import { PassengerUser } from '../../shared/types/standardized';
import { Badge } from '../ui/badge';

interface PassengerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  passenger: PassengerUser | null;
}

export function PassengerDetailsModal({ isOpen, onClose, passenger }: PassengerDetailsModalProps) {
  if (!isOpen || !passenger) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = () => {
    if (passenger.status === 'suspended') {
      return <Badge className="bg-red-500">Suspendu</Badge>;
    }
    if (passenger.status === 'active') {
      return <Badge className="bg-green-500">Actif</Badge>;
    }
    return <Badge>{passenger.status}</Badge>;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 z-10">
          <h2 className="text-xl text-gray-900 dark:text-white">
            Détails du passager
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Fermer"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Profile Section */}
          <div className="flex items-center gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
            {passenger.profileImage ? (
              <img
                src={passenger.profileImage}
                alt={passenger.name}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-yellow-400 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl">
                  {passenger.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-xl text-gray-900 dark:text-white mb-1">{passenger.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">ID: {passenger.id}</p>
              {getStatusBadge()}
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
              Informations de contact
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Email</p>
                  <p className="text-sm text-gray-900 dark:text-white break-all">{passenger.email}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {passenger.emailVerified ? (
                      <>
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-green-600 dark:text-green-400">Vérifié</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">Non vérifié</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Téléphone</p>
                  <p className="text-sm text-gray-900 dark:text-white">{passenger.phone}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {passenger.phoneVerified ? (
                      <>
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-green-600 dark:text-green-400">Vérifié</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">Non vérifié</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Information */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
              Activité
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <CreditCard className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Réservations</p>
                  <p className="text-2xl text-gray-900 dark:text-white">{passenger.totalBookings}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Inscription</p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {new Date(passenger.createdAt).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <Shield className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Dernière connexion</p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {passenger.lastLoginAt
                      ? new Date(passenger.lastLoginAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                        })
                      : 'Jamais'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
              Détails du compte
            </h4>
            <div className="space-y-2 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Date de création</span>
                <span className="text-sm text-gray-900 dark:text-white">{formatDate(passenger.createdAt)}</span>
              </div>
              {passenger.lastLoginAt && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Dernière connexion</span>
                  <span className="text-sm text-gray-900 dark:text-white">{formatDate(passenger.lastLoginAt)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Statut du compte</span>
                <span className="text-sm text-gray-900 dark:text-white">
                  {passenger.status === 'active' ? 'Actif' : 'Suspendu'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
