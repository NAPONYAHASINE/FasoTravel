import { useState, useMemo } from 'react';
import { ArrowLeft, Search, Users, MapPin, CreditCard, Printer, Plus, Minus, Check, CheckCircle2, ChevronRight, Clock } from 'lucide-react@0.487.0';
import { useNavigate } from 'react-router-dom';
import { useFilteredData } from '../../hooks/useFilteredData';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency } from '../../utils/formatters';
import { formatDateTime, getCurrentDate } from '../../utils/dateUtils';
import { getAvailableTripsForSale, getTripValidTickets, calculateTripOccupancy } from '../../utils/statsUtils';
import { getPaymentMethodLabel } from '../../utils/labels';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { BackButton } from '../../components/ui/back-button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { generateId } from '../../utils/idGenerator';
import type { Ticket } from '../../contexts/DataContext';
import { toast } from 'sonner@2.0.3';

interface PassengerInfo {
  seatNumber: string;
  name: string;
  phone: string;
}

export default function TicketSalePage() {
  const { user } = useAuth();
  const { trips, addTicket, tickets, updateTrip } = useFilteredData();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  
  // ✅ Multi-passagers avec système step-by-step
  const [passengers, setPassengers] = useState<PassengerInfo[]>([]);
  const [currentPassengerIndex, setCurrentPassengerIndex] = useState(0);
  const [currentName, setCurrentName] = useState('');
  const [currentPhone, setCurrentPhone] = useState('');
  
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mobile_money' | 'card'>('cash');
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // ✅ REFACTORISÉ: Utilise la fonction centralisée
  const availableTrips = useMemo(() => {
    return getAvailableTripsForSale(trips);
  }, [trips]);

  const filteredTrips = useMemo(() => {
    if (!searchQuery) return availableTrips;
    const query = searchQuery.toLowerCase();
    return availableTrips.filter(trip =>
      trip.departure.toLowerCase().includes(query) ||
      trip.arrival.toLowerCase().includes(query)
    );
  }, [availableTrips, searchQuery]);

  const currentTrip = useMemo(() => 
    trips.find(t => t.id === selectedTrip),
    [trips, selectedTrip]
  );

  // Generate seat grid
  const generateSeats = (totalSeats: number) => {
    const seats = [];
    const seatsPerRow = 4;
    const rows = Math.ceil(totalSeats / seatsPerRow);
    
    for (let row = 0; row < rows; row++) {
      const rowLetter = String.fromCharCode(65 + row);
      for (let col = 1; col <= seatsPerRow && seats.length < totalSeats; col++) {
        seats.push(`${rowLetter}${col}`);
      }
    }
    return seats;
  };

  // ✅ Get occupied seats from REAL tickets
  const occupiedSeats = useMemo(() => {
    if (!currentTrip) return [];
    
    return getTripValidTickets(tickets, currentTrip.id).map(t => t.seatNumber);
  }, [currentTrip, tickets]);

  const handleSeatSelect = (seatNumber: string) => {
    if (occupiedSeats.includes(seatNumber)) {
      toast.error('Ce siège est déjà occupé');
      return;
    }

    // Désélectionner
    if (selectedSeats.includes(seatNumber)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seatNumber));
      setPassengers(passengers.filter(p => p.seatNumber !== seatNumber));
      
      // Réinitialiser si on retire le siège en cours de saisie
      if (passengers[currentPassengerIndex]?.seatNumber === seatNumber) {
        setCurrentName('');
        setCurrentPhone('');
      }
      
      return;
    }

    // Sélectionner un nouveau siège
    setSelectedSeats([...selectedSeats, seatNumber]);
    
    // Si c'est le premier siège, initialiser le formulaire
    if (passengers.length === 0) {
      setCurrentName('');
      setCurrentPhone('');
      setCurrentPassengerIndex(0);
    }
  };

  // ✅ Valider le passager actuel et passer au suivant
  const handleValidateCurrentPassenger = () => {
    if (!currentName.trim()) {
      toast.error('Veuillez entrer le nom du passager');
      return;
    }
    if (!currentPhone.trim()) {
      toast.error('Veuillez entrer le numéro de téléphone');
      return;
    }

    const currentSeat = selectedSeats[currentPassengerIndex];
    
    // Vérifier si ce siège a déjà des infos
    const existingIndex = passengers.findIndex(p => p.seatNumber === currentSeat);
    
    const newPassenger = {
      seatNumber: currentSeat,
      name: currentName,
      phone: currentPhone
    };

    if (existingIndex >= 0) {
      // Mettre à jour
      const updated = [...passengers];
      updated[existingIndex] = newPassenger;
      setPassengers(updated);
    } else {
      // Ajouter
      setPassengers([...passengers, newPassenger]);
    }

    // Passer au suivant
    if (currentPassengerIndex < selectedSeats.length - 1) {
      const nextIndex = currentPassengerIndex + 1;
      setCurrentPassengerIndex(nextIndex);
      
      // Charger les infos du prochain si déjà remplies
      const nextSeat = selectedSeats[nextIndex];
      const nextPassenger = passengers.find(p => p.seatNumber === nextSeat);
      
      if (nextPassenger) {
        setCurrentName(nextPassenger.name);
        setCurrentPhone(nextPassenger.phone);
      } else {
        setCurrentName('');
        setCurrentPhone('');
      }
      
      toast.success(`✓ Passager validé pour ${currentSeat}`);
    } else {
      // Tous validés
      toast.success('✓ Tous les passagers validés !');
    }
  };

  // ✅ Modifier un passager déjà validé
  const handleEditPassenger = (index: number) => {
    setCurrentPassengerIndex(index);
    const passenger = passengers.find(p => p.seatNumber === selectedSeats[index]);
    if (passenger) {
      setCurrentName(passenger.name);
      setCurrentPhone(passenger.phone);
    }
  };

  const handleProceedToPayment = () => {
    if (selectedSeats.length === 0) {
      toast.error('Veuillez sélectionner au moins un siège');
      return;
    }
    
    if (passengers.length !== selectedSeats.length) {
      toast.error('Veuillez renseigner tous les passagers');
      return;
    }
    
    setIsPaymentDialogOpen(true);
  };

  const handleCompletePayment = async () => {
    if (!currentTrip || !user) return;

    setIsPrinting(true);

    try {
      // Créer un billet par passager
      for (const passenger of passengers) {
        addTicket({
          tripId: currentTrip.id,
          passengerName: passenger.name,
          passengerPhone: passenger.phone,
          seatNumber: passenger.seatNumber,
          price: currentTrip.price,
          commission: undefined,
          paymentMethod: paymentMethod,
          salesChannel: 'counter',
          status: 'valid',
          purchaseDate: getCurrentDate().toISOString(),
          cashierId: user.id,
          cashierName: user.name,
          gareId: currentTrip.gareId,
          departure: currentTrip.departure,
          arrival: currentTrip.arrival,
          departureTime: currentTrip.departureTime,
        });
      }

      // Mettre à jour la disponibilité
      updateTrip(currentTrip.id, {
        availableSeats: currentTrip.availableSeats - passengers.length
      });

      await new Promise(resolve => setTimeout(resolve, 1500));

      toast.success(
        `✅ ${passengers.length} billet(s) vendu(s) avec succès!\nMontant total: ${formatCurrency(totalAmount)}`,
        { duration: 5000 }
      );

      // Reset
      setSelectedTrip(null);
      setSelectedSeats([]);
      setPassengers([]);
      setCurrentPassengerIndex(0);
      setCurrentName('');
      setCurrentPhone('');
      setPaymentMethod('cash');
      setIsPaymentDialogOpen(false);
    } catch (error) {
      toast.error('Erreur lors de la vente du billet');
    } finally {
      setIsPrinting(false);
    }
  };

  const totalAmount = passengers.reduce((sum, p) => sum + (currentTrip?.price || 0), 0);
  
  // Passager actuel
  const currentSeat = selectedSeats[currentPassengerIndex];
  const isCurrentPassengerValidated = passengers.some(p => p.seatNumber === currentSeat);

  if (!user) return null;

  return (
    <div className="p-6 space-y-6">
      <BackButton />
      
      <div>
        <h1 className="text-3xl text-gray-900 dark:text-white mb-2">
          Vente de Billets
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Sélectionnez un trajet puis renseignez les passagers un par un
        </p>
      </div>

      {/* Étape 1: Recherche du trajet */}
      {!selectedTrip && (
        <Card className="p-6">
          <h2 className="text-xl text-gray-900 dark:text-white mb-4">
            1. Sélectionnez un trajet
          </h2>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              type="text"
              placeholder="Rechercher une destination..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-3">
            {filteredTrips.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <Users size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-lg">Aucun trajet disponible</p>
              </div>
            ) : (
              filteredTrips.map((trip) => (
                <Card
                  key={trip.id}
                  className="p-4 cursor-pointer hover:border-[#f59e0b] transition-all"
                  onClick={() => setSelectedTrip(trip.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <MapPin size={18} className="text-gray-500 dark:text-gray-400" />
                        <h3 className="text-gray-900 dark:text-white">
                          {trip.departure} → {trip.arrival}
                        </h3>
                        <Badge variant={trip.availableSeats < 10 ? "destructive" : "secondary"}>
                          {trip.availableSeats} places
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          <span>
                            {formatDateTime(trip.departureTime, { 
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl text-[#f59e0b]">
                        {formatCurrency(trip.price, false)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">FCFA</p>
                    </div>
                  </div>

                  <div className="mt-3 w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#dc2626] to-[#f59e0b] transition-all"
                      style={{
                        width: `${calculateTripOccupancy(trip)}%`
                      }}
                    />
                  </div>
                </Card>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Étape 2: Sélection sièges + Passagers */}
      {selectedTrip && currentTrip && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Grille de sièges */}
          <Card className="lg:col-span-2 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl text-gray-900 dark:text-white mb-1">
                  2. Sélectionnez les sièges
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {currentTrip.departure} → {currentTrip.arrival}
                </p>
              </div>
              <Button variant="outline" onClick={() => {
                setSelectedTrip(null);
                setSelectedSeats([]);
                setPassengers([]);
                setCurrentPassengerIndex(0);
                setCurrentName('');
                setCurrentPhone('');
              }}>
                Changer de trajet
              </Button>
            </div>

            {/* Légende */}
            <div className="flex items-center gap-6 mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded border-2 border-gray-300 dark:border-gray-500"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Disponible</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#f59e0b] rounded border-2 border-[#d97706]"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Sélectionné</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#16a34a] rounded border-2 border-[#15803d]"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Validé</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-400 dark:bg-gray-500 rounded border-2 border-gray-500 dark:border-gray-600 opacity-50"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Occupé</span>
              </div>
            </div>

            {/* Grille */}
            <div className="grid grid-cols-4 gap-3">
              {generateSeats(currentTrip.totalSeats).map((seatNumber) => {
                const isOccupied = occupiedSeats.includes(seatNumber);
                const isSelected = selectedSeats.includes(seatNumber);
                const isValidated = passengers.some(p => p.seatNumber === seatNumber);

                return (
                  <button
                    key={seatNumber}
                    onClick={() => handleSeatSelect(seatNumber)}
                    disabled={isOccupied}
                    className={`
                      h-12 rounded-lg border-2 transition-all relative
                      ${isOccupied
                        ? 'bg-gray-400 dark:bg-gray-500 border-gray-500 dark:border-gray-600 opacity-50 cursor-not-allowed text-gray-700 dark:text-gray-300'
                        : isValidated
                        ? 'bg-[#16a34a] border-[#15803d] text-white shadow-lg'
                        : isSelected
                        ? 'bg-[#f59e0b] border-[#d97706] text-white shadow-lg scale-105'
                        : 'bg-gray-200 dark:bg-gray-600 border-gray-300 dark:border-gray-500 hover:border-[#f59e0b] hover:scale-105 text-gray-900 dark:text-white'
                      }
                    `}
                  >
                    {seatNumber}
                    {isValidated && (
                      <CheckCircle2 size={14} className="absolute top-1 right-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Formulaire passager actuel + Paiement */}
          <Card className="p-6 h-fit sticky top-6">
            {selectedSeats.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Users size={48} className="mx-auto mb-3 opacity-30" />
                <p>Sélectionnez des sièges pour commencer</p>
              </div>
            ) : (
              <>
                <h3 className="text-lg text-gray-900 dark:text-white mb-4">
                  3. Passagers ({passengers.length}/{selectedSeats.length})
                </h3>

                {/* Liste des sièges avec statut */}
                <div className="mb-6 space-y-2">
                  {selectedSeats.map((seat, index) => {
                    const passenger = passengers.find(p => p.seatNumber === seat);
                    const isCurrent = index === currentPassengerIndex;
                    
                    return (
                      <div
                        key={seat}
                        className={`
                          p-3 rounded-lg border-2 transition-all cursor-pointer
                          ${isCurrent
                            ? 'border-[#f59e0b] bg-[#f59e0b]/10'
                            : passenger
                            ? 'border-[#16a34a] bg-[#16a34a]/10'
                            : 'border-gray-300 dark:border-gray-600'
                          }
                        `}
                        onClick={() => handleEditPassenger(index)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={passenger ? 'bg-[#16a34a]' : 'bg-[#f59e0b]'}>
                              {seat}
                            </Badge>
                            {passenger ? (
                              <div className="text-sm">
                                <p className="text-gray-900 dark:text-white">{passenger.name}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">{passenger.phone}</p>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {isCurrent ? 'En cours...' : 'À renseigner'}
                              </span>
                            )}
                          </div>
                          {passenger && <CheckCircle2 size={18} className="text-[#16a34a]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Formulaire du passager en cours */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
                  <h4 className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Passager siège <Badge className="bg-[#f59e0b]">{currentSeat}</Badge>
                  </h4>
                  
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="name">Nom complet *</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Nom du passager"
                        value={currentName}
                        onChange={(e) => setCurrentName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Téléphone *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+226 XX XX XX XX"
                        value={currentPhone}
                        onChange={(e) => setCurrentPhone(e.target.value)}
                      />
                    </div>

                    <Button
                      onClick={handleValidateCurrentPassenger}
                      className="w-full bg-[#16a34a] hover:bg-[#15803d]"
                    >
                      {currentPassengerIndex < selectedSeats.length - 1 ? (
                        <>
                          Valider et suivant <ChevronRight size={18} className="ml-2" />
                        </>
                      ) : (
                        <>
                          <Check size={18} className="mr-2" /> Valider
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Mode de paiement (si tous validés) */}
                {passengers.length === selectedSeats.length && (
                  <>
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
                      <Label className="mb-2 block">Mode de paiement</Label>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { value: 'cash', label: 'Espèces', icon: CreditCard },
                          { value: 'mobile_money', label: 'Mobile Money', icon: CreditCard },
                          { value: 'card', label: 'Carte bancaire', icon: CreditCard },
                        ].map((method) => (
                          <button
                            key={method.value}
                            onClick={() => setPaymentMethod(method.value as any)}
                            className={`
                              p-3 rounded-lg border-2 flex items-center gap-2 transition-all text-gray-900 dark:text-white
                              ${paymentMethod === method.value
                                ? 'border-[#f59e0b] bg-[#f59e0b]/10'
                                : 'border-gray-300 dark:border-gray-600 hover:border-[#f59e0b]'
                              }
                            `}
                          >
                            <method.icon size={18} />
                            <span className="text-sm">{method.label}</span>
                            {paymentMethod === method.value && (
                              <Check size={18} className="ml-auto text-[#f59e0b]" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Récapitulatif */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Nombre de billets:</span>
                          <span className="text-gray-900 dark:text-white">{passengers.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Prix unitaire:</span>
                          <span className="text-gray-900 dark:text-white">
                            {formatCurrency(currentTrip.price)}
                          </span>
                        </div>
                        <div className="flex justify-between text-lg pt-2 border-t border-gray-200 dark:border-gray-700">
                          <span className="text-gray-900 dark:text-white">Total:</span>
                          <span className="text-[#f59e0b]">{formatCurrency(totalAmount)}</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleProceedToPayment}
                      className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white"
                      size="lg"
                    >
                      <CreditCard className="mr-2" size={20} />
                      Valider la vente
                    </Button>
                  </>
                )}
              </>
            )}
          </Card>
        </div>
      )}

      {/* Dialog de confirmation */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Confirmer la vente</DialogTitle>
            <DialogDescription>
              Vérifiez les informations avant de valider
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Trajet:</span>
              <span className="text-gray-900 dark:text-white">
                {currentTrip?.departure} → {currentTrip?.arrival}
              </span>
            </div>
            
            <div className="flex justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Départ:</span>
              <span className="text-gray-900 dark:text-white">
                {currentTrip && formatDateTime(currentTrip.departureTime)}
              </span>
            </div>

            <div>
              <h4 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Passagers:</h4>
              <div className="space-y-2">
                {passengers.map((p) => (
                  <div key={p.seatNumber} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700/30 rounded">
                    <Badge className="bg-[#f59e0b]">{p.seatNumber}</Badge>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-white">{p.name}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{p.phone}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Paiement:</span>
              <span className="text-gray-900 dark:text-white">
                {getPaymentMethodLabel(paymentMethod)}
              </span>
            </div>
            
            <div className="flex justify-between text-lg pt-3 border-t-2 border-gray-300 dark:border-gray-600">
              <span className="text-gray-900 dark:text-white">Montant total:</span>
              <span className="text-[#f59e0b]">{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPaymentDialogOpen(false)}
              disabled={isPrinting}
            >
              Annuler
            </Button>
            <Button
              onClick={handleCompletePayment}
              disabled={isPrinting}
              className="bg-[#16a34a] hover:bg-[#15803d]"
            >
              {isPrinting ? (
                <>
                  <Printer className="mr-2 animate-pulse" size={18} />
                  Impression...
                </>
              ) : (
                <>
                  <Check className="mr-2" size={18} />
                  Confirmer et imprimer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}