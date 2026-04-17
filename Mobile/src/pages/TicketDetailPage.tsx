import type { Page } from '../App';
/**
 * TicketDetailPage - Détail du billet avec QR code
 * 
 * DEV NOTES:
 * - Endpoint: GET /tickets/{id}
 * - QR code + code alphanumérique
 * - Actions: Télécharger PDF, Transférer (si !holderDownloaded), Annuler (≤1h)
 * - Event: ticket_viewed, qr_scanned, ticket_downloaded
 * - Téléchargement → holderDownloaded=true → bloque transfert
 */

import { useState, useEffect } from 'react';
import { ArrowLeft, Download, XCircle, Calendar, MapPin, User } from 'lucide-react';
import { saveTicketBlob, getTicketBlobUrl } from '../lib/offlineTickets';
import * as api from '../lib/api';
import { Ticket, MOCK_TICKETS } from '../data/models';
import { storageService } from '../services/storage/localStorage.service';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useVehicleLiveTracking, useEmitLocation } from '../lib/hooks';
import { useGeolocation } from '../lib/useGeolocation';

interface TicketDetailPageProps {
  ticketId: string;
  onNavigate: (page: Page, data?: any) => void;
  onBack: () => void;
}

export function TicketDetailPage({ ticketId, onNavigate, onBack }: TicketDetailPageProps) {
  const [ticket] = useState<Ticket | undefined>(() => {
    // 1. Check storageService first (tickets from real payment flow)
    const storedTickets = storageService.get<any[]>('user_tickets') || [];
    const stored = storedTickets.find(t => t.id === ticketId);
    if (stored) {
      // Map service ticket format to data model Ticket format
      return {
        ticket_id: stored.id,
        trip_id: stored.tripId,
        booking_id: stored.bookingId || '',
        operator_id: stored.operatorId || '',
        operator_name: stored.operatorName || '',
        from_stop_id: stored.fromStopId || '',
        to_stop_id: stored.toStopId || '',
        from_stop_name: stored.fromStopName || '',
        to_stop_name: stored.toStopName || '',
        departure_time: stored.embarkationTime || '',
        arrival_time: stored.arrivalTime || '',
        passenger_name: stored.passengerName || '',
        seat_number: stored.seatNumber || '',
        status: stored.status === 'active' ? 'active' : stored.status,
        qr_code: stored.qrCode || `QR_${stored.id}`,
        alphanumeric_code: stored.alphanumericCode || stored.id?.replace('ticket_', '').slice(-6).toUpperCase() || '',
        price: stored.price || 0,
        currency: stored.currency || 'XOF',
        payment_method: stored.paymentMethod || 'orange_money',
        payment_id: stored.paymentId || '',
        created_at: stored.createdAt || new Date().toISOString(),
        updated_at: stored.updatedAt || new Date().toISOString(),
        holder_downloaded: stored.holderDownloaded ?? false,
        holder_presented: stored.holderPresented ?? false,
        can_cancel: stored.canCancel ?? true,
        can_transfer: stored.canTransfer ?? true,
      } as Ticket;
    }
    // 2. Fallback to mock tickets
    return MOCK_TICKETS.find(t => t.ticket_id === ticketId);
  });
  const [showQR, setShowQR] = useState(true);
  const [offlineUrl, setOfflineUrl] = useState<string | null>(null);
  
  // Géolocalisation de l'utilisateur
  const [geoState] = useGeolocation();
  const userLocation = geoState.userPosition ? { 
    lat: geoState.userPosition.lat, 
    lon: geoState.userPosition.lon 
  } : null;
  
  // Load live vehicle tracking when boarded
  useVehicleLiveTracking(
    ticket?.status === 'boarded' ? ticket?.trip_id : null,
    true
  );

  // Emit location when boarded (collaboratif: un seul passager suffit)
  useEmitLocation(
    ticket?.status === 'boarded' ? ticket?.ticket_id : null,
    ticket?.trip_id || null,
    ticket?.status === 'boarded' ? 'in_progress' : null,
    userLocation
  );

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Billet non trouvé</p>
          <Button onClick={onBack}>Retour</Button>
        </div>
      </div>
    );
  }

  // Check if ticket is expired
  const isExpired = () => {
    const departureTime = new Date(ticket.departure_time);
    const now = new Date();
    return departureTime < now;
  };

  const expired = isExpired();
  const canDownload = ticket.status === 'active' && !expired;
  const canCancel = ticket.status === 'active' && !expired;
  const canTrack = ticket.status === 'boarded';
  const isReadOnly = ticket.status === 'cancelled' || expired;

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    });
  };

  const handleDownload = async () => {
    console.log('Download PDF:', ticketId);
    try {
      const result = await api.downloadTicket(ticketId);
      if (result.pdf_url) {
        const res = await fetch(result.pdf_url);
        const blob = await res.blob();
        await saveTicketBlob(ticketId, blob);
        // create object URL for immediate opening and mark offline available
        const objUrl = URL.createObjectURL(blob);
        setOfflineUrl(objUrl);
        alert('Billet téléchargé et stocké pour accès hors-ligne.');
      } else {
        alert('Erreur: URL du billet introuvable');
      }

      // Note: In a real integration we would set holderDownloaded=true server-side
      // and avoid emitting transfer tokens. Here we only store locally.
    } catch (err) {
      console.error(err);
      alert('Erreur lors du téléchargement du billet');
    }
  };

  // Transfer feature removed from frontend by product decision

  const handleCancel = () => {
    const departureTime = new Date(ticket.departure_time);
    const now = new Date();
    const hoursDiff = (departureTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursDiff < 1) {
      alert('Impossible d\'annuler : le départ est dans moins d\'1 heure.\n\nRègle: Annulation possible jusqu\'à 1h avant le départ.');
      return;
    }

    if (window.confirm(`Êtes-vous sûr de vouloir annuler ce billet?\n\nPassager: ${ticket.passenger_name}\nTrajet: ${ticket.from_stop_name} → ${ticket.to_stop_name}\n\nUn remboursement vous sera envoyé.`)) {
      // DELETE /tickets/{id}
      console.log('Cancel ticket:', ticketId);
      alert('Billet annulé avec succès.\n\nVous recevrez un remboursement sous 3-5 jours ouvrés.');
      onBack();
    }
  };

  // On mount, check if there's an offline blob stored for this ticket
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const url = await getTicketBlobUrl(ticketId);
        if (mounted && url) setOfflineUrl(url);
      } catch (err) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, [ticketId]);

  const getStatusBadge = () => {
    if (expired && (ticket.status === 'active' || ticket.status === 'boarded')) {
      return <Badge className="bg-gray-100 text-gray-700">Expiré</Badge>;
    }
    switch (ticket.status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700">Actif</Badge>;
      case 'boarded':
        return <Badge className="bg-blue-100 text-blue-700">Embarqué</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-700">Annulé</Badge>;
      case 'expired':
        return <Badge className="bg-amber-100 text-amber-700">Expiré</Badge>;
      case 'refunded':
        return <Badge className="bg-yellow-100 text-yellow-700">Remboursé</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 via-amber-500 to-green-600 px-4 sm:px-6 py-6 shadow-lg sticky top-0 z-10 pt-safe-area-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={onBack}
            className="text-white mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour</span>
          </button>
          
          <div className="flex items-center justify-between text-white">
            <div>
              <h1 className="text-xl sm:text-2xl mb-1">Mon billet</h1>
              <p className="text-xs sm:text-sm opacity-90">{ticket.alphanumeric_code}</p>
            </div>
            {getStatusBadge()}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 py-6 pb-24">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* QR Code Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8">
            <div className="text-center mb-6">
              <h2 className="text-lg sm:text-xl text-gray-900 dark:text-white mb-2">Votre billet électronique</h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Présentez ce QR code lors de l'embarquement
              </p>
            </div>

            {/* QR Code */}
            {showQR ? (
              <div className="mb-6">
                <div className="w-48 h-48 sm:w-64 sm:h-64 mx-auto bg-white dark:bg-gray-700 border-4 border-amber-600 dark:border-amber-500 rounded-2xl p-4 flex items-center justify-center">
                  {/* Simulated QR Code */}
                  <div className="w-full h-full bg-gradient-to-br from-amber-100 to-green-100 dark:from-amber-900/30 dark:to-green-900/30 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl mb-2">📱</div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">QR Code</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{ticket.qr_code}</p>
                    </div>
                  </div>
                </div>
                
                {/* Alphanumeric Code */}
                <div className="mt-6 text-center">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">Code de vérification</p>
                  <p className="text-xl sm:text-3xl tracking-wider text-amber-600 dark:text-amber-500 select-all break-all">
                    {ticket.alphanumeric_code}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mb-6 text-center">
                <div className="w-48 h-48 sm:w-64 sm:h-64 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center">
                  <p className="text-gray-500">QR code masqué</p>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowQR(!showQR)}
              className="w-full text-xs sm:text-sm text-amber-600 dark:text-amber-500 hover:underline"
            >
              {showQR ? 'Masquer le QR code' : 'Afficher le QR code'}
            </button>
          </div>

          {/* Trip Details */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 sm:p-6">
            <h3 className="text-base sm:text-lg text-gray-900 dark:text-white mb-4">Détails du voyage</h3>
            
            <div className="space-y-4">
              {/* Date */}
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Date de départ</p>
                  <p className="text-sm sm:text-base text-gray-900 dark:text-white">{formatDate(ticket.departure_time)}</p>
                </div>
              </div>

              {/* Route */}
              <div className="flex gap-4">
                <MapPin className="w-5 h-5 text-red-600 dark:text-red-500 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">Itinéraire</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-600 dark:bg-amber-500"></div>
                      <span className="text-sm sm:text-base text-gray-900 dark:text-white">{ticket.from_stop_name}</span>
                      <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{formatTime(ticket.departure_time)}</span>
                    </div>
                    <div className="ml-1 w-px h-8 bg-amber-200 dark:bg-amber-800"></div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-600 dark:bg-green-500"></div>
                      <span className="text-sm sm:text-base text-gray-900 dark:text-white">{ticket.to_stop_name}</span>
                      <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{formatTime(ticket.arrival_time)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Passenger */}
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-green-600 dark:text-green-500" />
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Passager</p>
                  <p className="text-sm sm:text-base text-gray-900 dark:text-white">{ticket.passenger_name}</p>
                </div>
              </div>

              {/* Operator */}
              <div className="flex items-center gap-3">
                <span className="text-xl sm:text-2xl">🚌</span>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Compagnie</p>
                  <p className="text-sm sm:text-base text-gray-900 dark:text-white">{ticket.operator_name}</p>
                </div>
              </div>

              {/* Seat */}
              {ticket.seat_number && (
                <div className="flex items-center gap-3">
                  <span className="text-xl sm:text-2xl">💺</span>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Siège</p>
                    <p className="text-sm sm:text-base text-gray-900 dark:text-white">{ticket.seat_number}</p>
                  </div>
                </div>
              )}

              {/* Price */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <span className="text-xl sm:text-2xl">💰</span>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Prix payé</p>
                  <p className="text-lg sm:text-xl text-green-600 dark:text-green-500">{ticket.price.toLocaleString()} FCFA</p>
                </div>
              </div>
            </div>
          </div>

          {/* Small tracking preview for EMBARKED tickets: click to open enlarged GPS page */}
          {canTrack && (
            <button
              onClick={() => onNavigate('nearby', ticket.trip_id)}
              className="w-full bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5 overflow-hidden hover:shadow transition-shadow cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-900/30 dark:to-green-900/30 flex items-center justify-center">
                  <div className="text-2xl">📍</div>
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Suivi en temps réel</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Cliquez pour ouvrir la carte et suivre l'avancement</p>
                </div>
              </div>
            </button>
          )}          {/* Read-only info for CANCELLED or EXPIRED */}
          {isReadOnly && (
            <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl p-4">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {ticket.status === 'cancelled' 
                  ? "✋ Ce billet a été annulé. Aucune action disponible."
                  : "⏰ Ce billet a expiré. Vous ne pouvez plus l'utiliser."}
              </p>
            </div>
          )}

          {/* Actions */}
          {!isReadOnly && (
            <div className="space-y-3">
              {canDownload && (
                <>
                  <Button
                    onClick={handleDownload}
                    className="w-full bg-gradient-to-r from-red-600 via-amber-500 to-green-600 hover:from-red-700 hover:via-amber-600 hover:to-green-700 py-5 sm:py-6"
                  >
                    <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Télécharger le PDF
                  </Button>

                  {offlineUrl && (
                    <Button
                      onClick={() => window.open(offlineUrl, '_blank')}
                      variant="outline"
                      className="w-full"
                    >
                      Ouvrir hors‑ligne
                    </Button>
                  )}
                </>
              )}

              {canCancel && (
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="w-full text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                >
                  <XCircle className="w-5 h-5 mr-2" />
                  Annuler ce billet
                </Button>
              )}
            </div>
          )}

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800">
              💡 <strong>Conseil:</strong> Arrivez 15 minutes avant le départ. 
              Le QR code sera scanné lors de l'embarquement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
