/**
 * ContextualHelp - Système de bulles d'aide contextuelles
 * Guidage pour utilisateurs peu expérimentés
 * 
 * DEV NOTES:
 * - Tooltips avec explications simples
 * - Peut être désactivé par l'utilisateur
 * - Stockage préférence dans localStorage
 */

import { useState, useEffect } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { Button } from './ui/button';

interface HelpTip {
  id: string;
  title: string;
  message: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface ContextualHelpProps {
  tips: HelpTip[];
  storageKey?: string;
  onComplete?: () => void;
  forceShow?: boolean;  // Added: force show regardless of localStorage
}

export function ContextualHelp({ tips, storageKey = 'help-dismissed', onComplete, forceShow = false }: ContextualHelpProps) {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(forceShow);

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà vu les conseils
    if (forceShow) {
      // Si forceShow, afficher directement
      setIsVisible(true);
      return;
    }
    
    const dismissed = localStorage.getItem(storageKey);
    if (!dismissed && tips.length > 0) {
      // Délai avant l'affichage pour ne pas surcharger
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, [storageKey, tips.length, forceShow]);

  const handleNext = () => {
    if (currentTipIndex < tips.length - 1) {
      setCurrentTipIndex(currentTipIndex + 1);
    } else {
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(storageKey, 'true');
    setIsVisible(false);
    onComplete?.();
  };

  if (!isVisible || tips.length === 0) return null;

  const currentTip = tips[currentTipIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <HelpCircle className="w-7 h-7 text-green-600" />
        </div>

        {/* Content */}
        <div className="mb-6">
          <h3 className="text-xl text-gray-900 mb-2">{currentTip.title}</h3>
          <p className="text-base text-gray-600 leading-relaxed">{currentTip.message}</p>
        </div>

        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {tips.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentTipIndex
                  ? 'w-8 bg-green-600'
                  : 'w-2 bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={handleDismiss}
            variant="outline"
            className="flex-1"
          >
            Passer
          </Button>
          <Button
            onClick={handleNext}
            className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
          >
            {currentTipIndex < tips.length - 1 ? 'Suivant' : 'Compris !'}
          </Button>
        </div>

        {/* Counter */}
        <p className="text-xs text-gray-400 text-center mt-4">
          Conseil {currentTipIndex + 1} sur {tips.length}
        </p>
      </div>
    </div>
  );
}

/**
 * HelpButton - Bouton pour réafficher l'aide
 */
interface HelpButtonProps {
  onClick: () => void;
  label?: string;
}

export function HelpButton({ onClick, label = "Besoin d'aide ?" }: HelpButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full hover:bg-green-100 transition-colors text-sm border border-green-200"
    >
      <HelpCircle className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}
