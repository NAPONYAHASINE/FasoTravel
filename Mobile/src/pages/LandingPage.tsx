import { useEffect } from 'react';
import { motion } from 'motion/react';
import type { Page } from '../App';
import brandLogo from '../assets/brand/logo.png';

interface LandingPageProps {
  onNavigate: (page: Page) => void;
  darkMode?: boolean;
  isLoggedIn?: boolean;
}

export function LandingPage({ darkMode = false, onNavigate, isLoggedIn }: LandingPageProps) {
  useEffect(() => {
    // Auto-navigate after 2.5 seconds
    // If already logged in, go to home; otherwise go to auth
    const timer = setTimeout(() => {
      onNavigate(isLoggedIn ? 'home' : 'auth');
    }, 2500);

    return () => clearTimeout(timer);
  }, [onNavigate, isLoggedIn]);
  
  return (
    <motion.div
      initial={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
      className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        darkMode ? 'bg-gray-900' : 'bg-white'
      }`}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center gap-8"
      >
        {/* Animated Logo */}
        <motion.div
          animate={{
            scale: [1, 1.08, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="w-48 h-48 flex items-center justify-center"
        >
          <img
            src={brandLogo}
            alt="FasoTravel"
            className="w-full h-full object-contain"
          />
        </motion.div>

        {/* Animated Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className={`text-xl font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
        >
          Voyagez en toute sérénité
        </motion.p>
      </motion.div>
    </motion.div>
  );
}


