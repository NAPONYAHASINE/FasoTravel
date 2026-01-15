/**
 * FloatingElements - Éléments flottants décoratifs pour rendre l'UI vivante
 */

import { motion } from 'motion/react';

export function FloatingBubbles() {
  const bubbles = Array.from({ length: 8 });
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {bubbles.map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-gradient-to-br from-green-400/20 to-yellow-400/20 backdrop-blur-sm"
          style={{
            width: Math.random() * 100 + 50,
            height: Math.random() * 100 + 50,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 2
          }}
        />
      ))}
    </div>
  );
}

export function FloatingIcon({ icon, delay = 0 }: { icon: React.ReactNode, delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: [0.5, 1, 0.5],
        y: [0, -10, 0],
        rotate: [0, 5, -5, 0]
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
        delay
      }}
    >
      {icon}
    </motion.div>
  );
}

export function PulsingDot({ color = 'green' }: { color?: string }) {
  return (
    <div className="relative inline-flex">
      <motion.div
        className={`w-3 h-3 bg-${color}-500 rounded-full`}
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className={`absolute inset-0 bg-${color}-500 rounded-full`}
        animate={{
          scale: [1, 2, 1],
          opacity: [0.5, 0, 0.5]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeOut"
        }}
      />
    </div>
  );
}

export function SuccessAnimation() {
  return (
    <motion.div
      className="relative w-32 h-32"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 15
      }}
    >
      {/* Circle */}
      <motion.div
        className="absolute inset-0 border-4 border-green-500 rounded-full"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
      
      {/* Checkmark */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
      >
        <motion.path
          d="M 25 50 L 40 65 L 75 30"
          fill="none"
          stroke="#22c55e"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.3, duration: 0.4, ease: "easeOut" }}
        />
      </svg>

      {/* Particles */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-green-500 rounded-full"
          style={{
            left: '50%',
            top: '50%'
          }}
          initial={{ 
            scale: 0,
            x: 0,
            y: 0
          }}
          animate={{
            scale: [0, 1, 0],
            x: Math.cos((i / 12) * Math.PI * 2) * 60,
            y: Math.sin((i / 12) * Math.PI * 2) * 60,
          }}
          transition={{
            delay: 0.6,
            duration: 0.8,
            ease: "easeOut"
          }}
        />
      ))}
    </motion.div>
  );
}

export function LoadingDots({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <div className="flex items-center gap-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={`${sizeClasses[size]} bg-green-600 rounded-full`}
          animate={{
            y: [-8, 8, -8],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.15
          }}
        />
      ))}
    </div>
  );
}

export function ShimmerEffect({ className = '' }: { className?: string }) {
  return (
    <motion.div
      className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent ${className}`}
      animate={{
        x: ['-100%', '200%']
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "linear",
        repeatDelay: 1
      }}
    />
  );
}
