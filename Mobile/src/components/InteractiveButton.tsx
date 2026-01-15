/**
 * InteractiveButton - Bouton avec feedback riche
 * Sons, vibrations, animations
 */

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { feedback } from '../lib/interactions';
import { Button } from './ui/button';

interface InteractiveButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  feedbackType?: 'tap' | 'click' | 'success' | 'none';
  ripple?: boolean;
  className?: string;
}

export function InteractiveButton({ 
  children, 
  onClick, 
  feedbackType = 'tap',
  ripple = true,
  className = '',
  ...props 
}: InteractiveButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Feedback haptique et sonore
    if (feedbackType !== 'none') {
      feedback[feedbackType]?.();
    }

    // Appeler le onClick original
    onClick?.(e);
  };

  return (
    <Button
      onClick={handleClick}
      className={`${ripple ? 'btn-ripple' : ''} active-scale transition-smooth ${className}`}
      {...props}
    >
      {children}
    </Button>
  );
}
