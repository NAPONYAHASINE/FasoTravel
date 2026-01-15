/**
 * TicketCard Component
 * Affiche un billet avec son statut et actions disponibles
 * 
 * DEV NOTES:
 * - Data source: GET /users/me/tickets
 * - Actions: Télécharger (POST /tickets/{id}/download), 
 *   Transférer (POST /tickets/{id}/transfer), 
 *   Annuler (DELETE /tickets/{id} - policy: ≤1h avant départ)
 * - Event: ticket_downloaded, ticket_transfer_init, ticket_cancelled
 * - holderDownloaded=true bloque le transfert
 * 
 * PERFORMANCE:
 * - Optimisé avec React.memo pour éviter re-renders inutiles
 * - Se re-rend seulement si ticket_id ou status change
 */

import { memo, useState, useEffect } from 'react';
import { Calendar, Download, XCircle, MapPin } from 'lucide-react';
import { getTicketBlobUrl } from '../lib/offlineTickets';
import { Ticket } from '../data/models';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface TicketCardProps {
  ticket: Ticket;
  onDownload?: (ticketId: string) => void;
  onTransfer?: (ticketId: string) => void;
  onCancel?: (ticketId: string) => void;
  onClick?: (ticketId: string) => void;
}

const TicketCardComponent = ({ ticket, onDownload, onTransfer, onCancel, onClick }: TicketCardProps) => {
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const [offlineUrl, setOfflineUrl] = useState<string | null>(null);

  const canCancelComputed = (): boolean => {
    // Business rule: only PAID tickets can be cancelled and only if departure is >= 1 hour from now
    if (ticket.status !== 'PAID') return false;
    if (!ticket.departure_time) return false;
    try {
      const departure = new Date(ticket.departure_time).getTime();
      const now = Date.now();
      const hoursDiff = (departure - now) / (1000 * 60 * 60);
      return hoursDiff >= 1;
    } catch (e) {
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const url = await getTicketBlobUrl(ticket.ticket_id);
        if (mounted && url) setOfflineUrl(url);
      } catch (err) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, [ticket.ticket_id]);

  const getStatusBadge = () => {
    switch (ticket.status) {
      case 'PAID':
        return <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">Actif</Badge>;
      case 'EMBARKED':
        return <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">Embarqué</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">Annulé</Badge>;
      case 'HOLD':
        return <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">En attente</Badge>;
      default:
        return null;
    }
  };

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
      onClick={() => onClick?.(ticket.ticket_id)}
      role="article"
      aria-label={`Billet ${ticket.operator_name}, ${ticket.from_stop_name} vers ${ticket.to_stop_name}, départ ${formatDate(ticket.departure_time)} à ${formatTime(ticket.departure_time)}, statut: ${ticket.status === 'PAID' ? 'Actif' : ticket.status}`}
      tabIndex={0}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🚌</span>
          <div>
            <p className="text-gray-900 dark:text-white">{ticket.operator_name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{ticket.alphanumeric_code}</p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

  {/* Trajet */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex-1">
          <p className="text-xl text-gray-900 dark:text-white">{formatTime(ticket.departure_time)}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{ticket.from_stop_name}</p>
        </div>

        <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500" aria-hidden="true">
          <div className="w-2 h-2 rounded-full bg-green-600 dark:bg-green-500"></div>
          <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600 w-12"></div>
          <MapPin className="w-4 h-4" />
        </div>

        <div className="flex-1 text-right">
          <p className="text-xl text-gray-900 dark:text-white">{formatTime(ticket.arrival_time)}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{ticket.to_stop_name}</p>
        </div>
      </div>

      {/* Offline indicator */}
      {offlineUrl && (
        <div className="mb-3">
          <span className="inline-block text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded">Hors‑ligne</span>
        </div>
      )}

      {/* Date et siège */}
      <div className="flex items-center gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(ticket.departure_time)}</span>
        </div>
        {ticket.seat_number && (
          <span>Siège {ticket.seat_number}</span>
        )}
      </div>

      {/* Actions */}
      {ticket.status === 'PAID' && (
        <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
          {onDownload && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDownload(ticket.ticket_id);
              }}
              className="flex-1 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Télécharger le billet en PDF"
            >
              <Download className="w-4 h-4 mr-1" aria-hidden="true" />
              Télécharger
            </Button>
          )}
          
          {offlineUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                window.open(offlineUrl, '_blank');
              }}
              className="flex-1 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Ouvrir billet hors-ligne"
            >
              Ouvrir
            </Button>
          )}

          {/* Transfer option removed by product decision — only download/cancel remain */}
          
          {onCancel && canCancelComputed() && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onCancel(ticket.ticket_id);
              }}
              className="flex-1 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              aria-label="Annuler le billet et obtenir un remboursement"
            >
              <XCircle className="w-4 h-4 mr-1" aria-hidden="true" />
              Annuler
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

// Optimisation: Ne re-rend que si ticket_id ou status change
export const TicketCard = memo(TicketCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.ticket.ticket_id === nextProps.ticket.ticket_id &&
    prevProps.ticket.status === nextProps.ticket.status
  );
});
