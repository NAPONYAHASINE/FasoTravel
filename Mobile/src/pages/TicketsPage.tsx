import type { Page } from '../App';
/**
 * TicketsPage - Mes billets
 * Tabs: Actifs / Embarqués / Annulés / Expirés
 * 
 * DEV NOTES:
 * - Endpoint: GET /users/me/tickets?status=
 * - Actions: download, transfer, cancel (connectés aux vraies API)
 * - Recherche par compagnie
 */

import { useState } from 'react';
import { TicketCard } from '../components/TicketCard';
import { Ticket } from '../data/models';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { t } from '../lib/i18n';
import { Ticket as TicketIcon, Calendar, XCircle, Loader2, Search } from 'lucide-react';
import { feedback } from '../lib/interactions';
import { motion } from 'motion/react';
import { useMyTickets } from '../lib/hooks';
import { getLastSync } from '../lib/offlineTickets';
import * as api from '../lib/api';
import { saveTicketBlob, getTicketBlobUrl } from '../lib/offlineTickets';

interface TicketsPageProps {
  onNavigate: (page: Page, ticketId?: string) => void;
}

export function TicketsPage({ onNavigate }: TicketsPageProps) {
  const { tickets, isLoading, error, refetch, isOffline } = useMyTickets();
  const lastSync = getLastSync();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleRefresh = async () => {
  setIsRefreshing(true);
  feedback.tap();
  await refetch();
  setIsRefreshing(false);
  };

  // Filtrer par recherche (nom de compagnie)
  const filteredTickets = tickets.filter(t => {
    if (!searchQuery) return true;
    return t.operator_name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Helper: Vérifier si un billet est expiré
  const isTicketExpired = (ticket: Ticket): boolean => {
    const now = new Date();
    // Small grace period (minutes) after arrival to still consider recent trips as EMBARKED
    const embarkGraceMinutes = 30;
    // For PAID tickets, expired means departure time is past
    if (ticket.status === 'PAID' || ticket.status === 'HOLD') {
      const departureTime = ticket.departure_time ? new Date(ticket.departure_time) : null;
      if (!departureTime) return false;
      return departureTime < now;
    }

    // For EMBARKED tickets, expired means the arrival time is past (trip finished)
    if (ticket.status === 'EMBARKED') {
      const arrivalTime = ticket.arrival_time ? new Date(ticket.arrival_time) : null;
      if (!arrivalTime) return false;
      // Consider not expired if arrival is within the grace window
      const graceMs = embarkGraceMinutes * 60 * 1000;
      return (arrivalTime.getTime() + graceMs) < now.getTime();
    }

    // CANCELLED tickets are handled separately and considered not "expired" here
    return false;
  };

  // Actifs: PAID et NON expirés
  const activeTickets = filteredTickets.filter(t => t.status === 'PAID' && !isTicketExpired(t));
  
  // Embarqués: EMBARKED et NON expirés
  const embarkedTickets = filteredTickets.filter(t => t.status === 'EMBARKED' && !isTicketExpired(t));
  
  // Annulés: CANCELLED
  const cancelledTickets = filteredTickets.filter(t => t.status === 'CANCELLED');
  
  // Expirés: (PAID ou EMBARKED) ET expirés (departure_time < now)
  const expiredTickets = filteredTickets.filter(t => {
    return (t.status === 'PAID' || t.status === 'EMBARKED') && isTicketExpired(t);
  });

  // ========== ACTIONS CONNECTÉES AUX VRAIES API ==========
  
  const handleDownload = async (ticketId: string) => {
    try {
      feedback.tap();
      // Try to fetch the ticket PDF and store it offline for presentation
      const result = await api.downloadTicket(ticketId);
      // If API returned a URL, fetch it as blob
      if (result.pdf_url) {
        const resp = await fetch(result.pdf_url);
        const blob = await resp.blob();
        await saveTicketBlob(ticketId, blob);
        // open blob in new tab for immediate view
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      }
      feedback.success();
    } catch (error) {
      feedback.error();
      alert('Erreur lors du téléchargement du billet');
    }
  };

  // Transfer feature removed from frontend UI

  const handleCancel = async (ticketId: string) => {
    const ticket = tickets.find(t => t.ticket_id === ticketId);
    if (!ticket) return;

    const departureTime = new Date(ticket.departure_time);
    const now = new Date();
    const hoursDiff = (departureTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursDiff < 1) {
      feedback.error();
      alert('Impossible d\'annuler : le départ est dans moins d\'1 heure');
      return;
    }

    const confirmMsg = `Êtes-vous sûr de vouloir annuler ce billet?\n\n${ticket.from_stop_name} → ${ticket.to_stop_name}\nDépart: ${new Date(ticket.departure_time).toLocaleString('fr-FR')}`;
    if (!window.confirm(confirmMsg)) {
      return;
    }

    try {
      feedback.tap();
      const result = await api.cancelTicket(ticketId);
      feedback.success();
      alert(`Billet annulé avec succès.\n\nRemboursement: ${result.refund_amount.toLocaleString()} FCFA\nVous recevrez le remboursement sous 3-5 jours ouvrés.`);
      await refetch(); // Refresh list
    } catch (error) {
      feedback.error();
      alert('Erreur lors de l\'annulation du billet');
    }
  };

  const handleTicketClick = (ticketId: string) => {
    feedback.tap();
    onNavigate('ticket-detail', ticketId);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-600 dark:text-green-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <motion.div 
        className="bg-gradient-to-r from-red-600 via-amber-500 to-green-600 px-6 pt-12 pb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="max-w-4xl mx-auto">
          <motion.h1 
            className="text-3xl md:text-4xl text-white mb-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            {t('tickets.my_tickets')}
          </motion.h1>
        </div>
      </motion.div>

      {/* Search Bar */}
      <motion.div 
        className="px-6 pt-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par compagnie..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                feedback.tap();
              }}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400"
            />
            {searchQuery && (
              <button
                type="button"
                title="Effacer la recherche"
                onClick={() => {
                  setSearchQuery('');
                  feedback.tap();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <XCircle className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div 
        className="px-6 pb-24 pt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {/* Offline indicator */}
        {/** Affiche une bannière quand les données sont issues du cache */}
        {(lastSync || isOffline) && (
          <div className="max-w-4xl mx-auto mb-4">
            <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 p-3 text-sm text-yellow-800 dark:text-yellow-200 flex items-center justify-between">
              <div>
                <strong>Données</strong>
                <div className="text-xs">Source : {isOffline ? 'hors‑ligne (cache)' : 'en ligne'}</div>
                {lastSync && <div className="text-xs">Dernière synchronisation : {new Date(lastSync).toLocaleString('fr-FR')}</div>}
              </div>
              <div>
                <button
                  onClick={handleRefresh}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                >
                  {isRefreshing ? 'Synchronisation...' : 'Synchroniser'}
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="active" className="w-full">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <TabsList className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6">
                <TabsTrigger value="active" className="flex-1 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400 data-[state=active]:shadow-sm dark:text-gray-400">
                  {t('tickets.active')} ({activeTickets.length})
                </TabsTrigger>
                <TabsTrigger value="embarked" className="flex-1 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-green-600 dark:data-[state=active]:text-green-400 data-[state=active]:shadow-sm dark:text-gray-400">
                  {t('tickets.embarked')} ({embarkedTickets.length})
                </TabsTrigger>
                <TabsTrigger value="cancelled" className="flex-1 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-amber-600 dark:data-[state=active]:text-amber-400 data-[state=active]:shadow-sm dark:text-gray-400">
                  {t('tickets.cancelled')} ({cancelledTickets.length})
                </TabsTrigger>
                <TabsTrigger value="expired" className="flex-1 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-600 dark:data-[state=active]:text-gray-400 data-[state=active]:shadow-sm dark:text-gray-400">
                  {t('tickets.expired')} ({expiredTickets.length})
                </TabsTrigger>
              </TabsList>
            </motion.div>

            {/* Active Tickets */}
            <TabsContent value="active" className="space-y-4">
              {activeTickets.length === 0 ? (
                <motion.div 
                  className="bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl p-12 text-center shadow-lg"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <motion.span 
                    className="text-6xl mb-4 block"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    🎫
                  </motion.span>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {searchQuery ? `Aucun billet trouvé pour "${searchQuery}"` : 'Aucun billet actif'}
                  </p>
                  <motion.button
                    onClick={() => {
                      feedback.tap();
                      onNavigate('home');
                    }}
                    className="text-red-600 dark:text-red-400 hover:underline px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Réserver un voyage
                  </motion.button>
                </motion.div>
              ) : (
                activeTickets.map((ticket, index) => (
                  <motion.div
                    key={ticket.ticket_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    <TicketCard
                      ticket={ticket}
                      onDownload={handleDownload}
                      onCancel={handleCancel}
                      onClick={handleTicketClick}
                    />
                  </motion.div>
                ))
              )}
            </TabsContent>

            {/* Embarked Tickets */}
            <TabsContent value="embarked" className="space-y-4">
              {embarkedTickets.length === 0 ? (
                <motion.div 
                  className="bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl p-12 text-center shadow-lg"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <motion.span 
                    className="text-6xl mb-4 block"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    🚌
                  </motion.span>
                  <p className="text-gray-600 dark:text-gray-400">Aucun voyage embarqué</p>
                </motion.div>
              ) : (
                embarkedTickets.map((ticket, index) => (
                  <motion.div
                    key={ticket.ticket_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    <TicketCard
                      ticket={ticket}
                      onClick={handleTicketClick}
                    />
                  </motion.div>
                ))
              )}
            </TabsContent>

            {/* Cancelled Tickets */}
            <TabsContent value="cancelled" className="space-y-4">
              {cancelledTickets.length === 0 ? (
                <motion.div 
                  className="bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl p-12 text-center shadow-lg"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <motion.span 
                    className="text-6xl mb-4 block"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    ✅
                  </motion.span>
                  <p className="text-gray-600 dark:text-gray-400">Aucun billet annulé</p>
                </motion.div>
              ) : (
                cancelledTickets.map((ticket, index) => (
                  <motion.div
                    key={ticket.ticket_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    <TicketCard
                      ticket={ticket}
                      onClick={handleTicketClick}
                    />
                  </motion.div>
                ))
              )}
            </TabsContent>

            {/* Expired Tickets */}
            <TabsContent value="expired" className="space-y-4">
              {expiredTickets.length === 0 ? (
                <motion.div 
                  className="bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl p-12 text-center shadow-lg"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <motion.span 
                    className="text-6xl mb-4 block"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    📅
                  </motion.span>
                  <p className="text-gray-600 dark:text-gray-400">Aucun billet expiré</p>
                </motion.div>
              ) : (
                expiredTickets.map((ticket, index) => (
                  <motion.div
                    key={ticket.ticket_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    <TicketCard
                      ticket={ticket}
                      onClick={handleTicketClick}
                    />
                  </motion.div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>
    </div>
  );
}
