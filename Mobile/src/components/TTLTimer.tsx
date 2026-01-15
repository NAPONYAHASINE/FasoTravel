/**
 * TTLTimer Component
 * Affiche un compte à rebours pour les réservations HOLD
 * TTL par défaut : 10-15 minutes
 * 
 * DEV NOTES:
 * - Doit être synchronisé avec le serveur (hold_expires_at)
 * - Event: ttl_expired → déclencher release du HOLD
 * - Warning visuel si < 2 min restantes
 */

import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';

interface TTLTimerProps {
  expiresAt: Date;
  onExpire?: () => void;
}

export function TTLTimer({ expiresAt, onExpire }: TTLTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = expiresAt.getTime();
      const diff = expiry - now;
      return Math.max(0, Math.floor(diff / 1000));
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      if (newTimeLeft === 0) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isWarning = timeLeft < 120; // moins de 2 minutes

  return (
    <div 
      className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
        isWarning ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'
      }`}
      role="timer"
      aria-live="polite"
      aria-atomic="true"
      aria-label={`Temps restant pour finaliser votre réservation: ${minutes} minutes et ${seconds} secondes${isWarning ? '. Attention, il reste moins de 2 minutes' : ''}`}
    >
      <AlertCircle className={`w-5 h-5 ${isWarning ? 'text-red-600' : 'text-amber-600'}`} aria-hidden="true" />
      <div>
        <p className="text-sm" aria-hidden="true">
          {isWarning ? 'Temps limité !' : 'Réservation en cours'}
        </p>
        <p className={isWarning ? 'text-red-700' : 'text-amber-700'} aria-hidden="true">
          {minutes}:{seconds.toString().padStart(2, '0')}
        </p>
      </div>
    </div>
  );
}
