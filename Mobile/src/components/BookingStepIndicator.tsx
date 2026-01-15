/**
 * BookingStepIndicator - Indicateur visuel des étapes de réservation
 * Aide les utilisateurs à comprendre où ils en sont dans le processus
 * 
 * DEV NOTES:
 * - Stepper linéaire avec labels clairs
 * - Support mobile et desktop
 * - Accessibilité ARIA
 * - Gère 2 étapes (aller simple) ou 3 étapes (aller-retour)
 */

import { Check, MapPin, Armchair, CreditCard, Ticket } from 'lucide-react';

export type BookingStep = 'search' | 'outbound-seat' | 'return-seat' | 'payment' | 'confirmation';

interface BookingStepIndicatorProps {
  currentStep: BookingStep;
  completedSteps?: BookingStep[];
  isRoundTrip?: boolean;
}

// Étapes pour aller simple
const SIMPLE_STEPS = [
  { id: 'search' as BookingStep, label: 'Choisir le trajet', icon: MapPin, sublabel: undefined },
  { id: 'outbound-seat' as BookingStep, label: 'Choisir la place', icon: Armchair, sublabel: undefined },
  { id: 'payment' as BookingStep, label: 'Payer', icon: CreditCard, sublabel: undefined },
  { id: 'confirmation' as BookingStep, label: 'Confirmation', icon: Ticket, sublabel: undefined },
];

// Étapes pour aller-retour (3 étapes principales)
const ROUNDTRIP_STEPS = [
  { id: 'outbound-seat' as BookingStep, label: 'Billet Aller', icon: Armchair, sublabel: 'Sélection & validation' },
  { id: 'return-seat' as BookingStep, label: 'Billet Retour', icon: Armchair, sublabel: 'Sélection & validation' },
  { id: 'payment' as BookingStep, label: 'Paiement', icon: CreditCard, sublabel: 'Paiement unique' },
];

export function BookingStepIndicator({ currentStep, completedSteps = [], isRoundTrip = false }: BookingStepIndicatorProps) {
  const STEPS = isRoundTrip ? ROUNDTRIP_STEPS : SIMPLE_STEPS;
  
  const getCurrentStepIndex = () => STEPS.findIndex(s => s.id === currentStep);
  const currentStepIndex = getCurrentStepIndex();

  const getStepStatus = (stepIndex: number): 'completed' | 'current' | 'upcoming' => {
    const step = STEPS[stepIndex];
    if (completedSteps.includes(step.id)) return 'completed';
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4 sm:px-6 sm:py-6">
      <div className="max-w-3xl mx-auto">
        {/* Desktop Stepper */}
        <div className="hidden sm:flex items-center justify-between">
          {STEPS.map((step, index) => {
            const status = getStepStatus(index);
            const Icon = step.icon;
            const isLast = index === STEPS.length - 1;

            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  {/* Icon Circle */}
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      status === 'completed'
                        ? 'bg-gradient-to-r from-green-600 to-green-500 dark:from-green-500 dark:to-green-600 text-white'
                        : status === 'current'
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 ring-4 ring-amber-100 dark:ring-amber-900/50'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                    }`}
                    aria-current={status === 'current' ? 'step' : undefined}
                  >
                    {status === 'completed' ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                  </div>
                  
                  {/* Label */}
                  <div className="mt-2 text-center">
                    <p
                      className={`text-sm ${
                        status === 'current'
                          ? 'text-amber-600 dark:text-amber-400'
                          : status === 'completed'
                          ? 'text-gray-700 dark:text-gray-300'
                          : 'text-gray-400 dark:text-gray-500'
                      }`}
                    >
                      {step.label}
                    </p>
                    {step.sublabel && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {step.sublabel}
                      </p>
                    )}
                  </div>
                </div>

                {/* Connector Line */}
                {!isLast && (
                  <div className="flex-1 h-0.5 mx-4 mb-8">
                    <div
                      className={`h-full transition-all ${
                        status === 'completed'
                          ? 'bg-gradient-to-r from-green-600 to-green-500 dark:from-green-500 dark:to-green-600'
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile Stepper - Compact */}
        <div className="sm:hidden">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-900 dark:text-white">
              Étape {currentStepIndex + 1} sur {STEPS.length}
            </p>
            <p className="text-sm text-amber-600 dark:text-amber-400">
              {STEPS[currentStepIndex].label}
            </p>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-green-600 transition-all duration-500"
              style={{ width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }}
              role="progressbar"
              aria-valuenow={currentStepIndex + 1}
              aria-valuemin={1}
              aria-valuemax={STEPS.length}
              aria-label={`Progression étape ${currentStepIndex + 1} sur ${STEPS.length}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
