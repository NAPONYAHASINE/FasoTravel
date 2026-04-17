/**
 * @file PassengerDetailPage.tsx
 * @description Detail page for a passenger
 */

import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Mail, Phone, Calendar, Shield, User } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useEffect, useState } from 'react';
import { fetchPassengerById } from '../../services/passengersService';
import type { PassengerUser } from '../../shared/types/standardized';

export default function PassengerDetailPage() {
  const { passengerId } = useParams();
  const navigate = useNavigate();
  const [passenger, setPassenger] = useState<PassengerUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!passengerId) return;
    setIsLoading(true);
    setError(null);
    fetchPassengerById(passengerId)
      .then(setPassenger)
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [passengerId]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/passengers')}>
            <ArrowLeft className="w-4 h-4 mr-2" />Retour
          </Button>
          <h1 className="text-2xl font-bold">Chargement...</h1>
        </div>
      </div>
    );
  }

  if (error || !passenger) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/passengers')}>
            <ArrowLeft className="w-4 h-4 mr-2" />Retour
          </Button>
          <h1 className="text-2xl font-bold">Passager introuvable</h1>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-gray-600 dark:text-gray-400">{error || `Aucun passager trouvé pour l'ID: ${passengerId}`}</p>
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    suspended: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
  };

  const statusLabels: Record<string, string> = {
    active: 'Actif',
    inactive: 'Inactif',
    suspended: 'Suspendu',
    pending: 'En attente',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/passengers')}>
          <ArrowLeft className="w-4 h-4 mr-2" />Retour
        </Button>
        <h1 className="text-2xl font-bold dark:text-white">{passenger.name}</h1>
        <span className={`px-3 py-1 rounded-full text-sm ${statusColors[passenger.status] || 'bg-gray-100 text-gray-800'}`}>
          {statusLabels[passenger.status] || passenger.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Infos personnelles */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold dark:text-white flex items-center gap-2">
            <User className="w-5 h-5 text-gray-400" />Informations personnelles
          </h2>
          <div className="space-y-3 text-sm">
            <p className="flex items-center gap-2 dark:text-gray-300">
              <Mail className="w-4 h-4 text-gray-400" />{passenger.email}
              {passenger.emailVerified && <span className="text-green-500 text-xs">✓ Vérifié</span>}
            </p>
            <p className="flex items-center gap-2 dark:text-gray-300">
              <Phone className="w-4 h-4 text-gray-400" />{passenger.phone}
              {passenger.phoneVerified && <span className="text-green-500 text-xs">✓ Vérifié</span>}
            </p>
            {(passenger.profileImageUrl || passenger.profileImage) && (
              <img src={passenger.profileImageUrl || passenger.profileImage} alt={passenger.name} className="w-16 h-16 rounded-full object-cover" />
            )}
          </div>
        </div>

        {/* Statistiques */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold dark:text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-gray-400" />Activité
          </h2>
          <div className="space-y-3 text-sm">
            {passenger.totalBookings !== undefined && (
              <p className="dark:text-gray-300">
                <span className="text-gray-500">Réservations totales:</span> {passenger.totalBookings}
              </p>
            )}
            {passenger.lastLoginAt && (
              <p className="dark:text-gray-300">
                <span className="text-gray-500">Dernière connexion:</span>{' '}
                {new Date(passenger.lastLoginAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Calendar className="w-4 h-4" />
          <span>Inscrit le {new Date(passenger.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
          {passenger.updatedAt && (
            <span>• Dernière mise à jour le {new Date(passenger.updatedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
          )}
        </div>
      </div>
    </div>
  );
}
