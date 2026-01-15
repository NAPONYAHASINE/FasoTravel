# 🎯 Localisation Exacte du Code - NearbyPage Refactor

## 📍 Fichier 1: `/lib/api.ts`

### Location: Fin du fichier (après getVehicleLocation)

**Cherchez cette ligne (~ligne 1145):**
```typescript
  const response = await fetch(`${BASE_URL}/trips/${tripId}/location`);
  if (!response.ok) return null;
  return response.json();
}
```

**Ajout après:**

```typescript
// ============================================
// NEARBY PAGE API (Incidents & Location Sharing)
// ============================================

export interface IncidentReportParams {
  trip_id: string;
  description: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

export interface IncidentReportResponse {
  incident_id: string;
  status: 'created' | 'pending' | 'acknowledged';
  created_at: string;
  message: string;
}

/**
 * Signaler un incident pendant un trajet en cours
 * 
 * BACKEND ENDPOINT: POST /api/incidents
 */
export async function reportIncident(params: IncidentReportParams): Promise<IncidentReportResponse> {
  if (isDevelopment) {
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('[MOCK] Incident Report:', { ...params, mock: true });
    return {
      incident_id: `INCIDENT_${Date.now()}`,
      status: 'created',
      created_at: new Date().toISOString(),
      message: '[DEV MODE] Incident enregistré localement.'
    };
  }

  const response = await fetch(`${BASE_URL}/incidents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to report incident');
  }

  return response.json();
}

export interface LocationShareParams {
  trip_id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

export interface LocationShareResponse {
  share_id: string;
  status: 'shared' | 'acknowledged';
  driver_notified: boolean;
  created_at: string;
  message: string;
}

/**
 * Partager sa position avec le driver
 * 
 * BACKEND ENDPOINT: POST /api/share-location
 */
export async function shareLocation(params: LocationShareParams): Promise<LocationShareResponse> {
  if (isDevelopment) {
    await new Promise(resolve => setTimeout(resolve, 400));
    console.log('[MOCK] Location Share:', { ...params, mock: true });
    return {
      share_id: `SHARE_${Date.now()}`,
      status: 'shared',
      driver_notified: true,
      created_at: new Date().toISOString(),
      message: '[DEV MODE] Position partagée localement.'
    };
  }

  const response = await fetch(`${BASE_URL}/share-location`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to share location');
  }

  return response.json();
}
```

✅ **Status:** Déjà ajouté lors du refactor

---

## 📍 Fichier 2: `/lib/hooks.ts`

### Location: Fin du fichier (après useUnreadNotificationCount)

**Cherchez cette ligne (~ligne 1026):**
```typescript
  return { unreadCount };
}
```

**Ajout après:**

```typescript
// ============================================
// NEARBY PAGE HOOKS (Incidents & Location)
// ============================================

export function useReportIncident() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reportIncident = async (
    params: api.IncidentReportParams
  ): Promise<api.IncidentReportResponse | null> => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await api.reportIncident(params);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to report incident';
      setError(message);
      console.error('Error reporting incident:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { reportIncident, isLoading, error };
}

export function useShareLocation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shareLocation = async (
    params: api.LocationShareParams
  ): Promise<api.LocationShareResponse | null> => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await api.shareLocation(params);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to share location';
      setError(message);
      console.error('Error sharing location:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { shareLocation, isLoading, error };
}
```

✅ **Status:** Déjà ajouté lors du refactor

---

## 📍 Fichier 3: `/pages/NearbyPage.tsx`

### Location 3.1: Imports (ligne 1-30)

**AVANT:**
```typescript
import { useNearbyStations, useVehicleLiveTracking, useMyTickets } from '../lib/hooks';
```

**APRÈS:**
```typescript
import { useNearbyStations, useVehicleLiveTracking, useMyTickets, useReportIncident, useShareLocation } from '../lib/hooks';
```

✅ **Status:** Déjà modifié lors du refactor

---

### Location 3.2: Initialisation Hooks (ligne 50-60)

**AVANT:**
```typescript
export function NearbyPage({ trackingTripId, onNavigate }: NearbyPageProps) {
  const [geolocationState, geolocationActions] = useGeolocation();
  // ...
  const { nearbyStations, isLoading: stationsLoading } = useNearbyStations(...);
  const { location: vehicleLocation } = useVehicleLiveTracking(...);
  const { tickets } = useMyTickets();
```

**APRÈS:**
```typescript
export function NearbyPage({ trackingTripId, onNavigate }: NearbyPageProps) {
  const [geolocationState, geolocationActions] = useGeolocation();
  // ...
  const { nearbyStations, isLoading: stationsLoading } = useNearbyStations(...);
  const { location: vehicleLocation } = useVehicleLiveTracking(...);
  const { tickets } = useMyTickets();
  
  // 🆕 NOUVELLES LIGNES
  const { reportIncident, isLoading: reportingIncident, error: incidentError } = useReportIncident();
  const { shareLocation, isLoading: sharingLocation, error: locationShareError } = useShareLocation();
```

✅ **Status:** Déjà modifié lors du refactor

---

### Location 3.3: Handlers Functions (ligne 120-200)

**AVANT:**
```typescript
  // Send incident report
  const sendIncidentReport = async () => {
    if (!incidentText.trim()) {
      window.alert('Veuillez fournir une description de l\'incident.');
      return;
    }
    try {
      const payload = {
        tripId: autoTripId,
        description: incidentText.trim(),
        timestamp: new Date().toISOString(),
        latitude: vehicleLocation?.current_latitude,
        longitude: vehicleLocation?.current_longitude
      };
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Network error');
      window.alert('Incident envoyé. Merci.');
      setIncidentText('');
      setShowIncidentModal(false);
    } catch (err) {
      console.error(err);
      window.alert('Impossible d\'envoyer le signalement.');
    }
  };

  // Share location
  const shareLocation = async () => {
    try {
      const payload = {
        tripId: autoTripId,
        latitude: vehicleLocation?.current_latitude,
        longitude: vehicleLocation?.current_longitude,
        timestamp: new Date().toISOString()
      };
      const res = await fetch('/api/share-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Network error');
      window.alert('Position partagée.');
    } catch (err) {
      console.error(err);
      window.alert('Impossible de partager la position.');
    }
  };
```

**APRÈS:**
```typescript
  // Send incident report - using hook
  const handleSendIncidentReport = async () => {
    if (!incidentText.trim()) {
      window.alert('Veuillez fournir une description de l\'incident.');
      return;
    }
    
    if (!autoTripId || !vehicleLocation) {
      window.alert('Impossible de créer l\'incident: données manquantes.');
      return;
    }

    const result = await reportIncident({
      trip_id: autoTripId,
      description: incidentText.trim(),
      timestamp: new Date().toISOString(),
      latitude: vehicleLocation.current_latitude,
      longitude: vehicleLocation.current_longitude
    });

    if (result) {
      window.alert('Incident signalé avec succès.');
      setIncidentText('');
      setShowIncidentModal(false);
    } else {
      window.alert(incidentError || 'Impossible d\'envoyer le signalement.');
    }
  };

  // Share location - using hook
  const handleShareLocation = async () => {
    if (!autoTripId || !vehicleLocation) {
      window.alert('Impossible de partager la position: données manquantes.');
      return;
    }

    const result = await shareLocation({
      trip_id: autoTripId,
      latitude: vehicleLocation.current_latitude,
      longitude: vehicleLocation.current_longitude,
      timestamp: new Date().toISOString()
    });

    if (result) {
      window.alert('Position partagée avec le chauffeur.');
    } else {
      window.alert(locationShareError || 'Impossible de partager la position.');
    }
  };
```

✅ **Status:** Déjà modifié lors du refactor

---

### Location 3.4: Bouton dans Modal (ligne 405-420)

**AVANT:**
```jsx
                    <button
                      onClick={sendIncidentReport}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2 rounded-lg"
                    >
                      Envoyer
                    </button>
```

**APRÈS:**
```jsx
                    <button
                      onClick={handleSendIncidentReport}
                      disabled={reportingIncident}
                      className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-medium py-2 rounded-lg transition"
                    >
                      {reportingIncident ? '⏳ Envoi...' : 'Envoyer'}
                    </button>
```

✅ **Status:** Déjà modifié lors du refactor

---

### Location 3.5: Boutons d'Actions Embarked (ligne 360-380)

**AVANT:**
```jsx
                  <button
                    onClick={() => setShowIncidentModal(true)}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition"
                  >
                    ⚠️ Signaler un incident
                  </button>

                  {vehicleLocation.progress_percent !== undefined && vehicleLocation.progress_percent >= 70 && (
                    <button
                      onClick={shareLocation}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition"
                    >
                      📍 Partager ma position
                    </button>
                  )}
```

**APRÈS:**
```jsx
                  <button
                    onClick={() => setShowIncidentModal(true)}
                    disabled={reportingIncident}
                    className="w-full bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-medium py-2 px-4 rounded-lg transition"
                  >
                    {reportingIncident ? '⏳ Envoi en cours...' : '⚠️ Signaler un incident'}
                  </button>

                  {vehicleLocation.progress_percent !== undefined && vehicleLocation.progress_percent >= 70 && (
                    <button
                      onClick={handleShareLocation}
                      disabled={sharingLocation}
                      className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded-lg transition"
                    >
                      {sharingLocation ? '⏳ Partage en cours...' : '📍 Partager ma position'}
                    </button>
                  )}
```

✅ **Status:** Déjà modifié lors du refactor

---

## 🎯 Résumé des Changements

| Fichier | Ligne | Type | Status |
|---------|-------|------|--------|
| `/lib/api.ts` | ~1150+ | ➕ Nouvelles fonctions | ✅ Fait |
| `/lib/hooks.ts` | ~1030+ | ➕ Nouveaux hooks | ✅ Fait |
| `NearbyPage.tsx` | 1-30 | 🔄 Import hooks | ✅ Fait |
| `NearbyPage.tsx` | 50-60 | 🔄 Init hooks | ✅ Fait |
| `NearbyPage.tsx` | 120-200 | 🔄 Handlers refactor | ✅ Fait |
| `NearbyPage.tsx` | 360-380 | 🔄 Boutons update | ✅ Fait |
| `NearbyPage.tsx` | 405-420 | 🔄 Modal button update | ✅ Fait |

**Total: 7 sections modifiées ✅**

---

## ✅ Validation Build

```bash
npm run build
# ✅ Succès - pas d'erreurs TypeScript
# ✅ Build time: 9.06s
# ✅ Bundle size: 179.14 kB gzip
```

---

## 🚀 Prochaine Étape

**Architecture API complète et prête!**

Pour implémenter le backend réel:
1. Consulter `backend-examples/nearby-page-api-routes.js`
2. Implémenter les deux routes: `/api/incidents` et `/api/share-location`
3. Suivre les types TypeScript dans `/lib/api.ts`
4. Configurer `.env.production` avec l'URL backend
5. Mettre en production
