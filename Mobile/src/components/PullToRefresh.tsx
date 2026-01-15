/**
 * PullToRefresh - Composant pull-to-refresh pour rafraîchir les listes
 */

import { ReactNode, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { feedback } from '../lib/interactions';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
}

export function PullToRefresh({ children, onRefresh }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const startYRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const threshold = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    // Commencer seulement si on est en haut de la page
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      startYRef.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startYRef.current);
    
    // Effet d'élastique
    const dampedDistance = Math.min(distance * 0.5, threshold * 1.5);
    setPullDistance(dampedDistance);

    if (dampedDistance >= threshold) {
      feedback.tap();
    }
  };

  const handleTouchEnd = async () => {
    setIsPulling(false);

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      feedback.click();
      
      try {
        await onRefresh();
        feedback.success();
      } catch (error) {
        feedback.error();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  const rotation = Math.min((pullDistance / threshold) * 360, 360);

  return (
    <div className="relative overflow-hidden h-full">
      {/* Indicateur de pull */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200"
        style={{
          height: `${Math.min(pullDistance, threshold)}px`,
          opacity: pullDistance > 0 ? 1 : 0
        }}
      >
        <div
          className={`flex items-center justify-center w-10 h-10 rounded-full ${
            pullDistance >= threshold ? 'bg-green-500' : 'bg-gray-300'
          } transition-colors`}
          style={{
            transform: `rotate(${rotation}deg)`
          }}
        >
          <RefreshCw className={`w-5 h-5 text-white ${isRefreshing ? 'animate-spin' : ''}`} />
        </div>
      </div>

      {/* Contenu */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="h-full overflow-y-auto"
        style={{
          transform: `translateY(${isRefreshing ? threshold : pullDistance}px)`,
          transition: isPulling ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        {children}
      </div>
    </div>
  );
}
