import type { Page } from '../App';
/**
 * OperatorDetailPage - Détails d'une compagnie de transport
 * 
 * DEV NOTES:
 * - Endpoint: GET /operators/:id
 * - Event: operator_book_clicked
 * - Montre les politiques, services, horaires, etc.
 */

import { useState } from 'react';
import { 
  ArrowLeft, Star, MapPin, Wifi, Coffee, Usb, 
  Droplet, CheckCircle2, XCircle, Clock, Phone, 
  Mail, Shield, Calendar, Search, Users, Loader2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { useOperatorById, useStations, useOperatorStories } from '../lib/hooks';
import { feedback } from '../lib/interactions';
import { OperatorStoriesViewer } from '../components/OperatorStoriesViewer';
import { OperatorLogo } from '../components/OperatorLogo';
import { markStoryAsViewed } from '../lib/api';

interface OperatorDetailPageProps {
  operatorId: string;
  onNavigate: (page: Page, data?: any) => void;
  onBack?: () => void;
}

export function OperatorDetailPage({ operatorId, onNavigate, onBack }: OperatorDetailPageProps) {
  const { operator, isLoading: operatorLoading, error: operatorError } = useOperatorById(operatorId);
  const { stations, isLoading: stationsLoading } = useStations();
  const [tripType, setTripType] = useState<'ALLER_SIMPLE' | 'ALLER_RETOUR'>('ALLER_SIMPLE');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [storiesOpen, setStoriesOpen] = useState(false);
  
  const { stories, refetch: refetchStories } = useOperatorStories(operatorId);

  const handleLogoClick = () => {
    if (stories.length > 0) {
      feedback.tap();
      setStoriesOpen(true);
    }
  };

  const handleCloseStories = () => {
    setStoriesOpen(false);
  };

  const handleStoryView = async (storyId: string) => {
    try {
      await markStoryAsViewed(operatorId, storyId);
      refetchStories();
    } catch (error) {
      console.error('Failed to mark story as viewed:', error);
    }
  };

  // Loading state
  if (operatorLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-600 dark:text-green-400 animate-spin" />
      </div>
    );
  }

  // Error or not found
  if (operatorError || !operator) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">
          {operatorError || 'Compagnie introuvable'}
        </p>
      </div>
    );
  }

  // Amenities display mapping
  const amenityIconMap: Record<string, any> = {
    'WiFi': Wifi,
    'AC': Droplet,
    'USB': Usb,
    'Toilet': Droplet,
    'Snacks': Coffee,
  };

  const operatorAmenities = (operator.amenities || []).map((amenity: string) => ({
    icon: amenityIconMap[amenity] || Coffee,
    label: amenity,
    available: true
  }));

  // Trouver les gares affiliées à cet opérateur (si présentes dans la liste `stations`)
  // Filtre prudent: certains champs de `stations` sont présents uniquement dans les mocks,
  // on utilise des casts `any` pour ne pas casser le typage `api.Station`.
  const operatorStations = (stations || []).filter(s => (s as any).operator_id === operator.operator_id);
  const primaryStation = operatorStations.length > 0 ? operatorStations[0] : null;
  const scheduleText = operator.opening_hours || (primaryStation ? (primaryStation as any).opening_hours : undefined) || 'Horaires non précisés';
  const locationText = operator.primary_station_name
    ? `${operator.primary_station_name}${operator.primary_station_city ? ', ' + operator.primary_station_city : ''}`
    : primaryStation
      ? `${primaryStation.name}${primaryStation.city ? ', ' + primaryStation.city : ''}`
      : 'Lieu non précisé';

  // Affiche les politiques fournies par l'opérateur si disponibles.
  // Si l'opérateur n'a pas renseigné de policies, on affiche des libellés génériques.
  const mapPolicyTypeToIcon = (type?: string) => {
    switch (type) {
      case 'CANCELLATION':
      case 'Annulation':
        return CheckCircle2;
      case 'TRANSFER':
      case 'Transfert':
        return CheckCircle2;
      case 'BAGGAGE':
      case 'Bagages':
        return Droplet;
      case 'DELAY':
      case 'Retard':
        return Shield;
      default:
        return CheckCircle2;
    }
  };

  const policies = Array.isArray(operator.policies) && operator.policies.length > 0
    ? operator.policies.map((p) => ({
        title: p.title || 'Politique',
        description: p.description || "Non précisée par l'opérateur.",
        icon: mapPolicyTypeToIcon(p.type),
        type: 'info'
      }))
    : [
        { title: 'Annulation', description: "Non précisée par l'opérateur.", icon: CheckCircle2, type: 'success' },
        { title: 'Transfert', description: "Non précisée par l'opérateur.", icon: CheckCircle2, type: 'success' },
        { title: 'Bagages', description: "Non précisée par l'opérateur.", icon: CheckCircle2, type: 'success' },
        { title: 'Retard', description: "Non précisée par l'opérateur.", icon: Shield, type: 'success' },
      ];

  const handleSearch = () => {
    if (!from || !to) {
      feedback.error();
      alert('Veuillez sélectionner une ville de départ et d\'arrivée');
      return;
    }

    feedback.success();
    onNavigate('search-results', {
      from,
      to,
      date: date || undefined,
      type: tripType,
      returnDate: tripType === 'ALLER_RETOUR' ? returnDate : undefined,
      filterOperator: operator.name, // Passer le nom au lieu de l'ID pour le filtrage
      passengers
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 via-amber-500 to-green-600 text-white px-4 sm:px-6 pt-6 pb-24 sm:pb-32 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={onBack}
            type="button"
            title="Retour"
            className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Company Header */}
          <div className="flex items-start gap-4">
            {/* Logo with Stories Circle */}
            <div
              onClick={handleLogoClick}
              className={`relative transition-transform ${
                stories.length > 0 
                  ? 'cursor-pointer hover:scale-110' 
                  : 'cursor-default'
              }`}
            >
              {/* Gradient Ring (if has unread stories) */}
              {operator.has_unread_stories && operator.stories_count && operator.stories_count > 0 && (
                <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-red-600 via-amber-500 to-green-600 animate-pulse" />
              )}
              
              {/* Gray Ring (if has only read stories) */}
              {!operator.has_unread_stories && operator.stories_count && operator.stories_count > 0 && (
                <div className="absolute -inset-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
              )}
              
              {/* Logo Container */}
              <OperatorLogo
                logo={operator.operator_logo}
                logoUrl={operator.logo_url}
                name={operator.name}
                size="lg"
                showBorder
                borderStyle="light"
              />

              {/* Stories Count Badge */}
              {operator.stories_count && operator.stories_count > 0 && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs border-2 border-white shadow-lg">
                  {operator.stories_count}
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl mb-2">{operator.name}</h1>
              <div className="flex items-center gap-3 text-sm opacity-90">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>{operator.rating}</span>
                </div>
                <span>•</span>
                <span>{operator.total_trips} trajets disponibles</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Search Card */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-20 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 sm:p-6">
          <h2 className="text-lg mb-4 text-gray-900 dark:text-white">
            Réserver avec {operator.name}
          </h2>

          {/* Trip Type */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => {
                feedback.tap();
                setTripType('ALLER_SIMPLE');
              }}
              className={`flex-1 py-2 px-3 rounded-lg transition-all text-sm ${
                tripType === 'ALLER_SIMPLE'
                  ? 'bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-lg'
                  : 'bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-red-300 dark:hover:border-red-600'
              }`}
            >
              Aller simple
            </button>
            <button
              onClick={() => {
                feedback.tap();
                setTripType('ALLER_RETOUR');
              }}
              className={`flex-1 py-2 px-3 rounded-lg transition-all text-sm ${
                tripType === 'ALLER_RETOUR'
                  ? 'bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-lg'
                  : 'bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-red-300 dark:hover:border-red-600'
              }`}
            >
              Aller-retour
            </button>
          </div>

          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1.5">Départ</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                <select
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:border-amber-300 dark:hover:border-amber-600 focus:border-amber-500 dark:focus:border-amber-500 focus:outline-none transition-colors"
                  disabled={stationsLoading}
                  title="Sélectionnez la ville de départ"
                  aria-label="Ville de départ"
                >
                  <option value="">{stationsLoading ? 'Chargement...' : 'Ville de départ'}</option>
                  {stations.map((station) => (
                    <option key={station.id} value={station.id}>
                      {station.city}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1.5">Arrivée</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                <select
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:border-green-300 dark:hover:border-green-600 focus:border-green-500 dark:focus:border-green-500 focus:outline-none transition-colors"
                  disabled={stationsLoading}
                  title="Sélectionnez la ville d'arrivée"
                  aria-label="Ville d'arrivée"
                >
                  <option value="">{stationsLoading ? 'Chargement...' : "Ville d'arrivée"}</option>
                  {stations.map((station) => (
                    <option key={station.id} value={station.id}>
                      {station.city}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1.5">Date (optionnelle)</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:border-red-300 dark:hover:border-red-600 focus:border-red-500 dark:focus:border-red-500 focus:outline-none transition-colors"
                  title="Sélectionnez la date de départ"
                  placeholder="Date de départ"
                />
              </div>
            </div>

            {tripType === 'ALLER_RETOUR' && (
              <div>
                <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1.5">Date retour (optionnelle)</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:border-red-300 dark:hover:border-red-600 focus:border-red-500 dark:focus:border-red-500 focus:outline-none transition-colors"
                    title="Sélectionnez la date de retour"
                    placeholder="Date de retour"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1.5">Nombre de passagers</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                <select
                  value={passengers}
                  onChange={(e) => setPassengers(Number(e.target.value))}
                  className="w-full pl-10 pr-3 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:border-green-300 dark:hover:border-green-600 focus:border-green-500 dark:focus:border-green-500 focus:outline-none transition-colors"
                  title="Sélectionnez le nombre de passagers"
                  aria-label="Nombre de passagers"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                    <option key={num} value={num}>{num} {num === 1 ? 'passager' : 'passagers'}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <Button
            onClick={handleSearch}
            className="w-full bg-gradient-to-r from-red-600 via-amber-500 to-green-600 hover:from-red-700 hover:via-amber-600 hover:to-green-700 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <Search className="w-4 h-4 mr-2" />
            Rechercher avec {operator.name}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Description */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg text-gray-900 dark:text-white mb-3">À propos</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            {operator.description || `${operator.name} est l'une des principales compagnies de transport au Burkina Faso.`}
          </p>
        </div>

        {/* Amenities */}
        {operatorAmenities.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-lg text-gray-900 dark:text-white mb-4">Services et équipements</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {operatorAmenities.map((amenity: { icon: any; label: string; available: boolean }, index: number) => {
                const Icon = amenity.icon;
                return (
                  <div key={index} className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-2">
                      <Icon className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-xs text-gray-700 dark:text-gray-300">{amenity.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Policies */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg text-gray-900 dark:text-white mb-4">Politiques et conditions</h2>
          <div className="space-y-3">
            {policies.map((policy, index) => {
              const Icon = policy.icon;
              return (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <Icon className={`w-5 h-5 flex-shrink-0 ${
                    policy.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'
                  }`} />
                  <div>
                    <p className="text-sm text-gray-900 dark:text-white">{policy.title}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{policy.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-gradient-to-r from-green-50 to-amber-50 dark:from-green-900/20 dark:to-amber-900/20 border border-green-200 dark:border-green-700 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm text-gray-900 dark:text-white mb-1">Horaires</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">{scheduleText}</p>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg text-gray-900 dark:text-white mb-4">Contact</h2>
          <div className="space-y-3">
            {operator.phone_number && (
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
                <a href={`tel:${operator.phone_number}`} className="text-sm text-gray-900 dark:text-white hover:text-green-600 dark:hover:text-green-400 transition-colors">
                  {operator.phone_number}
                </a>
              </div>
            )}
            {operator.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-green-600 dark:text-green-400" />
                <a href={`mailto:${operator.email}`} className="text-sm text-gray-900 dark:text-white hover:text-green-600 dark:hover:text-green-400 transition-colors">
                  {operator.email}
                </a>
              </div>
            )}
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-sm text-gray-900 dark:text-white">{locationText}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stories Viewer Modal */}
      {storiesOpen && operator && stories.length > 0 && (
        <OperatorStoriesViewer
          operatorId={operator.operator_id}
          operatorName={operator.name}
          operatorLogo={operator.operator_logo}
          stories={stories}
          onClose={handleCloseStories}
          onStoryView={handleStoryView}
        />
      )}
    </div>
  );
}
