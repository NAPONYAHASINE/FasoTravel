/**
 * GeolocationPrompt Component
 * Composant réutilisable pour demander la permission de géolocalisation
 * Utilisé par NearbyPage et StationsNearbyPage
 * 
 * DEV NOTES:
 * - Affiche les boutons et messages appropriés selon l'état
 * - Gère les cas d'erreur et les fallbacks
 * - Design cohérent avec le système vert/or
 */

import { AlertCircle } from 'lucide-react';
import { Button } from './ui/button';

interface GeolocationPromptProps {
  isLoading: boolean;
  errorMessage: string | null;
  isGeolocationBlocked: boolean;
  hasPermission: boolean | null;
  onRequestPermission: () => void;
  onUseDefault: () => void;
  defaultLocationName?: string;
}

export function GeolocationPrompt({
  isLoading,
  errorMessage,
  isGeolocationBlocked,
  hasPermission,
  onRequestPermission,
  onUseDefault,
  defaultLocationName = 'Ouagadougou'
}: GeolocationPromptProps) {
  // Already granted permission
  if (hasPermission) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Info or Warning banner */}
      {isGeolocationBlocked || errorMessage ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4" role="alert">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-sm text-amber-900">
              <p className="font-medium mb-1">Géolocalisation non disponible</p>
              <p className="text-xs text-amber-800">
                {isGeolocationBlocked 
                  ? 'La géolocalisation est désactivée dans votre navigateur ou cette page.' 
                  : 'Impossible d\'accéder à votre position.'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4" role="status">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-sm text-gray-700">
              <p className="mb-2">Pour voir les gares et véhicules à proximité, nous avons besoin d'accéder à votre position.</p>
              <p className="text-xs text-gray-600">Vos données de localisation sont sécurisées et supprimées après 7 jours.</p>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4" role="alert" aria-live="assertive">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-sm text-red-800">
              <p>{errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {(isGeolocationBlocked || errorMessage) ? (
        <>
          <Button
            onClick={onUseDefault}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
            aria-label={`Utiliser ${defaultLocationName} comme localisation par défaut`}
          >
            ✓ Utiliser {defaultLocationName} par défaut
          </Button>
          {!isGeolocationBlocked && (
            <Button
              onClick={onRequestPermission}
              disabled={isLoading}
              variant="outline"
              className="w-full"
              aria-label="Réessayer d'obtenir votre position actuelle"
            >
              {isLoading ? 'Tentative...' : 'Réessayer la géolocalisation'}
            </Button>
          )}
        </>
      ) : (
        <>
          <Button
            onClick={onRequestPermission}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
            aria-label="Autoriser l'accès à ma position actuelle"
          >
            {isLoading ? 'Localisation en cours...' : '📍 Utiliser ma position'}
          </Button>
          <Button
            onClick={onUseDefault}
            variant="outline"
            className="w-full"
            aria-label={`Utiliser ${defaultLocationName} comme localisation par défaut`}
          >
            Utiliser {defaultLocationName} par défaut
          </Button>
        </>
      )}
    </div>
  );
}
