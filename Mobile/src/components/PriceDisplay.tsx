/**
 * PriceDisplay - Affiche le prix avec support pour les promotions
 * 
 * USAGE:
 * <PriceDisplay 
 *   basePrice={8500}
 *   promotedPrice={6800}
 *   discountPercentage={20}
 *   showBadge={true}
 * />
 * 
 * AFFICHAGE:
 * - Sans promotion: "8 500 FCFA"
 * - Avec promotion: "8 500 FCFA" (barré) + "6 800 FCFA" + badge "-20%"
 */

interface PriceDisplayProps {
  basePrice: number;
  promotedPrice?: number; // If provided, shows strikethrough base price + new price
  discountPercentage?: number; // For badge display (e.g., -20%)
  currency?: string;
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean; // Show discount badge
  className?: string;
}

export function PriceDisplay({
  basePrice,
  promotedPrice,
  discountPercentage,
  currency = 'FCFA',
  size = 'md',
  showBadge = true,
  className = ''
}: PriceDisplayProps) {
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const badgeSizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-2.5 py-1'
  };

  const hasPromotion = promotedPrice && promotedPrice < basePrice;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {hasPromotion ? (
        <>
          {/* Base price with strikethrough */}
          <span className={`${sizeClasses[size]} line-through text-gray-400 dark:text-gray-500`}>
            {basePrice.toLocaleString()} {currency}
          </span>
          
          {/* Promoted price - highlighted */}
          <span className={`${sizeClasses[size]} font-bold text-green-600 dark:text-green-400`}>
            {promotedPrice.toLocaleString()} {currency}
          </span>
          
          {/* Discount badge */}
          {showBadge && discountPercentage && (
            <span className={`${badgeSizeClasses[size]} bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-full font-semibold`}>
              -{discountPercentage}%
            </span>
          )}
        </>
      ) : (
        /* No promotion - show single price */
        <span className={`${sizeClasses[size]} font-semibold text-gray-900 dark:text-white`}>
          {basePrice.toLocaleString()} {currency}
        </span>
      )}
    </div>
  );
}
