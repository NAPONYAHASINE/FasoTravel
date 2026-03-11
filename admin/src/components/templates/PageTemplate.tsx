import React from 'react';
import { LucideIcon } from 'lucide-react';
import { PAGE_CLASSES, GRADIENTS } from '../../lib/design-system';

interface PageHeaderAction {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

interface PageTemplateProps {
  // Header
  title: string;
  subtitle?: string;
  actions?: PageHeaderAction[];
  
  // Stats (optionnel)
  stats?: React.ReactNode;
  
  // Search/Filters (optionnel)
  searchBar?: React.ReactNode;
  filters?: React.ReactNode;
  
  // Content principal
  children: React.ReactNode;
  
  // Layout
  maxWidth?: 'full' | '7xl' | '6xl' | '5xl';
}

/**
 * Template standardisé pour toutes les pages de l'admin
 * Garantit une cohérence parfaite
 */
export function PageTemplate({
  title,
  subtitle,
  actions = [],
  stats,
  searchBar,
  filters,
  children,
  maxWidth = '7xl',
}: PageTemplateProps) {
  const maxWidthClass = {
    full: '',
    '7xl': 'max-w-screen-2xl',
    '6xl': 'max-w-screen-xl',
    '5xl': 'max-w-screen-lg',
  }[maxWidth];

  return (
    <div className={`${PAGE_CLASSES.container} dark:bg-gray-900 transition-colors`}>
      <div className={`${PAGE_CLASSES.content} ${maxWidthClass}`}>
        
        {/* Header */}
        <div className={PAGE_CLASSES.header}>
          <div className={PAGE_CLASSES.headerContent}>
            {/* Textes */}
            <div className={PAGE_CLASSES.headerTexts}>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {title}
              </h1>
              {subtitle && (
                <p className="text-base text-gray-600 dark:text-gray-400">
                  {subtitle}
                </p>
              )}
            </div>
            
            {/* Actions */}
            {actions.length > 0 && (
              <div className={PAGE_CLASSES.headerActions}>
                {actions.map((action) => {
                  const Icon = action.icon;
                  const isPrimary = action.variant !== 'secondary';
                  
                  return (
                    <button
                      key={action.label}
                      onClick={action.onClick}
                      className={`
                        inline-flex items-center gap-2 px-6 py-3 font-medium rounded-lg
                        shadow-lg hover:shadow-xl transition-all duration-200
                        focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 focus:ring-red-500
                        ${isPrimary ? 'text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}
                      `}
                      style={isPrimary ? { background: GRADIENTS.burkinabe } : undefined}
                    >
                      {Icon && <Icon size={20} />}
                      {action.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="mb-8">
            {stats}
          </div>
        )}

        {/* Search & Filters */}
        {(searchBar || filters) && (
          <div className="mb-6 space-y-4">
            {searchBar && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700 transition-colors">
                {searchBar}
              </div>
            )}
            {filters && (
              <div className="flex items-center gap-3 flex-wrap">
                {filters}
              </div>
            )}
          </div>
        )}

        {/* Main Content */}
        <div>
          {children}
        </div>
      </div>
    </div>
  );
}