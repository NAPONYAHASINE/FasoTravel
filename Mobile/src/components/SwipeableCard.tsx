/**
 * SwipeableCard - Carte avec actions swipe (supprimer, archiver, etc.)
 * Améliore l'interaction mobile
 */

import { ReactNode, useRef, useState } from 'react';
import { Trash2, Archive, Share2 } from 'lucide-react';
import { feedback } from '../lib/interactions';

interface SwipeAction {
  icon: ReactNode;
  label: string;
  color: string;
  onAction: () => void;
}

interface SwipeableCardProps {
  children: ReactNode;
  onDelete?: () => void;
  onArchive?: () => void;
  onShare?: () => void;
  customActions?: SwipeAction[];
}

export function SwipeableCard({ 
  children, 
  onDelete, 
  onArchive, 
  onShare,
  customActions 
}: SwipeableCardProps) {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);

  const actions: SwipeAction[] = customActions || [
    ...(onDelete ? [{
      icon: <Trash2 className="w-5 h-5" />,
      label: 'Supprimer',
      color: 'bg-red-500',
      onAction: onDelete
    }] : []),
    ...(onArchive ? [{
      icon: <Archive className="w-5 h-5" />,
      label: 'Archiver',
      color: 'bg-yellow-500',
      onAction: onArchive
    }] : []),
    ...(onShare ? [{
      icon: <Share2 className="w-5 h-5" />,
      label: 'Partager',
      color: 'bg-blue-500',
      onAction: onShare
    }] : [])
  ];

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    setIsDragging(true);
    feedback.tap();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    currentXRef.current = e.touches[0].clientX;
    const diff = currentXRef.current - startXRef.current;
    
    // Limiter le swipe à gauche seulement
    if (diff < 0) {
      setOffsetX(Math.max(diff, -150));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);

    // Si swipe > 100px, exécuter l'action
    if (offsetX < -100 && actions.length > 0) {
      feedback.click();
      actions[0].onAction();
      setOffsetX(0);
    } else {
      // Sinon, revenir à la position initiale
      setOffsetX(0);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Actions en arrière-plan */}
      <div className="absolute inset-0 flex items-center justify-end">
        {actions.map((action, index) => (
          <div
            key={index}
            className={`${action.color} h-full flex items-center justify-center px-6 text-white`}
            style={{ width: '150px' }}
          >
            <div className="flex flex-col items-center gap-1">
              {action.icon}
              <span className="text-xs">{action.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Carte principale */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out'
        }}
        className="bg-white relative z-10"
      >
        {children}
      </div>
    </div>
  );
}
