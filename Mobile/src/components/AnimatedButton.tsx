/**
 * AnimatedButton - Bouton ultra-dynamique avec animations fluides
 * Utilise Motion pour des interactions douces et engageantes
 * 
 * PERFORMANCE:
 * - Optimisé avec React.memo
 * - useMotionValue pour animations sans re-render
 */

import { motion, useMotionValue, useTransform } from 'motion/react';
import { ReactNode, ButtonHTMLAttributes, memo } from 'react';
import { feedback } from '../lib/interactions';

interface AnimatedButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  feedbackType?: 'tap' | 'click' | 'success' | 'none';
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  glow?: boolean;
  pulse?: boolean;
}

const AnimatedButtonComponent = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  feedbackType = 'tap',
  icon,
  iconPosition = 'left',
  glow = false,
  pulse = false,
  disabled,
  className = '',
  ...props
}: AnimatedButtonProps) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const rotateX = useTransform(y, [-100, 100], [5, -5]);
  const rotateY = useTransform(x, [-100, 100], [-5, 5]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    
    if (feedbackType !== 'none') {
      feedback[feedbackType]?.();
    }
    onClick?.(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(e.clientX - centerX);
    y.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const variantStyles = {
    primary: 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg hover:shadow-xl',
    secondary: 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg hover:shadow-xl',
    outline: 'border-2 border-green-600 text-green-600 hover:bg-green-50',
    ghost: 'text-green-600 hover:bg-green-50'
  };

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm min-h-[40px]',
    md: 'px-6 py-3 text-base min-h-[48px]',
    lg: 'px-8 py-4 text-lg min-h-[56px]'
  };

  return (
    <motion.button
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      disabled={disabled}
      className={`
        relative overflow-hidden rounded-xl font-medium
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d'
      }}
      whileHover={!disabled ? { 
        scale: 1.02,
        transition: { type: "spring", stiffness: 400, damping: 10 }
      } : {}}
      whileTap={!disabled ? { 
        scale: 0.98,
        transition: { type: "spring", stiffness: 400, damping: 10 }
      } : {}}
      animate={pulse && !disabled ? {
        scale: [1, 1.02, 1],
        transition: { 
          duration: 2, 
          repeat: Infinity,
          ease: "easeInOut"
        }
      } : {}}
      {...props}
    >
      {/* Glow effect */}
      {glow && !disabled && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-600 opacity-0"
          animate={{
            opacity: [0, 0.3, 0],
            scale: [0.8, 1.2, 0.8]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            filter: 'blur(20px)',
            zIndex: -1
          }}
        />
      )}

      {/* Ripple effect background */}
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 0, opacity: 0.5 }}
        whileTap={!disabled ? {
          scale: 2,
          opacity: 0,
          transition: { duration: 0.6 }
        } : {}}
        style={{
          background: 'radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 70%)',
          borderRadius: '50%'
        }}
      />

      {/* Content */}
      <span className="relative flex items-center justify-center gap-2 z-10">
        {icon && iconPosition === 'left' && (
          <motion.span
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
          >
            {icon}
          </motion.span>
        )}
        {children}
        {icon && iconPosition === 'right' && (
          <motion.span
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2 }}
          >
            {icon}
          </motion.span>
        )}
      </span>
    </motion.button>
  );
};

// Export avec React.memo pour performance
export const AnimatedButton = memo(AnimatedButtonComponent);
