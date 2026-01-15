/**
 * Navigation Component
 * Bottom Navigation (Mobile) avec design détaché et bouton central en cercle
 * Header moderne (Desktop)
 * 
 * DEV NOTES:
 * - Event: nav_item_clicked, nav_open_proches
 * - Bouton central GPS avec design circulaire détaché
 * - Design moderne avec fond blanc et accents colorés
 */

import { Home, MapPin, Ticket, User, Navigation as NavigationIcon, Headphones } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { feedback } from '../lib/interactions';
import type { Page } from '../App';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: Page) => void;
  userName?: string;
}

export function Navigation({ currentPage, onNavigate, userName }: NavigationProps) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems = [
    { id: 'home' as Page, label: 'Accueil', icon: Home, color: 'red' },
    { id: 'nearby' as Page, label: 'GPS', icon: NavigationIcon, color: 'green' },
    { id: 'tickets' as Page, label: 'Billets', icon: Ticket, color: 'amber', isCentral: true },
    { id: 'support' as Page, label: 'Support', icon: Headphones, color: 'amber' },
    { id: 'profile' as Page, label: 'Profil', icon: User, color: 'red' },
  ];

  // Mobile Bottom Navigation avec design moderne détaché
  if (isMobile) {
    return (
      <motion.nav 
        className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="max-w-md mx-auto bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border-2 border-gray-100 dark:border-gray-800 px-4 py-2.5 relative">
          {/* Items de navigation */}
          <div className="flex items-center justify-around relative">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              const isCentral = item.isCentral;
              
              // Bouton central Billets avec design circulaire détaché
              if (isCentral) {
                return (
                  <motion.button
                    key={item.id}
                    onClick={() => {
                      feedback.tap();
                      onNavigate(item.id);
                    }}
                    className={`absolute -top-9 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full shadow-2xl flex flex-col items-center justify-center transition-all ${
                      isActive 
                        ? 'bg-gradient-to-br from-amber-500 to-red-500 text-white scale-110' 
                        : 'bg-gradient-to-br from-amber-500 to-red-500 text-white hover:scale-105'
                    }`}
                    whileHover={{ scale: isActive ? 1.15 : 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label={item.label}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className="w-7 h-7" strokeWidth={2.5} />
                  </motion.button>
                );
              }
              
              // Autres items de navigation
              return (
                <motion.button
                  key={item.id}
                  onClick={() => {
                    feedback.tap();
                    onNavigate(item.id);
                  }}
                  className={`flex flex-col items-center gap-0.5 transition-all py-2 px-2 sm:px-3 rounded-xl ${
                    isActive 
                      ? item.color === 'red'
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 scale-105'
                        : item.color === 'green'
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 scale-105'
                        : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 scale-105'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon 
                    className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[2]'}`}
                  />
                  <span className={`text-[10px] sm:text-xs ${isActive ? 'font-medium' : ''}`}>
                    {item.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.nav>
    );
  }

  // Desktop Header moderne
  return (
    <motion.header 
      className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 shadow-sm"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => {
              feedback.tap();
              onNavigate('home');
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-xl font-bold text-gray-900 dark:text-white">FasoTravel</span>
          </motion.div>

          {/* Nav Items */}
          <nav className="flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              const isCentral = item.isCentral;
              
              return (
                <motion.button
                  key={item.id}
                  onClick={() => {
                    feedback.tap();
                    onNavigate(item.id);
                  }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all ${
                    isCentral
                      ? isActive
                        ? 'bg-gradient-to-r from-amber-500 to-red-500 text-white shadow-lg'
                        : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                      : isActive 
                        ? item.color === 'red'
                          ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-2 border-red-200 dark:border-red-800'
                          : item.color === 'green'
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-2 border-green-200 dark:border-green-800'
                          : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-2 border-amber-200 dark:border-amber-800'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                  <span className={`text-base ${isActive ? 'font-medium' : ''}`}>
                    {item.label}
                  </span>
                </motion.button>
              );
            })}
          </nav>

          {/* User */}
          {userName && (
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-amber-500 rounded-full flex items-center justify-center text-white border-2 border-white dark:border-gray-700 shadow-lg">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="text-gray-700 dark:text-gray-300">{userName}</span>
            </motion.div>
          )}
        </div>
      </div>
    </motion.header>
  );
}
