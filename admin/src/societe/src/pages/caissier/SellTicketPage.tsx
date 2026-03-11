/**
 * @file SellTicketPage.tsx
 * @description Vente de billets (Caissier)
 */

import { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Card, Button } from '../../components/ui';
import { Plus } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export default function SellTicketPage() {
  const { trips, currentUser } = useApp();
  const [selectedTrip, setSelectedTrip] = useState<string>('');

  // Filter trips for this station
  const availableTrips = trips.filter((t: any) => t.gareId === currentUser?.gareId && t.status === 'scheduled');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Vendre un Billet</h1>
        <p className="text-gray-600 mt-1">Point de vente - {currentUser?.gareName}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Trip Selection */}
        <div className="lg:col-span-2">
          <Card title="Voyages disponibles">
            <div className="space-y-2">
              {availableTrips.length === 0 ? (
                <p className="text-gray-600 text-center py-8">Aucun voyage disponible</p>
              ) : (
                availableTrips.map((trip: any) => (
                  <button
                    key={trip.id}
                    onClick={() => setSelectedTrip(trip.id)}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      selectedTrip === trip.id
                        ? 'border-fasotravel-red bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{trip.routeName}</p>
                        <p className="text-sm text-gray-600">
                          Départ: {new Date(trip.departureTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Places disponibles</p>
                        <p className="font-bold">{trip.capacity - trip.currentPassengers}/{trip.capacity}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Right: Ticket Form */}
        <div>
          <Card title="Détails du billet">
            {selectedTrip ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom du passager</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fasotravel-red focus:border-transparent"
                    placeholder="Nom complet"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                  <input
                    type="tel"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fasotravel-red focus:border-transparent"
                    placeholder="+226 XX XX XX XX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">N° Siège</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fasotravel-red focus:border-transparent"
                    placeholder="A12"
                  />
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">Montant:</span>
                    <span className="text-xl font-bold">{formatCurrency(5000)}</span>
                  </div>
                </div>

                <Button className="w-full" icon={<Plus className="w-5 h-5" />}>
                  Valider la vente
                </Button>
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">Sélectionnez un voyage</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
