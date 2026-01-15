# 🚀 Quick Reference - API Refactor

## 📋 TL;DR

**Avant:** Appels `fetch()` en dur dans le composant  
**Après:** Architecture 3-couches (API Service → Hooks → Componentsent)

---

## 🎯 Où Trouver Quoi?

### Pour Comprendre l'Architecture
📄 `/lib/API_STRUCTURE_GUIDE.md`
- Pattern Mock/Prod
- 3 couches expliquées
- Comment basculer en production

### Pour Coder le Backend
📄 `CODE_LOCATIONS_MAP.md`
- Localisation exacte de chaque change
- Types TypeScript à implémenter
- Routes à créer

### Pour Checklist Intégration
📄 `API_INTEGRATION_CHECKLIST.md`
- Ce qui a été fait (frontend)
- Ce qui reste (backend)
- Étapes production

### Pour Voir les Changements
📄 `/BEFORE_AFTER_COMPARISON.md`
- Code AVANT (problèmes)
- Code APRÈS (solutions)
- Comparaison table

### Pour Vue d'Ensemble
📄 `README_REFACTOR_SUMMARY.md`
- Résumé exécutif
- Validation build
- Prochaines étapes

---

## 💻 Code Quick Reference

### Utiliser le Hook dans un Composant

```typescript
import { useReportIncident, useShareLocation } from '../lib/hooks';

export function MyComponent() {
  const { reportIncident, isLoading, error } = useReportIncident();
  
  const handleReport = async () => {
    const result = await reportIncident({
      trip_id: 'TRIP_123',
      description: 'Test incident',
      latitude: 12.3714,
      longitude: -1.5197,
      timestamp: new Date().toISOString()
    });
    
    if (result) {
      console.log('Succès:', result.incident_id);
    } else {
      console.error('Erreur:', error);
    }
  };
  
  return (
    <button onClick={handleReport} disabled={isLoading}>
      {isLoading ? 'Chargement...' : 'Reporter'}
    </button>
  );
}
```

---

### Ajouter une Nouvelle API

**Étape 1:** Créer la fonction dans `/lib/api.ts`

```typescript
export interface MyParams {
  field1: string;
  field2: number;
}

export interface MyResponse {
  result_id: string;
  status: string;
}

export async function myApiFunction(params: MyParams): Promise<MyResponse> {
  if (isDevelopment) {
    console.log('[MOCK]', { ...params });
    return { result_id: `ID_${Date.now()}`, status: 'ok' };
  }
  
  const response = await fetch(`${BASE_URL}/my-endpoint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  
  if (!response.ok) throw new Error('Failed');
  return response.json();
}
```

**Étape 2:** Créer le hook dans `/lib/hooks.ts`

```typescript
export function useMyFunction() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const myFunction = async (params: api.MyParams) => {
    try {
      setIsLoading(true);
      setError(null);
      return await api.myApiFunction(params);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error';
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  return { myFunction, isLoading, error };
}
```

**Étape 3:** Utiliser dans le composant

```typescript
const { myFunction, isLoading } = useMyFunction();
const result = await myFunction({ field1: 'test', field2: 123 });
```

---

## 📊 Types TypeScript

### Types pour Incidents

```typescript
// Request
{
  trip_id: string;        // "TRIP_123"
  description: string;    // "Accident on road"
  latitude: number;       // 12.3714
  longitude: number;      // -1.5197
  timestamp: string;      // "2025-11-29T10:30:00Z"
}

// Response
{
  incident_id: string;    // "INC_001"
  status: 'created' | 'pending' | 'acknowledged';
  created_at: string;     // "2025-11-29T10:30:00Z"
  message: string;        // "Incident créé"
}
```

### Types pour Location Sharing

```typescript
// Request
{
  trip_id: string;        // "TRIP_123"
  latitude: number;       // 12.3714
  longitude: number;      // -1.5197
  timestamp: string;      // "2025-11-29T10:30:00Z"
}

// Response
{
  share_id: string;       // "SHARE_001"
  status: 'shared' | 'acknowledged';
  driver_notified: boolean;
  created_at: string;     // "2025-11-29T10:30:00Z"
  message: string;        // "Position shared"
}
```

---

## 🔌 Backend Routes à Implémenter

### POST /api/incidents

```bash
curl -X POST http://localhost:3000/api/incidents \
  -H "Content-Type: application/json" \
  -d '{
    "trip_id": "TRIP_123",
    "description": "Accident",
    "latitude": 12.3714,
    "longitude": -1.5197,
    "timestamp": "2025-11-29T10:30:00Z"
  }'
```

**Backend doit:**
- ✅ Valider EMBARKED status
- ✅ Vérifier trip en cours
- ✅ Stocker en DB
- ✅ Notifier driver
- ✅ Retourner incident_id

---

### POST /api/share-location

```bash
curl -X POST http://localhost:3000/api/share-location \
  -H "Content-Type: application/json" \
  -d '{
    "trip_id": "TRIP_123",
    "latitude": 12.3714,
    "longitude": -1.5197,
    "timestamp": "2025-11-29T10:30:00Z"
  }'
```

**Backend doit:**
- ✅ Valider EMBARKED status
- ✅ Vérifier progress >= 70%
- ✅ Stocker location
- ✅ Notifier driver WebSocket
- ✅ Retourner share_id

---

## 🧪 Mode Dev vs Prod

### Comment Fonctionne le Toggle

**Fichier:** `/lib/api.ts`, ligne 27

```typescript
// DEV MODE (par défaut)
const isDevelopment = (...) || true;

// Résultat: console.log() + mock data
```

```typescript
// PROD MODE (en production)
const isDevelopment = (_meta.env && _meta.env.MODE === 'development');

// Résultat: fetch() vers BASE_URL
```

### DevTools Console Output

**En DEV (attendu):**
```javascript
[MOCK] Incident Report: {
  trip_id: "TRIP_123",
  description: "Test",
  latitude: 12.3714,
  longitude: -1.5197,
  timestamp: "2025-11-29T10:30:00Z",
  mock: true
}
```

**En PROD (pas de [MOCK]):**
```javascript
// Aucun log - fetch() vers backend réel
```

---

## ✅ Validation Checklist

```bash
# 1. TypeScript OK?
npm run build
# ✅ Pas d'erreurs

# 2. Fichiers créés?
ls /lib/api.ts /lib/hooks.ts
# ✅ Fichiers existent

# 3. Types accessibles?
grep "export interface IncidentReportParams" /lib/api.ts
# ✅ Types trouvées

# 4. Hooks accessibles?
grep "export function useReportIncident" /lib/hooks.ts
# ✅ Hooks trouvées

# 5. Composant utilise hooks?
grep "useReportIncident" /pages/NearbyPage.tsx
# ✅ Composant utilise les hooks
```

---

## 🎯 Architecture Décisions

| Question | Réponse | Raison |
|----------|--------|--------|
| Où mettre les types? | `/lib/api.ts` | Centralisé, côté API |
| Où mettre fetch()? | `/lib/api.ts` | Abstraction, changeable |
| Où mettre state? | `/lib/hooks.ts` | Réutilisable |
| Où mettre UI? | `/pages/NearbyPage.tsx` | Lisible, simple |
| Comment tester? | Mock en dev | Pas besoin backend |
| Comment scalabiliser? | Ajouter plus d'APIs | Pattern répétable |

---

## 🚨 Erreurs Communes à Éviter

### ❌ MAUVAIS: Appel fetch direct

```typescript
// ❌ NE PAS FAIRE
const handleClick = async () => {
  const res = await fetch('/api/incidents', { ... });
  // ...
};
```

### ✅ BON: Utiliser le hook

```typescript
// ✅ FAIRE
const { reportIncident } = useReportIncident();
const result = await reportIncident({ ... });
```

---

### ❌ MAUVAIS: Types définis dans composant

```typescript
// ❌ NE PAS FAIRE
export function NearbyPage() {
  type IncidentParams = { ... };
}
```

### ✅ BON: Types centralisés

```typescript
// ✅ FAIRE - Dans /lib/api.ts
export interface IncidentReportParams { ... }
```

---

### ❌ MAUVAIS: Pas de gestion d'erreur

```typescript
// ❌ NE PAS FAIRE
const result = await api.reportIncident(params);
```

### ✅ BON: Toujours vérifier

```typescript
// ✅ FAIRE
const result = await reportIncident(params);
if (result) {
  // Succès
} else {
  // Erreur (message dans hook.error)
}
```

---

## 📞 Support

### Question: Où trouver l'exemple backend?
**Réponse:** `backend-examples/nearby-page-api-routes.js`

### Question: Comment modifier l'URL API?
**Réponse:** `/lib/api.ts` ligne 28 + `.env.production`

### Question: Comment tester en DEV?
**Réponse:** Ouvrir DevTools Console, voir `[MOCK]` log

### Question: Comment basculer en PROD?
**Réponse:** Voir `API_STRUCTURE_GUIDE.md` section "Basculer vers Backend Réel"

---

## 🎓 Ressources

- 📖 API_STRUCTURE_GUIDE.md - Guide complet
- 📋 API_INTEGRATION_CHECKLIST.md - Checklist
- 🗺️ CODE_LOCATIONS_MAP.md - Localisation code
- 🔄 BEFORE_AFTER_COMPARISON.md - Comparaison
- 📝 README_REFACTOR_SUMMARY.md - Résumé

**Tout est ici, prêt à utiliser! 🚀**
