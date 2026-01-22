import { useState, useMemo } from 'react';
import { Search, RefreshCw, XCircle, AlertCircle, CheckCircle } from 'lucide-react';
import { useFilteredData } from '../../hooks/useFilteredData';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency } from '../../utils/formatters';
import { formatDateTime, formatDate, getCurrentDate } from '../../utils/dateUtils';
import { getPaymentMethodLabel } from '../../utils/labels';
import { sortByDate, calculateTicketsRevenue } from '../../utils/statsUtils';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { FormDialog } from '../../components/forms/FormDialog';
import { BackButton } from '../../components/ui/back-button';
import type { Ticket } from '../../contexts/DataContext';
import { toast } from 'sonner';

export default function RefundPage() {
  const { user } = useAuth();
  const { tickets, refundTicket } = useFilteredData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());

  // ✅ REFACTORISÉ: Get only valid tickets sold by current cashier that can be refunded
  const refundableTickets = useMemo(() => {
    const now = getCurrentDate();
    
    const validTickets = tickets.filter(ticket => {
      if (ticket.status !== 'valid') return false;
      if (ticket.cashierId !== user?.id) return false;
      
      // Vérifier délai de remboursement (2h avant départ)
      const departureTime = new Date(ticket.departureTime);
      const hoursUntilDeparture = (departureTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      return hoursUntilDeparture >= 2;
    });
    
    return sortByDate(validTickets, 'purchaseDate', 'desc');
  }, [tickets, user?.id]);

  // Filter tickets based on search
  const filteredTickets = useMemo(() => {
    if (!searchTerm) return refundableTickets;
    
    const query = searchTerm.toLowerCase();
    return refundableTickets.filter(ticket =>
      ticket.passengerName.toLowerCase().includes(query) ||
      ticket.passengerPhone.includes(query) ||
      ticket.id.toLowerCase().includes(query) ||
      ticket.departure.toLowerCase().includes(query) ||
      ticket.arrival.toLowerCase().includes(query)
    );
  }, [refundableTickets, searchTerm]);

  const handleRefundClick = (ticket: Ticket) => {
    const currentSelection = new Set(selectedTickets);
    if (currentSelection.has(ticket.id)) {
      currentSelection.delete(ticket.id);
    } else {
      currentSelection.add(ticket.id);
    }
    setSelectedTickets(currentSelection);
  };

  const handleConfirmRefund = () => {
    if (selectedTickets.size === 0) {
      toast.error('Veuillez sélectionner au moins un billet à rembourser');
      return;
    }

    // ✅ REFACTORISÉ: Calculer le montant total avec fonction centralisée
    const selectedTicketsList = tickets.filter(t => selectedTickets.has(t.id));
    const totalAmount = calculateTicketsRevenue(selectedTicketsList);

    // Confirm refund
    if (confirm(`Confirmer le remboursement de ${formatCurrency(totalAmount)} ?`)) {
      selectedTickets.forEach(id => refundTicket(id));
      
      toast.success(
        `Billets remboursés avec succès!\n${formatCurrency(totalAmount)} remboursés`,
        { duration: 5000 }
      );

      setSelectedTickets(new Set());
    }
  };

  if (!user) return null;

  return (
    <div className="p-6 space-y-6">
      <BackButton />
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Remboursements
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gérez les remboursements de billets
        </p>
      </div>

      {/* Info Card */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-blue-800 dark:text-blue-400">
            <p className="font-medium mb-1">Politique de remboursement</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Seuls vos propres billets peuvent être remboursés</li>
              <li>Les billets doivent être valides et non utilisés</li>
              <li>Le départ ne doit pas avoir eu lieu</li>
              <li>Le remboursement sera déduit de votre caisse</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            type="text"
            placeholder="Rechercher par nom, téléphone, ID billet, trajet..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Billets remboursables</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {refundableTickets.length}
              </p>
            </div>
            <CheckCircle className="text-green-600 dark:text-green-400" size={32} />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Montant total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(calculateTicketsRevenue(refundableTickets))}
              </p>
            </div>
            <RefreshCw className="text-blue-600 dark:text-blue-400" size={32} />
          </div>
        </Card>
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
        {filteredTickets.length === 0 ? (
          <Card className="p-12 text-center">
            <XCircle size={48} className="mx-auto mb-3 opacity-30 text-gray-400" />
            <p className="text-lg text-gray-500 dark:text-gray-400">
              {searchTerm ? 'Aucun billet trouvé' : 'Aucun billet remboursable'}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              {searchTerm ? 'Essayez une autre recherche' : 'Tous vos billets ont été utilisés ou remboursés'}
            </p>
          </Card>
        ) : (
          filteredTickets.map((ticket: any) => (
            <Card key={ticket.id} className="p-6 hover:border-[#f59e0b] transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      {ticket.passengerName}
                    </h3>
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                      Valide
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {ticket.passengerPhone}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[#f59e0b]">
                    {formatCurrency(ticket.price)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {getPaymentMethodLabel(ticket.paymentMethod)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Trajet</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {ticket.departure} → {ticket.arrival}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Départ</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDateTime(ticket.departureTime)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Siège</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {ticket.seatNumber}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Date d'achat</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDate(ticket.purchaseDate)}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  onClick={() => handleRefundClick(ticket)}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  <RefreshCw className="mr-2" size={18} />
                  Rembourser ce billet
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Refund Dialog */}
      <FormDialog
        open={selectedTickets.size > 0}
        onOpenChange={() => setSelectedTickets(new Set())}
        title="Confirmer le remboursement"
        description="Vérifiez les informations avant de procéder au remboursement"
        onSubmit={handleConfirmRefund}
        submitLabel="Confirmer le remboursement"
      >
        {selectedTickets.size > 0 && (
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-800 dark:text-yellow-400">
                ⚠️ Cette action est irréversible. Le montant sera déduit de votre caisse.
              </p>
            </div>

            <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              {Array.from(selectedTickets).map(id => {
                const ticket = tickets.find(t => t.id === id);
                if (!ticket) return null;
                return (
                  <div key={id}>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Passager:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {ticket.passengerName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Trajet:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {ticket.departure} → {ticket.arrival}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Siège:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {ticket.seatNumber}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Mode de paiement:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {getPaymentMethodLabel(ticket.paymentMethod)}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-200 dark:border-gray-600">
                      <span className="text-gray-900 dark:text-white">Montant à rembourser:</span>
                      <span className="text-red-600 dark:text-red-400">
                        {formatCurrency(ticket.price)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </FormDialog>
    </div>
  );
}


