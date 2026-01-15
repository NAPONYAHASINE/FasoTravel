import type { Page } from '../App';
/**
 * SearchResultsPage - Résultats de recherche
 * 
 * DEV NOTES:
 * - Endpoint: GET /trips?from=&to=&date=
 * - Affiche filtres persistants (prix, horaire, opérateur)
 * - Pour aller-retour: 2 sections (Aller + Retour)
 * - Event: search_result_viewed, filter_applied, trip_selected
 */

import { useState, useEffect } from 'react';
import { ArrowLeft, Filter, SlidersHorizontal, Loader2 } from 'lucide-react';
import { TripCard } from '../components/TripCard';
import { Trip } from '../data/models';
import { SearchParams } from './HomePage';
import { Button } from '../components/ui/button';
import { BookingStepIndicator } from '../components/BookingStepIndicator';
import { AnimatedList, AnimatedListItem } from '../components/AnimatedCard';
import { EmptyState } from '../components/LoadingStates';
import { Frown } from 'lucide-react';
import { motion } from 'motion/react';
import { feedback } from '../lib/interactions';
import { useTrips } from '../lib/hooks';

interface SearchResultsPageProps {
  searchParams: SearchParams & {
    isReturnSelection?: boolean;
    filterOperator?: string;
    outboundTripData?: any;
  };
  onNavigate: (page: Page, tripId?: any) => void;
  onBack: () => void;
}

export function SearchResultsPage({ searchParams, onNavigate, onBack }: SearchResultsPageProps) {
  const [sortBy, setSortBy] = useState<'price' | 'time' | 'duration'>('time');
  const [showFilters, setShowFilters] = useState(false);
  
  const isReturnSelection = searchParams.isReturnSelection || false;
  const filterOperator = searchParams.filterOperator;
  const outboundTripData = searchParams.outboundTripData;
  
  // Use API hook for trips
  const { trips, isLoading, error } = useTrips({
    from_stop_id: searchParams.from,
    to_stop_id: searchParams.to,
    date: searchParams.date
  });

  // Filter by operator if filterOperator is specified
  // This applies to both: return selection (same operator) AND operator detail page search
  const filteredTrips = filterOperator
    ? trips.filter(trip => trip.operator_name === filterOperator)
    : trips;

  // Sort trips
  const sortedTrips = [...filteredTrips].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.base_price - b.base_price;
      case 'time':
        return new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime();
      case 'duration':
        return a.duration_minutes - b.duration_minutes;
      default:
        return 0;
    }
  });

  const handleTripSelect = (tripId: string) => {
    console.log('Selected trip:', tripId);
    feedback.success();
    
    if (isReturnSelection && outboundTripData) {
      // On navigue vers seat selection du trajet retour avec les données du trajet aller
      onNavigate('seat-selection', {
        tripId,
        passengers: searchParams.passengers,
        isRoundTrip: true,
        outboundTripData
      });
    } else {
      // Navigation normale vers trip detail
      onNavigate('trip-detail', tripId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Step Indicator */}
      {isReturnSelection ? (
        <BookingStepIndicator currentStep="return-seat" completedSteps={['outbound-seat']} isRoundTrip={true} />
      ) : (
        <BookingStepIndicator currentStep="search" />
      )}

      {/* Header */}
      <motion.div 
        className="bg-gradient-to-r from-red-600 via-amber-500 to-green-600 px-6 py-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="max-w-4xl mx-auto">
          <motion.button
            onClick={() => {
              feedback.tap();
              onBack();
            }}
            className="text-white mb-4 flex items-center gap-2 min-h-[44px] -ml-2 px-2"
            whileHover={{ x: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-base">Retour</span>
          </motion.button>
          
          <motion.div 
            className="text-white mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {isReturnSelection && (
              <div className="flex gap-2 mb-2">
                <span className="px-3 py-1 rounded-full text-xs bg-white/20">Aller ✓</span>
                <span className="px-3 py-1 rounded-full text-xs bg-white text-amber-600">Retour</span>
              </div>
            )}
            <h1 className="text-2xl mb-1">
              {isReturnSelection ? 'Sélectionnez votre trajet Retour' : 'Trajets disponibles'}
            </h1>
            <p className="text-sm opacity-90">
              {searchParams.from} → {searchParams.to}
              {searchParams.date && ` • ${new Date(searchParams.date).toLocaleDateString('fr-FR')}`}
            </p>
            {filterOperator && (
              <p className="text-xs opacity-75 mt-1">
                🚌 Compagnie : {filterOperator} uniquement
              </p>
            )}
          </motion.div>

          {/* Filters Bar */}
          <motion.div 
            className="flex items-center gap-2 overflow-x-auto pb-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  feedback.tap();
                  setShowFilters(!showFilters);
                }}
                className="bg-white/20 border-white/40 text-white hover:bg-white/30"
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filtres
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  feedback.tap();
                  setSortBy('price');
                }}
                className={`${
                  sortBy === 'price' 
                    ? 'bg-white text-red-600' 
                    : 'bg-white/20 border-white/40 text-white hover:bg-white/30'
                }`}
              >
                Prix
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  feedback.tap();
                  setSortBy('time');
                }}
                className={`${
                  sortBy === 'time' 
                    ? 'bg-white text-amber-600' 
                    : 'bg-white/20 border-white/40 text-white hover:bg-white/30'
                }`}
              >
                Horaire
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  feedback.tap();
                  setSortBy('duration');
                }}
                className={`${
                  sortBy === 'duration' 
                    ? 'bg-white text-green-600' 
                    : 'bg-white/20 border-white/40 text-white hover:bg-white/30'
                }`}
              >
                Durée
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Results */}
      <motion.div 
        className="px-6 py-6 pb-24"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="max-w-4xl mx-auto">
          {/* Results Count */}
          <motion.div 
            className="mb-4 flex items-center gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-2 bg-gradient-to-r from-red-50 via-amber-50 to-green-50 dark:from-red-900/20 dark:via-amber-900/20 dark:to-green-900/20 border border-amber-200 dark:border-amber-700 rounded-full px-4 py-2">
              <span className="text-amber-600 dark:text-amber-400">🚌</span>
              <p className="text-gray-900 dark:text-white">
                {sortedTrips.length} {sortedTrips.length > 1 ? 'trajets trouvés' : 'trajet trouvé'}
              </p>
            </div>
            {filterOperator && (
              <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-full px-4 py-2">
                <span className="text-green-700 dark:text-green-400">✓</span>
                <p className="text-green-900 dark:text-green-200 text-sm">
                  {filterOperator}
                </p>
              </div>
            )}
          </motion.div>

          {/* Loading State */}
          {isLoading && (
            <motion.div
              className="flex items-center justify-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Loader2 className="w-8 h-8 text-green-600 dark:text-green-400 animate-spin" />
            </motion.div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <EmptyState
                icon={<Frown className="w-12 h-12" />}
                title="Erreur de chargement"
                message={error}
                action={{
                  label: "Réessayer",
                  onClick: onBack
                }}
              />
            </motion.div>
          )}

          {/* Trips List */}
          {!isLoading && !error && sortedTrips.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <EmptyState
                icon={<Frown className="w-12 h-12" />}
                title="Aucun trajet disponible"
                message="Essayez une autre date ou une autre destination"
                action={{
                  label: "Nouvelle recherche",
                  onClick: onBack
                }}
              />
            </motion.div>
          )}
          
          {!isLoading && !error && sortedTrips.length > 0 && (
            <AnimatedList className="space-y-4">
              {sortedTrips.map((trip, index) => (
                <AnimatedListItem key={trip.trip_id} delay={0.5 + index * 0.1}>
                  <TripCard
                    trip={trip}
                    onSelect={handleTripSelect}
                  />
                </AnimatedListItem>
              ))}
            </AnimatedList>
          )}

          {/* Round Trip Section */}
          {searchParams.type === 'ALLER_RETOUR' && sortedTrips.length > 0 && (
            <motion.div 
              className="mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + sortedTrips.length * 0.1 }}
            >
              <div className="bg-gradient-to-r from-red-50 via-amber-50 to-green-50 dark:from-red-900/20 dark:via-amber-900/20 dark:to-green-900/20 border-2 border-amber-200 dark:border-amber-700 rounded-xl p-4 mb-4">
                <h2 className="text-lg text-gray-900 dark:text-white mb-2">Trajet retour</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Sélectionnez d'abord votre trajet aller, puis vous pourrez choisir votre retour
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
