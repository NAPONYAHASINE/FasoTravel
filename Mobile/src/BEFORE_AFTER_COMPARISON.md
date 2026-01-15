# 🔄 Comparaison Avant/Après - Refactoring API

## ❌ AVANT: Architecture Manquante

### Problème 1: Appels API en dur dans le composant

```typescript
// ❌ AVANT - Dans NearbyPage.tsx (ligne 150-180)
export function NearbyPage(...) {
  // ... state setup ...
  
  // PROBLÈME: Appel fetch directement dans le composant
  const sendIncidentReport = async () => {
    if (!incidentText.trim()) {
      window.alert('Veuillez fournir une description de l\'incident.');
      return;
    }
    try {
      // ❌ Pas de types TypeScript!
      // ❌ Pas de centralization!
      // ❌ Pas de testabilité!
      const payload = {
        tripId: autoTripId,  // ← Note: tripId, pas trip_id
        description: incidentText.trim(),
        timestamp: new Date().toISOString(),
        latitude: vehicleLocation?.current_latitude,
        longitude: vehicleLocation?.current_longitude
      };
      
      // ❌ Fetch raw - pas de abstraction
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      // ❌ Gestion erreur basique
      if (!res.ok) throw new Error('Network error');
      
      // ❌ UI updates pas cohérents
      window.alert('Incident envoyé. Merci.');
      setIncidentText('');
      setShowIncidentModal(false);
    } catch (err) {
      console.error(err);
      window.alert('Impossible d\'envoyer le signalement.');
    }
  };

  // ❌ Même problème pour shareLocation
  const shareLocation = async () => {
    try {
      const payload = {
        tripId: autoTripId,  // Inconsistant!
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
  
  // JSX avec les handlers
  return (
    <button onClick={() => setShowIncidentModal(true)}>
      ⚠️ Signaler un incident
    </button>
  );
}
```

### Problèmes Identifiés:

| Problème | Impact |
|----------|--------|
| **Pas de types TypeScript** | Erreurs runtime difficiles à détecter |
| **Pas de centralisation** | Code dupliqué dans plusieurs pages |
| **Pas de mock/fallback** | Impossible de tester sans backend |
| **Gestion erreur incohérente** | Certains appels gèrent différemment |
| **Pas de reusabilité** | Code pas utilisable ailleurs |
| **Pas de loading states** | UX pas optimal (pas de feedback) |
| **Pas de abstraction** | Changement d'URL = change partout |

---

## ✅ APRÈS: Architecture 3-Couches

### Solution 1: API Service Layer (`/lib/api.ts`)

```typescript
// ✅ APRÈS - Dans /lib/api.ts (lignes 1150-1260)

// 1️⃣ Types TypeScript centralisés
export interface IncidentReportParams {
  trip_id: string;  // ← Nomenclature cohérente
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

// 2️⃣ Fonction API avec abstraction complète
/**
 * Signaler un incident pendant un trajet en cours
 * 
 * BACKEND ENDPOINT: POST /api/incidents
 * 
 * Validation backend:
 * - Vérifier que l'utilisateur a un ticket EMBARKED pour ce trip_id
 * - Vérifier que trip_id correspond à un trajet en cours
 * - Stocker incident avec géolocalisation
 * - Notifier le driver et opérateur
 */
export async function reportIncident(
  params: IncidentReportParams
): Promise<IncidentReportResponse> {
  // ✅ Mode DEV: Mock data
  if (isDevelopment) {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('[MOCK] Incident Report:', {
      ...params,
      mock: true
    });
    
    return {
      incident_id: `INCIDENT_${Date.now()}`,
      status: 'created',
      created_at: new Date().toISOString(),
      message: '[DEV MODE] Incident enregistré localement. Endpoint: POST /api/incidents'
    };
  }

  // ✅ Mode PROD: Vraie requête avec gestion d'erreur standardisée
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

// ✅ Même pattern pour shareLocation
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

export async function shareLocation(
  params: LocationShareParams
): Promise<LocationShareResponse> {
  if (isDevelopment) {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    console.log('[MOCK] Location Share:', {
      ...params,
      mock: true
    });
    
    return {
      share_id: `SHARE_${Date.now()}`,
      status: 'shared',
      driver_notified: true,
      created_at: new Date().toISOString(),
      message: '[DEV MODE] Position partagée localement. Endpoint: POST /api/share-location'
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

**Avantages:**
- ✅ Types TypeScript centralisés
- ✅ Mock/Prod toggle automatique
- ✅ Gestion erreur standardisée
- ✅ Documentation du backend intégrée
- ✅ Base URL centralisée

---

### Solution 2: Custom Hooks (`/lib/hooks.ts`)

```typescript
// ✅ APRÈS - Dans /lib/hooks.ts (lignes 1030-1120)

/**
 * Hook pour signaler un incident pendant un trajet en cours
 * 
 * USAGE:
 * ```
 * const { reportIncident, isLoading, error } = useReportIncident();
 * 
 * const handleReport = async () => {
 *   const result = await reportIncident({
 *     trip_id: embarkedTicket.trip_id,
 *     description: 'Accident sur la route',
 *     latitude: vehicleLocation.current_latitude,
 *     longitude: vehicleLocation.current_longitude,
 *     timestamp: new Date().toISOString()
 *   });
 *   if (result) console.log('Incident créé:', result.incident_id);
 * };
 * ```
 */
export function useReportIncident() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reportIncident = async (
    params: api.IncidentReportParams
  ): Promise<api.IncidentReportResponse | null> => {
    try {
      // ✅ Gestion state cohérente
      setIsLoading(true);
      setError(null);
      
      // ✅ Appel à la couche API
      const result = await api.reportIncident(params);
      return result;
    } catch (err) {
      // ✅ Erreur centralisée
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

// ✅ Même pattern pour shareLocation
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

**Avantages:**
- ✅ State management standardisé
- ✅ Try/catch centralisé
- ✅ Réutilisable dans d'autres composants
- ✅ Testable facilement
- ✅ Gestion erreur cohérente

---

### Solution 3: Composant Refactorisé (`/pages/NearbyPage.tsx`)

```typescript
// ✅ APRÈS - Dans NearbyPage.tsx

import { useReportIncident, useShareLocation } from '../lib/hooks';

export function NearbyPage({ trackingTripId, onNavigate }: NearbyPageProps) {
  // ✅ Utilisation des hooks - CLEAN & SIMPLE
  const { reportIncident, isLoading: reportingIncident, error: incidentError } = useReportIncident();
  const { shareLocation, isLoading: sharingLocation, error: locationShareError } = useShareLocation();

  // ✅ Handlers utilisant les hooks
  const handleSendIncidentReport = async () => {
    if (!incidentText.trim()) {
      window.alert('Veuillez fournir une description de l\'incident.');
      return;
    }
    
    if (!autoTripId || !vehicleLocation) {
      window.alert('Impossible de créer l\'incident: données manquantes.');
      return;
    }

    // ✅ Appel propre et typé
    const result = await reportIncident({
      trip_id: autoTripId,  // ← Nomenclature cohérente
      description: incidentText.trim(),
      timestamp: new Date().toISOString(),
      latitude: vehicleLocation.current_latitude,
      longitude: vehicleLocation.current_longitude
    });

    // ✅ Gestion résultat
    if (result) {
      window.alert('Incident signalé avec succès.');
      setIncidentText('');
      setShowIncidentModal(false);
    } else {
      window.alert(incidentError || 'Impossible d\'envoyer le signalement.');
    }
  };

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

  // ✅ JSX avec loading states
  return (
    <div>
      {/* Modal incident */}
      {showIncidentModal && (
        <div className="modal">
          <button
            onClick={handleSendIncidentReport}
            disabled={reportingIncident}  // ← Loading state visible
            className="bg-red-500 disabled:bg-red-300"
          >
            {reportingIncident ? '⏳ Envoi...' : 'Envoyer'}
          </button>
        </div>
      )}

      {/* Boutons d'actions */}
      <button onClick={() => setShowIncidentModal(true)} disabled={reportingIncident}>
        {reportingIncident ? '⏳ Envoi en cours...' : '⚠️ Signaler un incident'}
      </button>

      {vehicleLocation.progress_percent >= 70 && (
        <button onClick={handleShareLocation} disabled={sharingLocation}>
          {sharingLocation ? '⏳ Partage en cours...' : '📍 Partager ma position'}
        </button>
      )}
    </div>
  );
}
```

**Avantages:**
- ✅ Aucun appel fetch direct
- ✅ Code lisible et maintenable
- ✅ Loading states visibles
- ✅ Gestion erreur cohérente
- ✅ Types TypeScript garantis

---

## 📊 Comparaison Résumée

| Aspect | Avant | Après |
|--------|-------|-------|
| **Fichiers affectés** | 1 (NearbyPage.tsx) | 3 (api.ts, hooks.ts, NearbyPage.tsx) |
| **Types TypeScript** | ❌ Pas de types | ✅ Types complets |
| **Centralization** | ❌ Code éparpillé | ✅ Couche API dédiée |
| **Mock/Dev** | ❌ Impossible | ✅ Automatique |
| **Réutilisabilité** | ❌ Non | ✅ Hooks réutilisables |
| **Loading States** | ❌ Manuel | ✅ Automatique |
| **Error Handling** | ❌ Inconsistant | ✅ Standardisé |
| **Documentation** | ❌ Aucune | ✅ Complète |
| **Testabilité** | ❌ Difficile | ✅ Facile (mock) |
| **Backend Ready** | ❌ Non structuré | ✅ Types export |
| **Lines of Code** | ~130 (dans composant) | ~120 (api.ts) + ~100 (hooks.ts) + ~30 (composant) |
| **Maintenabilité** | ❌ Basse | ✅ Haute |

---

## 🎓 Apprentissage

L'architecture Après suit le **pattern professionnel industrie:**

1. **Service Layer** (api.ts) - Centralise les appels externes
2. **Hook Layer** (hooks.ts) - State management réutilisable
3. **Component Layer** (NearbyPage.tsx) - Simple, lisible, testable

C'est exactement ce que font les grandes applications:
- React Query, SWR, Apollo Client - tous utilisent ce pattern
- Backend RESTful bien construit expose des APIs typées
- Frontend les wraps dans services + hooks

**Résultat:** Code scalable, maintenable, testable ✅
