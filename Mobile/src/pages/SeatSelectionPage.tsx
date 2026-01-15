import type { Page } from '../App';
/**
 * SeatSelectionPage - Sélection de siège
 * 
 * DEV NOTES:
 * - Affiche SeatMap component avec états
 * - POST /tickets/reserve (idempotency_key, seat_choice)
 * - TTL Timer visible durant HOLD (10-15 min)
 * - Event: seat_selected, hold_created, hold_expired
 * - Après sélection → navigation vers paiement (aller simple) ou sélection retour (aller-retour)
 */

import { useState } from 'react';
import { ArrowLeft, User, Users } from 'lucide-react';
import { SeatMap } from '../components/SeatMap';
import { TTLTimer } from '../components/TTLTimer';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { TRIPS } from '../data/models';
import { BookingStepIndicator } from '../components/BookingStepIndicator';
import { motion } from 'motion/react';
import { feedback } from '../lib/interactions';
import { useSeats } from '../lib/hooks';

interface SeatSelectionPageProps {
  tripId: string;
  passengers?: number;
  userName?: string;
  userPhone?: string;
  isRoundTrip?: boolean;
  returnDate?: string;
  // For return trip leg
  outboundTripData?: {
    tripId: string;
    seats: string[];
    passengersInfo: PassengerInfo[];
  };
  onNavigate: (page: Page, data?: any) => void;
  onBack: () => void;
}

interface PassengerInfo {
  bookingFor: 'self' | 'other';
  name: string;
  // phone is optional now — used only for notification if provided
  phone?: string;
}

export function SeatSelectionPage({ 
  tripId, 
  passengers = 1, 
  userName, 
  userPhone, 
  isRoundTrip = false,
  returnDate,
  outboundTripData,
  onNavigate, 
  onBack 
}: SeatSelectionPageProps) {
  const isReturnLeg = !!outboundTripData;
  const trip = TRIPS.find(t => t.trip_id === tripId);
  
  // ✅ BACKEND READY: Hook pour récupérer sièges + layout
  const { seats: occupiedSeats, layout: seatLayout, isLoading: seatsLoading } = useSeats(tripId);
  
  const [selectedSeats, setSelectedSeats] = useState<string[]>(Array(passengers).fill(''));
  const [currentPassengerIndex, setCurrentPassengerIndex] = useState(0);
  const [passengersInfo, setPassengersInfo] = useState<PassengerInfo[]>(
    // Si c'est le trajet retour, on réutilise les infos passagers du trajet aller
    isReturnLeg && outboundTripData 
      ? outboundTripData.passengersInfo 
      : Array.from({ length: passengers }, () => ({ bookingFor: 'self', name: '', phone: '' }))
  );
  const [holdExpiresAt, setHoldExpiresAt] = useState<Date | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'booking-for' | 'passenger-info' | 'seat-selection'>(
    isReturnLeg ? 'seat-selection' : 'booking-for'
  );

  if (!trip) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Trajet non trouvé</p>
          <Button onClick={onBack}>Retour</Button>
        </div>
      </div>
    );
  }

  const handleBookingForChoice = (choice: 'self' | 'other') => {
    feedback.tap();
    const updatedPassengers = [...passengersInfo];
    updatedPassengers[currentPassengerIndex] = {
      ...updatedPassengers[currentPassengerIndex],
      bookingFor: choice,
      name: choice === 'self' ? (userName || '') : '',
      phone: choice === 'self' ? (userPhone || '') : ''
    };
    setPassengersInfo(updatedPassengers);

    if (choice === 'self') {
      setStep('seat-selection');
    } else {
      setStep('passenger-info');
    }
  };

  const handlePassengerInfoSubmit = () => {
    const currentPassenger = passengersInfo[currentPassengerIndex];
    
    // Validate full name: must contain at least 2 parts (first name + last name)
    const nameParts = currentPassenger.name.trim().split(/\s+/);
    if (!currentPassenger.name.trim()) {
      feedback.error();
      alert('Veuillez renseigner le nom complet');
      return;
    }
    if (nameParts.length < 2) {
      feedback.error();
      alert('Le nom complet doit contenir au minimum un prénom et un nom');
      return;
    }
    
    // Validate phone: if provided, must be exactly 8 digits
    if (currentPassenger.phone && currentPassenger.phone.trim()) {
      const phoneDigits = currentPassenger.phone.replace(/\D/g, '');
      if (phoneDigits.length !== 8) {
        feedback.error();
        alert('Le numéro de téléphone doit contenir exactement 8 chiffres');
        return;
      }
    }
    
    feedback.success();
    setStep('seat-selection');
  };

  const handleSeatSelect = (seatId: string) => {
    const currentSeat = selectedSeats[currentPassengerIndex];
    feedback.tap();
    
    if (currentSeat === seatId) {
      const newSeats = [...selectedSeats];
      newSeats[currentPassengerIndex] = '';
      setSelectedSeats(newSeats);
    } else {
      const newSeats = [...selectedSeats];
      newSeats[currentPassengerIndex] = seatId;
      setSelectedSeats(newSeats);
      
      if (currentPassengerIndex === 0 && !holdExpiresAt) {
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10);
        setHoldExpiresAt(expiresAt);
      }
    }
  };

  const handleNextPassenger = () => {
    const currentSeat = selectedSeats[currentPassengerIndex];
    
    if (!currentSeat) {
      feedback.error();
      alert('Veuillez sélectionner un siège pour ce passager');
      return;
    }

    feedback.success();

    if (currentPassengerIndex < passengers - 1) {
      setCurrentPassengerIndex(currentPassengerIndex + 1);
      if (!isReturnLeg) {
        setStep('booking-for');
      }
    } else {
      handleContinue();
    }
  };

  const handleContinue = () => {
    const validSeats = selectedSeats.filter(seat => seat !== '');
    if (validSeats.length !== passengers) {
      feedback.error();
      alert(`Veuillez sélectionner un siège pour tous les passagers`);
      return;
    }

    for (let i = 0; i < passengers; i++) {
      const passenger = passengersInfo[i];
      if (!passenger.name) {
        feedback.error();
        alert(`Veuillez renseigner le nom du passager ${i + 1}`);
        return;
      }
      // phone remains optional — no blocking validation
    }

    setIsProcessing(true);
    feedback.success();

    setTimeout(() => {
      if (isRoundTrip && !isReturnLeg) {
        // C'est le trajet aller, on navigue vers la recherche de trajets retour (même compagnie)
        onNavigate('search-results', {
          from: trip.to_stop_id,
          to: trip.from_stop_id,
          date: returnDate,
          type: 'ALLER_RETOUR',
          passengers,
          isReturnSelection: true,
          filterOperator: trip.operator_name,
          outboundTripData: {
            tripId: trip.trip_id,
            seats: validSeats,
            passengersInfo: passengersInfo,
            trip: trip
          }
        });
      } else {
        // Soit aller simple, soit trajet retour → on va vers le paiement
        const reservationData = {
          outbound: isReturnLeg && outboundTripData ? {
            trip_id: outboundTripData.tripId,
            seats: outboundTripData.seats,
            trip: TRIPS.find(t => t.trip_id === outboundTripData.tripId)
          } : {
            trip_id: tripId,
            seats: validSeats,
            trip: trip
          },
          return: isReturnLeg ? {
            trip_id: tripId,
            seats: validSeats,
            trip: trip
          } : null,
          passengers: passengersInfo,
          total_price: isReturnLeg && outboundTripData 
            ? (TRIPS.find(t => t.trip_id === outboundTripData.tripId)?.base_price || 0) * passengers + trip.base_price * passengers
            : trip.base_price * passengers,
          hold_id: `HOLD_${Date.now()}`,
          expires_at: holdExpiresAt,
          is_round_trip: isRoundTrip || isReturnLeg
        };

        onNavigate('payment', reservationData);
      }
    }, 1000);
  };

  const handleHoldExpire = () => {
    feedback.error();
    alert('Votre réservation a expiré. Veuillez recommencer.');
    setSelectedSeats(Array(passengers).fill(''));
    setHoldExpiresAt(null);
    setCurrentPassengerIndex(0);
    if (!isReturnLeg) {
      setPassengersInfo(Array.from({ length: passengers }, () => ({ bookingFor: 'self', name: '', phone: '' })));
      setStep('booking-for');
    }
  };

  // Déterminer l'étape actuelle pour BookingStepIndicator
  const currentBookingStep = isRoundTrip 
    ? (isReturnLeg ? 'return-seat' : 'outbound-seat')
    : 'outbound-seat';

  const completedBookingSteps = isRoundTrip
    ? (isReturnLeg ? ['outbound-seat' as const] : [])
    : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <BookingStepIndicator 
        currentStep={currentBookingStep} 
        completedSteps={completedBookingSteps}
        isRoundTrip={isRoundTrip || isReturnLeg}
      />

      {/* Header */}
      <motion.div 
        className="bg-gradient-to-r from-red-600 via-amber-500 to-green-600 px-6 py-6 shadow-lg"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="max-w-4xl mx-auto">
          <motion.button
            onClick={() => {
              feedback.tap();
              onBack();
            }}
            className="text-white mb-4 flex items-center gap-2 min-h-[44px] -ml-2 px-2"
            whileHover={{ x: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm sm:text-base">Retour aux trajets</span>
          </motion.button>
          
          <motion.div 
            className="text-white"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {(isRoundTrip || isReturnLeg) && (
              <div className="flex gap-2 mb-2">
                <span className={`px-3 py-1 rounded-full text-xs ${!isReturnLeg ? 'bg-white text-green-600' : 'bg-white/20'}`}>
                  Aller
                </span>
                <span className={`px-3 py-1 rounded-full text-xs ${isReturnLeg ? 'bg-white text-amber-600' : 'bg-white/20'}`}>
                  Retour
                </span>
              </div>
            )}
            <h1 className="text-xl sm:text-2xl mb-1">
              {isReturnLeg ? 'Billet Retour' : isRoundTrip ? 'Billet Aller' : 'Choisissez votre place'}
            </h1>
            <p className="text-xs sm:text-sm opacity-90">
              {trip.from_stop_name} → {trip.to_stop_name}
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div 
        className="px-6 py-6 pb-24"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="max-w-4xl mx-auto space-y-6">
          {/* TTL Timer */}
          {holdExpiresAt && (
            <TTLTimer expiresAt={holdExpiresAt} onExpire={handleHoldExpire} />
          )}

          {/* Progress Indicator */}
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="space-y-3">
              {(isRoundTrip || isReturnLeg) && (
                <div className="flex items-center justify-between text-sm pb-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">
                    {isReturnLeg ? '🔄 Trajet Retour' : '🚌 Trajet Aller'}
                  </span>
                  <span className="text-amber-600 dark:text-amber-400">
                    {isReturnLeg ? 'Étape 2/3' : 'Étape 1/3'}
                  </span>
                </div>
              )}
              {passengers > 1 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Passager {currentPassengerIndex + 1} sur {passengers}</span>
                  <div className="flex gap-1">
                    {Array.from({ length: passengers }, (_, i) => (
                      <div
                        key={i}
                        className={`w-8 h-1.5 rounded-full ${
                          i <= currentPassengerIndex ? 'bg-green-600 dark:bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* STEP 1: Pour qui réservez-vous ? (seulement pour le trajet aller) */}
          {step === 'booking-for' && !isReturnLeg && (
            <motion.div 
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h2 className="text-lg text-gray-900 dark:text-white">
                  {passengers > 1 
                    ? `Pour qui est le billet du passager ${currentPassengerIndex + 1} ?`
                    : 'Pour qui réservez-vous ?'
                  }
                </h2>
              </div>

              <div className="space-y-3">
                <motion.button
                  onClick={() => handleBookingForChoice('self')}
                  className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:border-green-500 dark:hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all text-left group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-800/30 transition-colors">
                      <User className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-base text-gray-900 dark:text-white">Pour moi-même</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Utiliser mes informations</p>
                    </div>
                  </div>
                </motion.button>

                <motion.button
                  onClick={() => handleBookingForChoice('other')}
                  className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:border-amber-500 dark:hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all text-left group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center group-hover:bg-amber-200 dark:group-hover:bg-amber-800/30 transition-colors">
                      <Users className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-base text-gray-900 dark:text-white">Pour une autre personne</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Saisir les informations du passager</p>
                    </div>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Informations passager (si 'other' et pas trajet retour) */}
          {step === 'passenger-info' && !isReturnLeg && (
            <motion.div 
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h2 className="text-lg text-gray-900 dark:text-white">
                  Informations du passager {passengers > 1 ? currentPassengerIndex + 1 : ''}
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                    Nom complet * (Prénom + Nom)
                  </label>
                  <Input
                    type="text"
                    value={passengersInfo[currentPassengerIndex].name}
                    onChange={(e) => {
                      const updated = [...passengersInfo];
                      updated[currentPassengerIndex].name = e.target.value;
                      setPassengersInfo(updated);
                    }}
                    placeholder="Ex: Marie Ouédraogo"
                    className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                    Téléphone (optionnel)
                  </label>
                  <Input
                    type="tel"
                    value={passengersInfo[currentPassengerIndex].phone || ''}
                    onChange={(e) => {
                      const updated = [...passengersInfo];
                      updated[currentPassengerIndex].phone = e.target.value;
                      setPassengersInfo(updated);
                    }}
                    placeholder="70123456 (8 chiffres Burkina)"
                    className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600"
                  />
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  * Ces informations seront utilisées pour le billet
                </p>

                <Button
                  onClick={handlePassengerInfoSubmit}
                  className="w-full bg-gradient-to-r from-red-600 via-amber-500 to-green-600 hover:from-red-700 hover:via-amber-600 hover:to-green-700"
                >
                  Continuer vers sélection siège
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Sélection des sièges */}
          {step === 'seat-selection' && (
            <>
              <SeatMap
                layout={seatLayout || undefined}  // ✅ Configuration dynamique depuis backend
                occupiedSeats={{
                  ...occupiedSeats,  // ✅ États depuis backend
                  ...Object.fromEntries(
                    selectedSeats
                      .map((seat, idx) => idx !== currentPassengerIndex && seat ? [seat, 'hold' as const] : null)
                      .filter((entry): entry is [string, 'hold'] => entry !== null)
                  )
                }}
                selectedSeats={selectedSeats[currentPassengerIndex] ? [selectedSeats[currentPassengerIndex]] : []}
                onSeatSelect={handleSeatSelect}
              />

              {/* Selected Seat Info for Current Passenger */}
              {selectedSeats[currentPassengerIndex] && (
                <motion.div 
                  className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-2xl p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h3 className="text-lg text-gray-900 dark:text-white mb-3">
                    Siège sélectionné pour {passengersInfo[currentPassengerIndex].name || `Passager ${currentPassengerIndex + 1}`}
                  </h3>
                  <div className="flex items-center justify-between mb-4">
                    <div className="px-6 py-3 bg-green-600 dark:bg-green-500 text-white rounded-lg text-2xl">
                      {selectedSeats[currentPassengerIndex]}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Prix</p>
                      <p className="text-2xl text-gray-900 dark:text-white">
                        {trip.base_price.toLocaleString()} FCFA
                      </p>
                    </div>
                  </div>
                  
                  {selectedSeats.filter(s => s !== '').length > 0 && (
                    <div className="pt-4 border-t border-green-200 dark:border-green-700">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Sièges réservés {(isRoundTrip || isReturnLeg) ? `(${isReturnLeg ? 'Retour' : 'Aller'})` : ''} :
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedSeats.map((seat, idx) => 
                          seat ? (
                            <div key={idx} className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-sm">
                              P{idx + 1}: {seat}
                            </div>
                          ) : null
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Total ce trajet
                        </span>
                        <span className="text-xl text-gray-900 dark:text-white">
                          {(trip.base_price * selectedSeats.filter(s => s !== '').length).toLocaleString()} FCFA
                        </span>
                      </div>
                      {(isRoundTrip || isReturnLeg) && (
                        <div className="flex items-center justify-between mt-2 text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            {isReturnLeg ? 'Total final (aller-retour)' : 'Retour à sélectionner'}
                          </span>
                          <span className="text-green-600 dark:text-green-400">
                            {isReturnLeg && outboundTripData
                              ? ((TRIPS.find(t => t.trip_id === outboundTripData.tripId)?.base_price || 0) * passengers + trip.base_price * passengers).toLocaleString() + ' FCFA'
                              : '—'
                            }
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Continue Button */}
              <motion.div 
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 sticky bottom-6 shadow-lg border border-gray-100 dark:border-gray-700"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Button
                  onClick={handleNextPassenger}
                  disabled={!selectedSeats[currentPassengerIndex] || isProcessing}
                  className="w-full bg-gradient-to-r from-red-600 via-amber-500 to-green-600 hover:from-red-700 hover:via-amber-600 hover:to-green-700 py-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing 
                    ? 'Traitement...' 
                    : currentPassengerIndex < passengers - 1 && passengers > 1
                      ? `Passager suivant (${currentPassengerIndex + 2}/${passengers})`
                      : isRoundTrip && !isReturnLeg
                        ? '🔄 Valider et choisir le trajet Retour'
                        : 'Continuer vers le paiement'
                  }
                </Button>

                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
                  {!selectedSeats[currentPassengerIndex]
                    ? `Sélectionnez un siège pour ${passengers > 1 ? `le passager ${currentPassengerIndex + 1}` : 'continuer'}`
                    : isRoundTrip && !isReturnLeg
                      ? 'Vous allez sélectionner le trajet retour (même compagnie)'
                      : 'Cliquez pour continuer'
                  }
                </p>
              </motion.div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
