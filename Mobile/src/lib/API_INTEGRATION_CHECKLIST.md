# 🗂️ Architecture Complète - Fichiers et Intégration

## Fichiers Modifiés et Créés

### 1. `/lib/api.ts` - Fonctions API

**Nouvelles fonctions ajoutées (lignes ~1150-1260):**

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

export async function reportIncident(params: IncidentReportParams): Promise<IncidentReportResponse> {
  // Mock en dev, vraie requête en prod
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

export async function shareLocation(params: LocationShareParams): Promise<LocationShareResponse> {
  // Mock en dev, vraie requête en prod
}
```

**Comment l'ajouter:** ✅ Déjà fait lors du refactor

---

### 2. `/lib/hooks.ts` - Hooks Réutilisables

**Nouvelles fonctions ajoutées (lignes ~1030-1120):**

```typescript
// ============================================
// NEARBY PAGE HOOKS (Incidents & Location)
// ============================================

export function useReportIncident() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reportIncident = async (params: api.IncidentReportParams): Promise<api.IncidentReportResponse | null> => {
    // Gère try/catch et state
  };

  return { reportIncident, isLoading, error };
}

export function useShareLocation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shareLocation = async (params: api.LocationShareParams): Promise<api.LocationShareResponse | null> => {
    // Gère try/catch et state
  };

  return { shareLocation, isLoading, error };
}
```

**Comment l'ajouter:** ✅ Déjà fait lors du refactor

---

### 3. `/pages/NearbyPage.tsx` - Composant Principal

**Modifications appliquées:**

#### Import des nouveaux hooks
```typescript
import { useNearbyStations, useVehicleLiveTracking, useMyTickets, useReportIncident, useShareLocation } from '../lib/hooks';
```

#### Utilisation des hooks
```typescript
export function NearbyPage({ trackingTripId, onNavigate }: NearbyPageProps) {
  // Anciennes lignes
  const { nearbyStations } = useNearbyStations(...);
  const { location: vehicleLocation } = useVehicleLiveTracking(...);
  const { tickets } = useMyTickets();

  // NOUVELLES LIGNES ✅
  const { reportIncident, isLoading: reportingIncident, error: incidentError } = useReportIncident();
  const { shareLocation, isLoading: sharingLocation, error: locationShareError } = useShareLocation();

  // Handlers utilisant les hooks (remplacent les fetch directs)
  const handleSendIncidentReport = async () => {
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

  const handleShareLocation = async () => {
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

  // JSX utilise les handlers et loading states
  return (
    <button onClick={() => setShowIncidentModal(true)} disabled={reportingIncident}>
      {reportingIncident ? '⏳ Envoi en cours...' : '⚠️ Signaler un incident'}
    </button>
  );
}
```

---

## 📊 Flux de Données

```
User clicks button
    ↓
onClick handler: handleSendIncidentReport()
    ↓
await reportIncident({ trip_id, description, lat, lon, timestamp })
    ↓
Hook: useReportIncident()
    ├─ setIsLoading(true)
    ├─ try { await api.reportIncident(params) }
    └─ catch { setError() }
    ↓
API Function: api.reportIncident()
    ├─ if (isDevelopment)
    │  └─ console.log() + return mockData
    └─ else
       ├─ fetch(`${BASE_URL}/incidents`, POST)
       └─ return response.json()
    ↓
Backend receives POST /api/incidents
    ├─ Validate EMBARKED status
    ├─ Validate trip in progress
    ├─ Store in DB
    ├─ Notify driver
    └─ Return { incident_id, status, ... }
    ↓
Hook updates state: isLoading = false
    ↓
Component re-renders with result
    ↓
Show success/error message to user
```

---

## 🔧 Configuration

### Environment Variables

**`.env.development`** (déjà utilisé par défaut):
```env
VITE_API_URL=http://localhost:3000/api
```

**`.env.production`** (à créer):
```env
VITE_API_URL=https://api.transportbf.com/api
```

### Build Process

```bash
# Development (utilise mocks)
npm run dev
# → isDevelopment = true
# → console.log() pour les appels API

# Production (utilise backend réel)
npm run build
# → isDevelopment = false (selon .env.production)
# → fetch() vers VITE_API_URL
```

---

## ✅ Checklist Intégration

### Frontend (déjà complété)
- [x] Créer types TypeScript (IncidentReportParams, LocationShareParams)
- [x] Implémenter fonctions API avec mock fallback
- [x] Créer hooks personnalisés (useReportIncident, useShareLocation)
- [x] Intégrer hooks dans NearbyPage
- [x] Ajouter loading states dans UI
- [x] Ajouter gestion erreurs
- [x] Build validation (npm run build) ✅ SUCCESS

### Backend (à faire)
- [ ] Implémenter route `POST /api/incidents`
- [ ] Implémenter route `POST /api/share-location`
- [ ] Ajouter middleware validation EMBARKED
- [ ] Ajouter middleware validation trip progress
- [ ] Implémenter notifications driver
- [ ] Tester endpoints avec curl/Postman
- [ ] Configurer CORS pour frontend domain
- [ ] Déployer et configurer VITE_API_URL

---

## 🧪 Tests Manuels

### Test 1: Mode Development

1. Ouvrir `http://localhost:5173/nearby`
2. Embarquer sur un trajet
3. Cliquer "Signaler un incident"
4. Ouvrir DevTools Console
5. Voir log: `[MOCK] Incident Report: { trip_id: ..., mock: true }`
6. Response mock retournée: `{ incident_id: "INCIDENT_...", status: "created" }`

**Résultat attendu:** Page continue de fonctionner normalement

---

### Test 2: Mode Production (après backend ready)

1. Configurer `.env.production` avec vraie API
2. Build: `npm run build`
3. Deploy static files + backend
4. Tester depuis `https://transportbf.app/nearby`
5. DevTools Console ne devrait PAS afficher `[MOCK]`
6. Les appels iront directement à `https://api.transportbf.com/api/incidents`

**Résultat attendu:** Incidents reçus par backend, driver notifié

---

## 📝 Références Fichiers

| Fichier | Ligne | Modification |
|---------|-------|-----|
| `/lib/api.ts` | ~1150-1260 | ✅ Nouvelles fonctions reportIncident, shareLocation |
| `/lib/hooks.ts` | ~1030-1120 | ✅ Nouveaux hooks useReportIncident, useShareLocation |
| `/pages/NearbyPage.tsx` | ~1-30 | ✅ Import nouveaux hooks |
| `/pages/NearbyPage.tsx` | ~50-60 | ✅ Utilisation hooks dans composant |
| `/pages/NearbyPage.tsx` | ~120-160 | ✅ Handlers refactorisés (handleSendIncidentReport, handleShareLocation) |
| `/pages/NearbyPage.tsx` | ~370-385 | ✅ JSX: boutons avec loading states |

---

## 🚀 Prochaines Étapes

### Pour Frontend Dev:
1. ✅ Structure API complète
2. ✅ Prêt pour backend

### Pour Backend Dev:
1. Implémenter routes POST /api/incidents et POST /api/share-location
2. Suivre types TypeScript dans `/lib/api.ts`
3. Ajouter validations listées dans commentaires
4. Implémenter notifications driver
5. Tester avec endpoints

### Pour DevOps:
1. Créer `.env.production` avec VITE_API_URL
2. Déployer frontend build
3. Configurer CORS backend
4. Vérifier connexion frontend ↔ backend

---

## 📚 Documentation Complémentaire

- `backend-examples/nearby-page-api-routes.js` - Exemples backend complètes
- `API_STRUCTURE_GUIDE.md` - Guide architecture patterns
- `NearbyPage.tsx` - Code source actuel
- Voir commentaires JSDoc dans `/lib/api.ts` pour specs détaillés

