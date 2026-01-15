import type { Page } from '../App';
/**
 * PaymentPage - Paiement
 * 
 * DEV NOTES:
 * - POST /payments/init → redirect to PSP (Orange Money, Moov, etc.)
 * - Webhook: POST /payments/webhook → convert HOLD to PAID
 * - Poll status: GET /payments/status?hold_id=
 * - Event: payment_initiated, payment_success, payment_failed
 * - Idempotency key obligatoire
 * - Show processing spinner + redirect simulation
 */

import { useState } from 'react';
import { ArrowLeft, CreditCard, Smartphone, CheckCircle, XCircle, Loader } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../components/ui/button';
import { BookingStepIndicator } from '../components/BookingStepIndicator';
import { InteractiveButton } from '../components/InteractiveButton';
import { feedback, showConfetti } from '../lib/interactions';
import { usePaymentMethods } from '../lib/hooks';

interface PaymentPageProps {
  reservationData: any;
  onNavigate: (page: Page, data?: any) => void;
  onBack: () => void;
}

export function PaymentPage({ reservationData, onNavigate, onBack }: PaymentPageProps) {
  const { methods: paymentMethods, isLoading: methodsLoading } = usePaymentMethods();
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed' | null>(null);

  const handlePayment = () => {
    if (!paymentMethod) {
      feedback.error();
      alert('Veuillez sélectionner un mode de paiement');
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('pending');

    // Simulate payment processing
    setTimeout(() => {
      const success = Math.random() > 0.1; // 90% success rate
      
      if (success) {
        setPaymentStatus('success');
        feedback.payment();
        showConfetti();
        setTimeout(() => {
          const ticketId = `TK${Date.now()}`;
          onNavigate('payment-success', { ticketId, ...reservationData });
        }, 2000);
      } else {
        setPaymentStatus('failed');
        feedback.error();
        setIsProcessing(false);
      }
    }, 3000);
  };

  const handleRetry = () => {
    feedback.tap();
    setPaymentStatus(null);
    setIsProcessing(false);
  };

  if (paymentStatus === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="relative mb-6">
            <div className="w-20 h-20 border-4 border-green-200 dark:border-green-800 rounded-full mx-auto"></div>
            <div className="w-20 h-20 border-4 border-green-600 dark:border-green-500 rounded-full border-t-transparent absolute top-0 left-1/2 -translate-x-1/2 animate-spin"></div>
          </div>
          <h2 className="text-2xl text-gray-900 dark:text-white mb-2">Traitement du paiement</h2>
          <p className="text-gray-600 dark:text-gray-400">Veuillez patienter...</p>
          <div className="mt-6 flex items-center justify-center gap-1">
            <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-amber-600 dark:bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-red-600 dark:bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Ne fermez pas cette page</p>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-amber-50 to-red-50 dark:from-green-900/20 dark:via-amber-900/20 dark:to-red-900/20 flex items-center justify-center relative overflow-hidden">
        {/* Confetti Background */}
        {Array.from({ length: 50 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 rounded-full"
            style={{
              background: ['#22c55e', '#eab308', '#dc2626'][i % 3],
              left: `${Math.random() * 100}%`,
              top: '-10px'
            }}
            animate={{
              y: ['0vh', '120vh'],
              x: [0, Math.random() * 100 - 50],
              rotate: [0, Math.random() * 360],
              opacity: [1, 0]
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              delay: Math.random() * 0.5,
              ease: "easeIn"
            }}
          />
        ))}

        <div className="text-center relative z-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 15
            }}
            className="relative inline-block mb-6"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 0.5,
                repeat: 3
              }}
            >
              <CheckCircle className="w-32 h-32 text-green-600 dark:text-green-400" />
            </motion.div>
            
            {/* Rings */}
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="absolute inset-0 border-4 border-green-500 dark:border-green-400 rounded-full"
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{
                  scale: [1, 2, 3],
                  opacity: [0.8, 0.4, 0]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.3
                }}
              />
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-3xl text-gray-900 dark:text-white mb-2">Paiement réussi !</h2>
            <motion.p 
              className="text-gray-600 dark:text-gray-300 text-xl"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
            >
              🎉 Redirection vers votre billet...
            </motion.p>
          </motion.div>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'failed') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <XCircle className="w-24 h-24 text-red-600 dark:text-red-400 mx-auto mb-4" />
          <h2 className="text-3xl text-gray-900 dark:text-white mb-2">Paiement échoué</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Une erreur s'est produite lors du traitement de votre paiement
          </p>
          <div className="space-y-3">
            <Button
              onClick={handleRetry}
              className="w-full bg-gradient-to-r from-red-600 via-amber-500 to-green-600 hover:from-red-700 hover:via-amber-600 hover:to-green-700"
            >
              Réessayer
            </Button>
            <Button
              onClick={() => {
                feedback.tap();
                onBack();
              }}
              variant="outline"
              className="w-full border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Retour
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
  <BookingStepIndicator currentStep="payment" completedSteps={['search', 'outbound-seat']} />

      {/* Header */}
      <motion.div 
        className="bg-gradient-to-r from-red-600 via-amber-500 to-green-600 px-6 py-6"
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
            <span className="text-base">Retour aux sièges</span>
          </motion.button>
          
          <motion.div 
            className="text-white"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-2xl mb-1">Finaliser le paiement</h1>
            <p className="text-sm opacity-90">Choisissez votre mode de paiement</p>
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
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Reservation Summary */}
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-lg text-gray-900 dark:text-white mb-4">Récapitulatif</h2>
            
            <div className="space-y-6">
              {/* Outbound Trip */}
              {reservationData.outbound && (
                <div>
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-lg">🚌</span>
                    <h3 className="text-green-600 dark:text-green-400">Trajet Aller</h3>
                  </div>
                  <div className="space-y-2 text-sm mb-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">De</span>
                      <span className="text-gray-900 dark:text-white">{reservationData.outbound.trip?.from_stop_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">À</span>
                      <span className="text-gray-900 dark:text-white">{reservationData.outbound.trip?.to_stop_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Sièges</span>
                      <span className="text-gray-900 dark:text-white">{reservationData.outbound.seats?.join(', ')}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Return Trip */}
              {reservationData.return && (
                <div>
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-lg">🔄</span>
                    <h3 className="text-amber-600 dark:text-amber-400">Trajet Retour</h3>
                  </div>
                  <div className="space-y-2 text-sm mb-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">De</span>
                      <span className="text-gray-900 dark:text-white">{reservationData.return.trip?.from_stop_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">À</span>
                      <span className="text-gray-900 dark:text-white">{reservationData.return.trip?.to_stop_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Sièges</span>
                      <span className="text-gray-900 dark:text-white">{reservationData.return.seats?.join(', ')}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Passengers */}
              {reservationData.passengers && (
                <div>
                  <h3 className="text-gray-900 dark:text-white mb-3">Passagers</h3>
                  {reservationData.passengers.map((passenger: any, index: number) => (
                    <div key={index} className="pb-3 mb-3 border-b border-gray-100 dark:border-gray-700 last:border-0 last:mb-0 last:pb-0">
                      <p className="text-sm text-amber-600 dark:text-amber-400 mb-2">Passager {index + 1}</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Nom</span>
                          <span className="text-gray-900 dark:text-white">{passenger.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Téléphone</span>
                          <span className="text-gray-900 dark:text-white">{passenger.phone}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="pt-3 border-t-2 border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-lg text-gray-900 dark:text-white">Total à payer</span>
                  <span className="text-2xl text-green-600 dark:text-green-400">
                    {(reservationData.total_price || reservationData.price)?.toLocaleString()} FCFA
                  </span>
                </div>
                {reservationData.is_round_trip && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                    Aller-retour
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Payment Methods */}
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-lg text-gray-900 dark:text-white mb-4">Mode de paiement</h2>
            
            {methodsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-full h-20 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {paymentMethods.filter(method => method.enabled).map((method) => {
                  const isSelected = paymentMethod === method.id;
                  
                  // Icon colors based on provider
                  const getProviderColor = () => {
                    if (method.provider === 'orange') return 'bg-orange-500 dark:bg-orange-600';
                    if (method.provider === 'moov') return 'bg-blue-500 dark:bg-blue-600';
                    return 'bg-green-600 dark:bg-green-500';
                  };
                  
                  const getIcon = () => {
                    if (method.type === 'mobile_money') return <Smartphone className="w-6 h-6 text-white" />;
                    if (method.type === 'card') return <CreditCard className="w-6 h-6 text-white" />;
                    return <span className="text-2xl">{method.logo}</span>;
                  };
                  
                  return (
                    <motion.button
                      key={method.id}
                      onClick={() => {
                        feedback.tap();
                        setPaymentMethod(method.id);
                      }}
                      className={`w-full flex items-center gap-4 p-4 border-2 rounded-xl transition-all ${
                        isSelected
                          ? 'border-green-600 dark:border-green-400 bg-green-50 dark:bg-green-900/20 shadow-lg'
                          : 'border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-400'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={`w-12 h-12 ${getProviderColor()} rounded-lg flex items-center justify-center transition-transform ${
                        isSelected ? 'scale-110' : ''
                      }`}>
                        {getIcon()}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-gray-900 dark:text-white">{method.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {method.type === 'mobile_money' ? 'Paiement mobile sécurisé' : 'Visa, Mastercard'}
                          {method.fees_percentage && (
                            <span className="ml-2 text-xs">• Frais {method.fees_percentage}%</span>
                          )}
                        </p>
                      </div>
                      {isSelected && (
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 animate-scale-in" />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Security Notice */}
          <motion.div 
            className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-sm text-green-800 dark:text-green-300">
              🔒 Paiement 100% sécurisé. Vos données bancaires sont protégées.
            </p>
          </motion.div>

          {/* Pay Button */}
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 sticky bottom-6 shadow-lg border border-gray-100 dark:border-gray-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <InteractiveButton
              onClick={handlePayment}
              disabled={!paymentMethod || isProcessing}
              feedbackType="click"
              className="w-full bg-gradient-to-r from-red-600 via-amber-500 to-green-600 hover:from-red-700 hover:via-amber-600 hover:to-green-700 py-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed min-h-[56px]"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader className="w-5 h-5 animate-spin" />
                  Traitement...
                </span>
              ) : (
                `Payer ${(reservationData.total_price || reservationData.price)?.toLocaleString()} FCFA`
              )}
            </InteractiveButton>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
              Votre réservation sera confirmée après le paiement
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
