/**
 * @file BookingDetailPage.tsx
 * @description Detail page for a booking
 */

import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Calendar, MapPin, Users, CreditCard, Clock } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useEffect, useState } from 'react';
import { bookingService } from '../../services/bookingService';
import type { Booking } from '../../lib/adminMockData';

export default function BookingDetailPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!bookingId) return;
    setIsLoading(true);
    bookingService.getBookingById(bookingId)
      .then(setBooking)
      .finally(() => setIsLoading(false));
  }, [bookingId]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/bookings')}>
            <ArrowLeft className="w-4 h-4 mr-2" />Retour
          </Button>
          <h1 className="text-2xl font-bold">Chargement...</h1>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/bookings')}>
            <ArrowLeft className="w-4 h-4 mr-2" />Retour
          </Button>
          <h1 className="text-2xl font-bold">Réservation introuvable</h1>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-gray-600 dark:text-gray-400">Aucune réservation trouvée pour l'ID: {bookingId}</p>
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    completed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/bookings')}>
          <ArrowLeft className="w-4 h-4 mr-2" />Retour
        </Button>
        <h1 className="text-2xl font-bold dark:text-white">Réservation #{booking.booking_id.slice(0, 8)}</h1>
        <span className={`px-3 py-1 rounded-full text-sm ${statusColors[booking.status] || 'bg-gray-100 text-gray-800'}`}>
          {booking.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Infos passager */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold dark:text-white">Passager</h2>
          <div className="space-y-2 text-sm">
            <p className="dark:text-gray-300"><span className="text-gray-500">Nom:</span> {booking.passenger_name}</p>
            <p className="dark:text-gray-300"><span className="text-gray-500">Email:</span> {booking.passenger_email}</p>
            <p className="dark:text-gray-300"><span className="text-gray-500">Téléphone:</span> {booking.passenger_phone}</p>
          </div>
        </div>

        {/* Infos trajet */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold dark:text-white">Trajet</h2>
          <div className="space-y-2 text-sm">
            <p className="flex items-center gap-2 dark:text-gray-300"><MapPin className="w-4 h-4 text-gray-400" />{booking.trip_route}</p>
            <p className="flex items-center gap-2 dark:text-gray-300"><Calendar className="w-4 h-4 text-gray-400" />{booking.departure_date || 'Non défini'} {booking.departure_time ? `à ${booking.departure_time}` : ''}</p>
            <p className="dark:text-gray-300"><span className="text-gray-500">Compagnie:</span> {booking.company_name}</p>
          </div>
        </div>

        {/* Infos billetterie */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold dark:text-white">Billetterie</h2>
          <div className="space-y-2 text-sm">
            <p className="flex items-center gap-2 dark:text-gray-300"><Users className="w-4 h-4 text-gray-400" />{booking.num_passengers} passager(s)</p>
            <p className="dark:text-gray-300"><span className="text-gray-500">Sièges:</span> {booking.selected_seats.join(', ') || 'Non assignés'}</p>
          </div>
        </div>

        {/* Infos financières */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold dark:text-white">Paiement</h2>
          <div className="space-y-2 text-sm">
            <p className="flex items-center gap-2 dark:text-gray-300"><CreditCard className="w-4 h-4 text-gray-400" />{booking.price_per_seat.toLocaleString()} {booking.currency} / siège</p>
            <p className="text-lg font-bold dark:text-white">{booking.total_amount.toLocaleString()} {booking.currency}</p>
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Clock className="w-4 h-4" />
          <span>Créée le {new Date(booking.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          {booking.updated_at && (
            <span>• Mise à jour le {new Date(booking.updated_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          )}
        </div>
      </div>
    </div>
  );
}
