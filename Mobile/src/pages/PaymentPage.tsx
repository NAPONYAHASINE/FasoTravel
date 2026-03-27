import type { Page, PaymentPreparationData } from '../App';
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

import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, CreditCard, Smartphone, CheckCircle, XCircle, Loader, Tag, X } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../components/ui/button';
import { BookingStepIndicator } from '../components/BookingStepIndicator';
import { InteractiveButton } from '../components/InteractiveButton';
import { feedback, showConfetti } from '../lib/interactions';
import { usePaymentMethods } from '../lib/hooks';
import { bookingService } from '../services/api/booking.service';
import { paymentService } from '../services/api/payment.service';
import { referralService } from '../services/api/referral.service';
import type { ReferralCoupon } from '../shared/types/common';

/** Frais de service FasoTravel — 100 FCFA par passager (identique admin/societe) */
const PLATFORM_SERVICE_FEE = 100;

interface PaymentPageProps {
  reservationData: any;
  selectedPaymentMethod?: string;
  selectedPaymentPayload?: PaymentPreparationData;
  pendingCoupon?: ReferralCoupon;
  onNavigate: (page: Page, data?: any) => void;
  onBack: () => void;
}

export function PaymentPage({ reservationData, selectedPaymentMethod, selectedPaymentPayload, pendingCoupon, onNavigate, onBack }: PaymentPageProps) {
  const { methods: paymentMethods, isLoading: methodsLoading } = usePaymentMethods();
  const [paymentMethod, setPaymentMethod] = useState<string | null>(selectedPaymentMethod || null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed' | null>(null);
  const [, setIsWaitingOtp] = useState(false);
  const [mobileAccountNumber, setMobileAccountNumber] = useState(selectedPaymentPayload?.payerPhone || '');
  const [cardHolderName, setCardHolderName] = useState(selectedPaymentPayload?.cardHolderName || '');
  const [cardNumber, setCardNumber] = useState(selectedPaymentPayload?.cardNumber || '');
  const [cardExpiry, setCardExpiry] = useState(selectedPaymentPayload?.cardExpiry || '');
  const [cardCvv, setCardCvv] = useState(selectedPaymentPayload?.cardCvv || '');

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<ReferralCoupon | null>(selectedPaymentPayload?.appliedCoupon || pendingCoupon || null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // ============================================
  // PRICE BREAKDOWN — calculated dynamically
  // ============================================
  const priceBreakdown = useMemo(() => {
    const numPassengers = reservationData.passengers?.length || 1;
    const ticketPrice = reservationData.total_price || reservationData.price || 0;
    const serviceFee = PLATFORM_SERVICE_FEE * numPassengers;

    // Check if there's a discount on any trip
    const outboundTrip = reservationData.outbound?.trip;
    const returnTrip = reservationData.return?.trip;
    
    let baseTotal = 0;
    let discountTotal = 0;
    
    if (outboundTrip) {
      const outboundBase = outboundTrip.base_price * numPassengers;
      baseTotal += outboundBase;
      if (outboundTrip.promoted_price && outboundTrip.promoted_price < outboundTrip.base_price) {
        discountTotal += (outboundTrip.base_price - outboundTrip.promoted_price) * numPassengers;
      }
    }
    if (returnTrip) {
      const returnBase = returnTrip.base_price * numPassengers;
      baseTotal += returnBase;
      if (returnTrip.promoted_price && returnTrip.promoted_price < returnTrip.base_price) {
        discountTotal += (returnTrip.base_price - returnTrip.promoted_price) * numPassengers;
      }
    }
    
    // If no trip objects available, fall back to passed total_price
    if (baseTotal === 0) baseTotal = ticketPrice;

    const couponDiscount = appliedCoupon ? appliedCoupon.amount : 0;

    const selectedMethod = paymentMethods.find(m => m.id === paymentMethod);
    const feePercentage = selectedMethod?.fees_percentage || 0;
    const priceAfterCoupon = Math.max(0, ticketPrice - couponDiscount);
    const paymentFee = Math.round(priceAfterCoupon * feePercentage / 100);
    
    const totalToPay = priceAfterCoupon + serviceFee + paymentFee;

    return {
      baseTotal,
      discountTotal,
      ticketPrice,
      couponDiscount,
      priceAfterCoupon,
      serviceFee,
      feePercentage,
      paymentFee,
      totalToPay,
      numPassengers,
    };
  }, [reservationData, paymentMethod, paymentMethods, appliedCoupon]);

  const selectedMethod = useMemo(
    () => paymentMethods.find((method) => method.id === paymentMethod),
    [paymentMethod, paymentMethods]
  );

  const paymentOtpIdentifier = useMemo(() => {
    if (selectedMethod?.type === 'mobile_money') {
      return mobileAccountNumber.trim();
    }

    return (
      reservationData?.userPhone ||
      reservationData?.phone ||
      reservationData?.passengers?.[0]?.phone ||
      selectedPaymentPayload?.payerPhone ||
      ''
    ).trim();
  }, [mobileAccountNumber, reservationData, selectedMethod?.type, selectedPaymentPayload?.payerPhone]);

  useEffect(() => {
    if (!selectedPaymentPayload) return;

    setMobileAccountNumber(selectedPaymentPayload.payerPhone || '');
    setCardHolderName(selectedPaymentPayload.cardHolderName || '');
    setCardNumber(selectedPaymentPayload.cardNumber || '');
    setCardExpiry(selectedPaymentPayload.cardExpiry || '');
    setCardCvv(selectedPaymentPayload.cardCvv || '');
  }, [selectedPaymentPayload]);

  const buildPaymentPayload = (): PaymentPreparationData => ({
    paymentMethod: paymentMethod || '',
    payerPhone: paymentOtpIdentifier,
    payerLabel: selectedMethod?.type === 'mobile_money' ? 'Compte Mobile Money' : 'Compte carte bancaire',
    cardHolderName: cardHolderName.trim() || undefined,
    cardNumber: cardNumber.replace(/\s/g, '') || undefined,
    cardExpiry: cardExpiry.trim() || undefined,
    cardCvv: cardCvv.trim() || undefined,
    appliedCoupon: appliedCoupon || undefined,
  });

  // ============================================
  // COUPON HANDLERS
  // ============================================

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError(null);
    try {
      const coupon = await referralService.validateCouponCode(couponCode.trim());
      setAppliedCoupon(coupon);
      setCouponCode('');
      feedback.success();
    } catch (err: any) {
      setCouponError(err.message || 'Code coupon invalide');
      feedback.error();
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
    feedback.tap();
  };

  const validatePaymentDetails = () => {
    setValidationError(null);

    if (!paymentMethod) {
      setValidationError('Veuillez sélectionner un mode de paiement');
      feedback.error();
      return false;
    }

    if (selectedMethod?.type === 'mobile_money') {
      const digits = mobileAccountNumber.replace(/\D/g, '');
      if (digits.length !== 8) {
        setValidationError('Veuillez renseigner le numéro du compte Mobile Money à débiter (8 chiffres)');
        feedback.error();
        return false;
      }
    }

    if (selectedMethod?.type === 'card') {
      const normalizedCardNumber = cardNumber.replace(/\s/g, '');
      if (!cardHolderName.trim()) {
        setValidationError('Veuillez renseigner le nom du porteur de la carte');
        feedback.error();
        return false;
      }
      if (normalizedCardNumber.length < 16) {
        setValidationError('Veuillez renseigner un numéro de carte valide');
        feedback.error();
        return false;
      }
      if (!/^\d{2}\/\d{2}$/.test(cardExpiry.trim())) {
        setValidationError('Veuillez renseigner une date d\'expiration valide (MM/AA)');
        feedback.error();
        return false;
      }
      if (!/^\d{3,4}$/.test(cardCvv.trim())) {
        setValidationError('Veuillez renseigner un cryptogramme visuel valide');
        feedback.error();
        return false;
      }
      if (!paymentOtpIdentifier) {
        setValidationError('Veuillez renseigner votre numéro WhatsApp dans le profil pour recevoir l\'OTP');
        feedback.error();
        return false;
      }
    }

    return true;
  };

  // Process payment via bookingService + paymentService
  const handlePaymentProcess = async () => {
    if (!paymentMethod) return;

    setIsProcessing(true);
    setPaymentStatus('pending');

    try {
      // 1. Create hold booking
      const outboundTrip = reservationData.outbound?.trip;
      const unitPrice = outboundTrip?.promoted_price ?? outboundTrip?.base_price ?? 0;
      const firstPassenger = reservationData.passengers?.[0];
      const booking = await bookingService.createHoldBooking({
        tripId: reservationData.outbound?.trip_id || outboundTrip?.trip_id || '',
        numSeats: priceBreakdown.numPassengers,
        unitPrice,
        passengerName: firstPassenger?.name,
        passengerPhone: firstPassenger?.phone,
      });

      // 2. Create payment
      const payment = await paymentService.createPayment(
        booking.id,
        paymentMethod as any,
        priceBreakdown.totalToPay
      );

      // 3. Process payment (simulate webhook validation)
      const result = await paymentService.processPayment(payment.id, '0000');

      if (result.status === 'completed') {
        // 4. Confirm booking
        const ticket = await bookingService.confirmBooking({
          bookingId: booking.id,
          paymentMethod: paymentMethod as any,
        });

        // 5. Mark coupon as used if applied
        if (appliedCoupon) {
          try {
            await referralService.useCoupon(appliedCoupon.id);
          } catch {
            // Non-blocking: coupon marking failure shouldn't block the payment success
          }
        }

        setPaymentStatus('success');
        feedback.payment();
        showConfetti();
        setTimeout(() => {
          onNavigate('payment-success', { 
            ...reservationData,
            ticketId: ticket.id, 
            bookingId: booking.id,
            paymentId: payment.id,
            totalPaid: priceBreakdown.totalToPay 
          });
        }, 2000);
      } else {
        setPaymentStatus('failed');
        feedback.error();
        setIsProcessing(false);
        setIsWaitingOtp(false);
      }
    } catch (err) {
      console.error('Payment failed:', err);
      setPaymentStatus('failed');
      feedback.error();
      setIsProcessing(false);
      setIsWaitingOtp(false);
    }
  };

  // Auto-process payment after returning from OTP
  useEffect(() => {
    // If we've just returned from OTP verification with paymentMethod set, auto-process
    if (selectedPaymentMethod && selectedPaymentPayload && paymentMethod && !isProcessing && paymentStatus === null) {
      handlePaymentProcess();
    }
  }, [selectedPaymentMethod, selectedPaymentPayload]);

  // Handle payment - navigate to OTP verification first
  const handlePayment = () => {
    if (!validatePaymentDetails()) {
      return;
    }

    // Request OTP verification before payment
    setIsWaitingOtp(true);
    feedback.tap();
    const paymentPayload = buildPaymentPayload();
    
    // Navigate to OTP verification with payment mode
    onNavigate('otp-verification', {
      identifier: paymentOtpIdentifier,
      mode: 'payment',
      returnPage: 'payment',
      paymentMethod: paymentMethod,
      paymentPayload,
    });
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
            <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-amber-600 dark:bg-amber-400 rounded-full animate-bounce delay-100"></div>
            <div className="w-2 h-2 bg-red-600 dark:bg-red-400 rounded-full animate-bounce delay-200"></div>
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 sm:px-6">
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
      <div className="sticky top-0 z-10 pt-safe-area">
        <BookingStepIndicator currentStep="payment" completedSteps={['search', 'outbound-seat']} />

        {/* Header */}
        <motion.div 
          className="bg-gradient-to-r from-red-600 via-amber-500 to-green-600 px-4 sm:px-6 py-6"
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
      </div>

      {/* Content */}
      <motion.div 
        className="px-4 sm:px-6 py-6 pb-24"
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
                          <span className="text-gray-600 dark:text-gray-400">Numéro WhatsApp</span>
                          <span className="text-gray-900 dark:text-white">{passenger.phone}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="pt-3 border-t-2 border-gray-200 dark:border-gray-700 space-y-2">
                {/* Discount line (if any) */}
                {priceBreakdown.discountTotal > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Prix de base ({priceBreakdown.numPassengers} passager{priceBreakdown.numPassengers > 1 ? 's' : ''})</span>
                      <span className="text-gray-500 dark:text-gray-400 line-through">{priceBreakdown.baseTotal.toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600 dark:text-green-400">Réduction promotion</span>
                      <span className="text-green-600 dark:text-green-400">-{priceBreakdown.discountTotal.toLocaleString()} FCFA</span>
                    </div>
                  </>
                )}
                
                {/* Ticket price line */}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {priceBreakdown.discountTotal > 0 ? 'Prix après réduction' : `Billet${priceBreakdown.numPassengers > 1 ? 's' : ''} (${priceBreakdown.numPassengers})`}
                  </span>
                  <span className="text-gray-900 dark:text-white">{priceBreakdown.ticketPrice.toLocaleString()} FCFA</span>
                </div>

                {/* Coupon discount line */}
                {priceBreakdown.couponDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 dark:text-green-400">Coupon parrainage ({appliedCoupon?.code})</span>
                    <span className="text-green-600 dark:text-green-400">-{priceBreakdown.couponDiscount.toLocaleString()} FCFA</span>
                  </div>
                )}

                {/* Service fee line */}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Frais de service ({priceBreakdown.numPassengers} × {PLATFORM_SERVICE_FEE} FCFA)</span>
                  <span className="text-gray-900 dark:text-white">{priceBreakdown.serviceFee.toLocaleString()} FCFA</span>
                </div>

                {/* Payment method fees (shown when method selected) */}
                {paymentMethod && priceBreakdown.paymentFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Frais de paiement ({priceBreakdown.feePercentage}%)</span>
                    <span className="text-gray-900 dark:text-white">{priceBreakdown.paymentFee.toLocaleString()} FCFA</span>
                  </div>
                )}

                {/* Total */}
                <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-lg text-gray-900 dark:text-white">Total à payer</span>
                  <span className="text-2xl text-green-600 dark:text-green-400">
                    {priceBreakdown.totalToPay.toLocaleString()} FCFA
                  </span>
                </div>
                {reservationData.is_round_trip && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
                    Aller-retour
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Payment Methods + Input Fields + Coupon — unified section */}
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
                  
                  const getProviderColor = () => {
                    if (method.provider === 'orange') return 'bg-orange-500 dark:bg-orange-600';
                    if (method.provider === 'moov') return 'bg-blue-500 dark:bg-blue-600';
                    if (method.provider === 'wave') return 'bg-cyan-500 dark:bg-cyan-600';
                    if (method.provider === 'cash') return 'bg-yellow-500 dark:bg-yellow-600';
                    return 'bg-green-600 dark:bg-green-500';
                  };
                  
                  const getIcon = () => {
                    if (method.type === 'mobile_money') return <Smartphone className="w-6 h-6 text-white" />;
                    if (method.type === 'card') return <CreditCard className="w-6 h-6 text-white" />;
                    if (method.type === 'cash') return <span className="text-2xl">💵</span>;
                    return <span className="text-2xl">{method.logo}</span>;
                  };
                  
                  return (
                    <div key={method.id}>
                      <motion.button
                        onClick={() => {
                          feedback.tap();
                          setPaymentMethod(method.id);
                          setValidationError(null);
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
                            {method.type === 'mobile_money' ? 'Paiement mobile sécurisé' : method.type === 'cash' ? 'Paiement en espèces au guichet' : 'Visa, Mastercard'}
                            {method.fees_percentage ? (
                              <span className="ml-2 text-xs">• Frais {method.fees_percentage}%</span>
                            ) : (
                              <span className="ml-2 text-xs text-green-600 dark:text-green-400">• Sans frais</span>
                            )}
                          </p>
                        </div>
                        {isSelected && (
                          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 animate-scale-in" />
                        )}
                      </motion.button>

                      {/* Inline input — directly below the selected method */}
                      {isSelected && method.type === 'mobile_money' && (
                        <motion.div
                          className="mt-2 ml-4 pl-4 border-l-2 border-green-300 dark:border-green-700 py-3 space-y-2"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          transition={{ duration: 0.2 }}
                        >
                          <label className="block text-sm text-gray-700 dark:text-gray-300">
                            Numéro {method.name} à débiter <span className="text-red-600">*</span>
                          </label>
                          <input
                            type="tel"
                            value={mobileAccountNumber}
                            onChange={(e) => {
                              setMobileAccountNumber(e.target.value.replace(/[^\d\s+]/g, '').slice(0, 16));
                              setValidationError(null);
                            }}
                            placeholder="70123456"
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 transition-colors"
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Le code OTP sera envoyé sur ce numéro pour autoriser le débit.
                          </p>

                          {/* Coupon inline — mobile money */}
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                              <Tag className="w-3.5 h-3.5 text-green-600" />
                              Code promo / Coupon
                            </label>
                            {appliedCoupon ? (
                              <div className="flex items-center gap-2 p-2.5 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10">
                                <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                                    -{appliedCoupon.amount.toLocaleString()} FCFA
                                  </p>
                                  <p className="text-xs text-gray-400 truncate">{appliedCoupon.code} • Total : {priceBreakdown.totalToPay.toLocaleString()} FCFA</p>
                                </div>
                                <button onClick={handleRemoveCoupon} className="p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500" title="Retirer le coupon" aria-label="Retirer le coupon">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={couponCode}
                                    onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(null); }}
                                    placeholder="Ex: FASO-AX7K2P"
                                    className="flex-1 px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 transition-colors text-sm"
                                  />
                                  <Button onClick={handleApplyCoupon} disabled={!couponCode.trim() || couponLoading} size="sm" className="bg-green-600 hover:bg-green-700 text-white px-3 disabled:opacity-50">
                                    {couponLoading ? <Loader className="w-4 h-4 animate-spin" /> : 'OK'}
                                  </Button>
                                </div>
                                {couponError && <p className="text-xs text-red-500 dark:text-red-400">{couponError}</p>}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}

                      {isSelected && method.type === 'card' && (
                        <motion.div
                          className="mt-2 ml-4 pl-4 border-l-2 border-green-300 dark:border-green-700 py-3 space-y-3"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          transition={{ duration: 0.2 }}
                        >
                          <div>
                            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">
                              Nom du porteur <span className="text-red-600">*</span>
                            </label>
                            <input
                              type="text"
                              value={cardHolderName}
                              onChange={(e) => { setCardHolderName(e.target.value); setValidationError(null); }}
                              placeholder="Ex: NAPON Yahasine"
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 transition-colors"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">
                              Numéro de carte <span className="text-red-600">*</span>
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={cardNumber}
                              onChange={(e) => {
                                const digits = e.target.value.replace(/\D/g, '').slice(0, 16);
                                const groups = digits.match(/.{1,4}/g) || [];
                                setCardNumber(groups.join(' '));
                                setValidationError(null);
                              }}
                              placeholder="1234 5678 9012 3456"
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 transition-colors"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">
                                Expiration <span className="text-red-600">*</span>
                              </label>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={cardExpiry}
                                onChange={(e) => {
                                  const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
                                  setCardExpiry(digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits);
                                  setValidationError(null);
                                }}
                                placeholder="MM/AA"
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 transition-colors"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">
                                CVV <span className="text-red-600">*</span>
                              </label>
                              <input
                                type="password"
                                inputMode="numeric"
                                value={cardCvv}
                                onChange={(e) => { setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4)); setValidationError(null); }}
                                placeholder="123"
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 transition-colors"
                              />
                            </div>
                          </div>
                          <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 p-3">
                            <p className="text-xs text-amber-800 dark:text-amber-300">
                              Un OTP sera envoyé sur votre numéro WhatsApp pour finaliser la transaction.
                            </p>
                          </div>

                          {/* Coupon inline — card */}
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                              <Tag className="w-3.5 h-3.5 text-green-600" />
                              Code promo / Coupon
                            </label>
                            {appliedCoupon ? (
                              <div className="flex items-center gap-2 p-2.5 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10">
                                <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                                    -{appliedCoupon.amount.toLocaleString()} FCFA
                                  </p>
                                  <p className="text-xs text-gray-400 truncate">{appliedCoupon.code} • Total : {priceBreakdown.totalToPay.toLocaleString()} FCFA</p>
                                </div>
                                <button onClick={handleRemoveCoupon} className="p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500" title="Retirer le coupon" aria-label="Retirer le coupon">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={couponCode}
                                    onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(null); }}
                                    placeholder="Ex: FASO-AX7K2P"
                                    className="flex-1 px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 transition-colors text-sm"
                                  />
                                  <Button onClick={handleApplyCoupon} disabled={!couponCode.trim() || couponLoading} size="sm" className="bg-green-600 hover:bg-green-700 text-white px-3 disabled:opacity-50">
                                    {couponLoading ? <Loader className="w-4 h-4 animate-spin" /> : 'OK'}
                                  </Button>
                                </div>
                                {couponError && <p className="text-xs text-red-500 dark:text-red-400">{couponError}</p>}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </div>
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
              🔒 Paiement 100% sécurisé. Les validations OTP passent désormais par WhatsApp ou e-mail selon le canal disponible.
            </p>
          </motion.div>

          {/* Pay Button */}
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 sticky bottom-6 shadow-lg border border-gray-100 dark:border-gray-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            {validationError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700">
                <p className="text-sm text-red-600 dark:text-red-400">{validationError}</p>
              </div>
            )}
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
                `Payer ${priceBreakdown.totalToPay.toLocaleString()} FCFA`
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
