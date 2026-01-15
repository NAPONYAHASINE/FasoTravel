/**
 * OperatorLogo Component
 * Composant réutilisable pour afficher le logo d'un opérateur
 * Gère les emojis par défaut ET les images uploadées par l'opérateur
 * 
 * Logique:
 * 1. Si logo_url fourni ET qu'on peut le charger → affiche l'image
 * 2. Si pas d'URL ou erreur chargement → affiche l'emoji comme fallback
 * 3. Support du dark mode
 */

import React, { useState } from 'react';
import { cn } from './ui/utils';

interface OperatorLogoProps {
  /** Le logo (peut être une URL ou un emoji) */
  logo: string;
  /** URL optionnelle de l'image (depuis la config du compte opérateur) */
  logoUrl?: string;
  /** Nom de l'opérateur (pour l'alt text) */
  name?: string;
  /** Taille du logo: sm (8), md (14), lg (20) */
  size?: 'sm' | 'md' | 'lg';
  /** Classes CSS additionnelles */
  className?: string;
  /** Afficher un border autour */
  showBorder?: boolean;
  /** Style du border */
  borderStyle?: 'light' | 'dark' | 'colored';
}

/**
 * Affiche le logo d'un opérateur avec gestion intelligente des fallbacks
 * 
 * @example
 * // Avec emoji uniquement (situation actuelle)
 * <OperatorLogo 
 *   logo="✈️"
 *   name="Air Canada Bus"
 *   size="lg"
 *   showBorder
 * />
 * 
 * @example
 * // Avec image depuis config opérateur + fallback emoji
 * <OperatorLogo 
 *   logo="✈️"
 *   logoUrl="/uploads/operators/aircanda-logo.png"
 *   name="Air Canada Bus"
 *   size="lg"
 * />
 */
export function OperatorLogo({
  logo,
  logoUrl,
  name = 'Logo',
  size = 'md',
  className,
  showBorder = false,
  borderStyle = 'light'
}: OperatorLogoProps) {
  // État pour savoir si l'image a échoué à charger
  const [imageError, setImageError] = useState(false);

  // Déterminer si on doit afficher l'image
  const shouldShowImage = logoUrl && !imageError;

  // Mapper les tailles aux classes de texte
  const sizeClasses = {
    sm: 'text-sm w-8 h-8',
    md: 'text-2xl w-14 h-14',
    lg: 'text-4xl w-20 h-20'
  };

  // Mapper les styles de border
  const borderClasses = {
    light: 'border-white dark:border-gray-900',
    dark: 'border-gray-800 dark:border-white',
    colored: 'border-amber-400 dark:border-amber-600'
  };

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full overflow-hidden transition-transform',
        'bg-gradient-to-br from-red-100 via-amber-100 to-green-100',
        'dark:from-red-900/30 dark:via-amber-900/30 dark:to-green-900/30',
        sizeClasses[size],
        showBorder && `border-2 ${borderClasses[borderStyle]}`,
        className
      )}
    >
      {shouldShowImage ? (
        // 1️⃣ Afficher l'image uploadée par l'opérateur (si existe et charge correctement)
        <img
          src={logoUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => {
            // Si l'image ne charge pas, on passe en fallback emoji
            setImageError(true);
          }}
          title={`Logo de ${name}`}
        />
      ) : (
        // 2️⃣ Afficher l'emoji comme fallback (default ou après erreur image)
        <span
          className="flex items-center justify-center w-full h-full font-emoji"
          title={`Logo par défaut de ${name}`}
        >
          {logo}
        </span>
      )}
    </div>
  );
}
