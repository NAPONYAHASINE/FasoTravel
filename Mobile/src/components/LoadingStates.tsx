/**
 * LoadingStates - Composants de chargement avec skeletons
 */

import { ReactNode } from 'react';

export function TripCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm animate-pulse" role="status" aria-label="Chargement des trajets en cours">
      <div className="flex items-center justify-between mb-3">
        <div className="h-6 w-32 skeleton"></div>
        <div className="h-8 w-20 skeleton rounded-full"></div>
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full skeleton"></div>
        <div className="h-4 w-3/4 skeleton"></div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="h-4 w-24 skeleton"></div>
        <div className="h-10 w-32 skeleton rounded-lg"></div>
      </div>
      <span className="sr-only">Chargement des informations du trajet...</span>
    </div>
  );
}

export function TicketCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 w-40 skeleton"></div>
        <div className="h-6 w-24 skeleton rounded-full"></div>
      </div>
      <div className="space-y-3">
        <div className="h-4 w-full skeleton"></div>
        <div className="h-4 w-2/3 skeleton"></div>
        <div className="h-4 w-1/2 skeleton"></div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="h-4 w-32 skeleton"></div>
          <div className="h-4 w-28 skeleton"></div>
        </div>
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <TripCardSkeleton key={i} />
      ))}
    </div>
  );
}

interface LoadingOverlayProps {
  message?: string;
  show: boolean;
}

export function LoadingOverlay({ message = 'Chargement...', show }: LoadingOverlayProps) {
  if (!show) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="loading-title"
      aria-describedby="loading-desc"
    >
      <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm w-full mx-4 animate-scale-in">
        <div className="flex flex-col items-center gap-4">
          <div className="relative" role="status" aria-label="Chargement en cours">
            <div className="w-16 h-16 border-4 border-green-200 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-green-600 rounded-full border-t-transparent absolute top-0 animate-spin"></div>
          </div>
          <p id="loading-title" className="text-lg text-gray-900">{message}</p>
          <p id="loading-desc" className="text-sm text-gray-500">Veuillez patienter...</p>
        </div>
      </div>
    </div>
  );
}

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-slide-in-bottom">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
        {icon}
      </div>
      <h3 className="text-xl text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all active-scale focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
          aria-label={action.label}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export function ProgressBar({ progress }: { progress: number }) {
  const normalizedProgress = Math.min(Math.max(progress, 0), 100);
  
  return (
    <div 
      className="w-full h-2 bg-gray-200 rounded-full overflow-hidden"
      role="progressbar"
      aria-valuenow={normalizedProgress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Progression: ${normalizedProgress}%`}
    >
      <div
        className="h-full bg-gradient-to-r from-green-600 to-green-500 transition-all duration-500 ease-out"
        style={{ width: `${normalizedProgress}%` }}
      />
    </div>
  );
}
