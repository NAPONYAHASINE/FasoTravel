/**
 * AnimatedCard - Carte avec animations 3D et effets de survol
 * 
 * PERFORMANCE:
 * - Optimisé avec React.memo pour éviter re-renders
 * - Utilise useMotionValue pour des animations fluides sans re-render
 */

import { motion, useMotionValue, useTransform } from 'motion/react';
import { ReactNode, memo } from 'react';

interface AnimatedCardProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  delay?: number;
  hover3d?: boolean;
  glowOnHover?: boolean;
  role?: string;
  'aria-label'?: string;
  tabIndex?: number;
}

const AnimatedCardComponent = ({ 
  children, 
  onClick, 
  className = '',
  delay = 0,
  hover3d = true,
  glowOnHover = false,
  role,
  'aria-label': ariaLabel,
  tabIndex
}: AnimatedCardProps) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const rotateX = useTransform(y, [-100, 100], [10, -10]);
  const rotateY = useTransform(x, [-100, 100], [-10, 10]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hover3d) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) / 5);
    y.set((e.clientY - centerY) / 5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`bg-white rounded-2xl shadow-sm overflow-hidden ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={hover3d ? {
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        transformPerspective: 1000
      } : {}}
      role={role}
      aria-label={ariaLabel}
      tabIndex={tabIndex}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay,
        type: "spring",
        stiffness: 100,
        damping: 15
      }}
      whileHover={onClick ? { 
        scale: 1.02,
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        transition: { type: "spring", stiffness: 400, damping: 20 }
      } : {}}
      whileTap={onClick ? { 
        scale: 0.98,
        transition: { type: "spring", stiffness: 400, damping: 20 }
      } : {}}
    >
      {/* Glow effect on hover */}
      {glowOnHover && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-yellow-500/20 blur-xl" />
        </motion.div>
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

// Export avec React.memo pour éviter re-renders inutiles
export const AnimatedCard = memo(AnimatedCardComponent);

/**
 * Animated List Container - Pour les listes avec stagger
 */
export function AnimatedList({ children, className = '' }: { children: ReactNode, className?: string }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.1
          }
        }
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Animated List Item
 */
export function AnimatedListItem({ children, delay = 0 }: { children: ReactNode, delay?: number }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, x: -20 },
        visible: { 
          opacity: 1, 
          x: 0,
          transition: {
            type: "spring",
            stiffness: 100,
            damping: 12,
            delay
          }
        }
      }}
    >
      {children}
    </motion.div>
  );
}
