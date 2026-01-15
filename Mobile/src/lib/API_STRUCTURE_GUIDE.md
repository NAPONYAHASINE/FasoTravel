# 📋 Guide de Structure API - Architecture Préparée

## Vue d'ensemble

L'architecture API de NearbyPage est **complètement préparée** pour intégration directe du backend. Tous les appels API sont:

✅ Centralisés dans `/lib/api.ts`  
✅ Wrappés dans des hooks réutilisables (`/lib/hooks.ts`)  
✅ Utilisant le pattern **mock en dev / production en prod**  
✅ Avec gestion d'erreurs standardisée  
✅ Prêts à basculer vers vrai backend

---

## 📚 Architecture en 3 couches

### Couche 1: API Service (`/lib/api.ts`)

Chaque endpoint a sa propre fonction avec:
- **Types TypeScript** pour requête/réponse
- **Mode DEV**: Données mockées avec console.log
- **Mode PROD**: Vraie requête fetch vers le backend
- **Documentation commentée** de ce que le backend doit faire

**Exemple: Report Incident**

```typescript
// Fichier: /lib/api.ts, ligne ~1150

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
 * 
 * Validation backend:
 * - Vérifier que l'utilisateur a un ticket EMBARKED pour ce trip_id
 * - Vérifier que trip_id correspond à un trajet en cours
 * - Stocker incident avec géolocalisation
 * - Notifier le driver et opérateur
 * 
 * @param params Détails de l'incident (trip_id, description, lat/lon, timestamp)
 * @returns Réponse confirming incident creation
 */
export async function reportIncident(params: IncidentReportParams): Promise<IncidentReportResponse> {
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
```

**Points clés:**
- Types explicites (TypeScript)
- Mode dev: console.log + response mockée
- Mode prod: fetch() standard avec gestion erreurs
- Documentation backend intégrée

---

### Couche 2: Hooks Réutilisables (`/lib/hooks.ts`)

Chaque hook wraps l'appel API et gère:
- **État loading/error**
- **Try/catch automatique**
- **Gestion d'état utilisateur** (setIsLoading, setError)

**Exemple: useReportIncident()**

```typescript
// Fichier: /lib/hooks.ts, ligne ~1050

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
```

**Usage dans composants:**

```typescript
const { reportIncident, isLoading, error } = useReportIncident();

const handleSubmit = async () => {
  const result = await reportIncident({
    trip_id: embarkedTicket.trip_id,
    description: userInput,
    latitude: location.lat,
    longitude: location.lon,
    timestamp: new Date().toISOString()
  });
  
  if (result) {
    console.log('Incident created:', result.incident_id);
  } else {
    console.error('Error:', error);
  }
};
```

---

### Couche 3: Composants (`/pages/NearbyPage.tsx`)

Utilise les hooks, ne contient **aucun appel fetch direct**:

```typescript
// Fichier: /pages/NearbyPage.tsx

export function NearbyPage({ trackingTripId, onNavigate }: NearbyPageProps) {
  // ✅ Utilise les hooks (pas de fetch direct!)
  const { reportIncident, isLoading: reportingIncident } = useReportIncident();
  const { shareLocation, isLoading: sharingLocation } = useShareLocation();

  const handleSendIncidentReport = async () => {
    // Appel propre et typé
    const result = await reportIncident({
      trip_id: autoTripId,
      description: incidentText,
      timestamp: new Date().toISOString(),
      latitude: vehicleLocation.current_latitude,
      longitude: vehicleLocation.current_longitude
    });

    if (result) {
      // Succès
    } else {
      // Erreur (déjà loggée par le hook)
    }
  };

  return (
    <button 
      onClick={handleSendIncidentReport}
      disabled={reportingIncident}  // ✅ Loading state UI
    >
      {reportingIncident ? '⏳ Envoi...' : '⚠️ Signaler'}
    </button>
  );
}
```

---

## 🔌 Endpoints API Requis

### 1. POST `/api/incidents`

**Frontend envoie:**
```json
{
  "trip_id": "TRIP_123",
  "description": "Accident sur la route",
  "latitude": 12.3714,
  "longitude": -1.5197,
  "timestamp": "2025-11-29T10:30:00Z"
}
```

**Backend retourne:**
```json
{
  "incident_id": "INC_2025_001",
  "status": "created",
  "created_at": "2025-11-29T10:30:00Z",
  "message": "Incident enregistré et driver notifié"
}
```

**Backend doit:**
- ✅ Valider que le user a un ticket EMBARKED pour ce trip_id
- ✅ Vérifier que le trip est en cours
- ✅ Stocker l'incident en DB avec géolocalisation
- ✅ Notifier le driver via WebSocket/email
- ✅ Retourner incident_id pour confirmation frontend

**Fichier backend:** Voir `backend-examples/nearby-page-api-routes.js`

---

### 2. POST `/api/share-location`

**Frontend envoie:**
```json
{
  "trip_id": "TRIP_123",
  "latitude": 12.3714,
  "longitude": -1.5197,
  "timestamp": "2025-11-29T10:30:00Z"
}
```

**Backend retourne:**
```json
{
  "share_id": "SHARE_001",
  "status": "shared",
  "driver_notified": true,
  "created_at": "2025-11-29T10:30:00Z",
  "message": "Position partagée avec le driver"
}
```

**Backend doit:**
- ✅ Valider EMBARKED status
- ✅ Vérifier trip progress >= 70%
- ✅ Stocker location avec TTL (privacy)
- ✅ Envoyer notification driver WebSocket
- ✅ Retourner share_id pour confirmation

---

## 🔄 Comment Basculer vers le Backend Réel

### Step 1: Identifier le mode DEV

**Fichier:** `/lib/api.ts`, ligne ~27

```typescript
const isDevelopment = (_meta.env && _meta.env.MODE === 'development') || true; // ← CHANGE THIS
```

**Pour activer PROD:**
```typescript
const isDevelopment = (_meta.env && _meta.env.MODE === 'development'); // ← Mode prod en prod
```

### Step 2: Vérifier les URLs backend

**Fichier:** `/lib/api.ts`, ligne ~28

```typescript
const BASE_URL = (_meta.env && _meta.env.VITE_API_URL) || 'http://localhost:3000/api';
```

Créer `.env.production`:
```env
VITE_API_URL=https://api.transportbf.com/api
```

### Step 3: Implémenter les routes backend

Copier les exemples depuis:
```
frontend-examples/nearby-page-api-routes.js
```

Et les adapter à votre stack backend (Express, Django, etc.)

### Step 4: Test

1. Build production: `npm run build`
2. Les appels useReportIncident() et useShareLocation() utiliseront le vrai backend automatiquement
3. Erreurs TypeScript? Vérifier les types de réponse dans `/lib/api.ts`

---

## 📊 Pattern Architectural

```
┌─────────────────────────────────────────────────────┐
│              React Component                         │
│            (NearbyPage.tsx)                         │
│  - Utilise useReportIncident()                      │
│  - Utilise useShareLocation()                       │
└────────────────┬────────────────────────────────────┘
                 │ imports
                 ▼
┌─────────────────────────────────────────────────────┐
│            Custom Hooks                             │
│            (/lib/hooks.ts)                          │
│  - useReportIncident()                              │
│  - useShareLocation()                               │
│  - Gère isLoading, error state                      │
└────────────────┬────────────────────────────────────┘
                 │ appelle api.*()
                 ▼
┌─────────────────────────────────────────────────────┐
│          API Service Layer                          │
│            (/lib/api.ts)                            │
│  - reportIncident(params)                           │
│  - shareLocation(params)                            │
│  - if (isDevelopment) → mock data                   │
│  - else → fetch(`${BASE_URL}/...`)                  │
└────────────────┬────────────────────────────────────┘
                 │ fetch()
                 ▼
        ┌────────────────────┐
        │  Backend API       │
        │ /api/incidents     │
        │ /api/share-location│
        └────────────────────┘
```

---

## ✅ Checklist Intégration Backend

- [ ] Implémenter `POST /api/incidents`
- [ ] Implémenter `POST /api/share-location`
- [ ] Ajouter validation EMBARKED status côté backend
- [ ] Ajouter notifications driver (WebSocket)
- [ ] Configurer `VITE_API_URL` en `.env.production`
- [ ] Changer `isDevelopment` condition
- [ ] Tester avec vrai API
- [ ] Vérifier types TypeScript matchent réponses backend

---

## 🧪 Test en Mode DEV

**Console output attendu:**

```typescript
// Dans les DevTools console:
[MOCK] Incident Report: {
  trip_id: "TRIP_123",
  description: "Test incident",
  latitude: 12.3714,
  longitude: -1.5197,
  timestamp: "2025-11-29T10:30:00Z",
  mock: true
}
```

Cela signifie que l'app fonctionne en mode dev avec données mockées. Quand vous passez en prod, les appels iront au vrai backend.

---

## 📝 Résumé

| Layer | Fichier | Responsabilité | Testable |
|-------|---------|-----------------|----------|
| **Component** | `NearbyPage.tsx` | Affichage UI, appel hooks | ✅ Pas de fetch |
| **Hooks** | `hooks.ts` | State management, try/catch | ✅ Mock API ok |
| **API Service** | `api.ts` | Fetch logic, mode toggle | ✅ Mock/Prod |
| **Backend** | Votre serveur | Logique métier, DB | ✅ À implémenter |

**Avantage:** Vous pouvez développer frontend SANS backend, grâce aux mocks. Backend peut être implémenté indépendamment en suivant les types TypeScript.
