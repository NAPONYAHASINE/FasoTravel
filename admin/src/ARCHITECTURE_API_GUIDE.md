# 🎯 ARCHITECTURE API - GUIDE D'UTILISATION

## 📋 Vue d'ensemble

L'application FasoTravel Admin est maintenant **100% Backend-Ready** avec une architecture **ZÉRO DUPLICATION**.

### ✅ Ce qui a été créé :

```
/config
  └─ env.ts                 # Configuration centralisée (API URL, tokens, etc.)

/services
  ├─ api.ts                 # Client HTTP générique (fetch wrapper + gestion erreurs)
  ├─ endpoints.ts           # Tous les endpoints API en un seul endroit
  └─ index.ts               # Services métier par ressource (operators, stations, etc.)

/hooks
  ├─ useApi.ts              # Hooks génériques (useApi, useMutation, cache)
  └─ useResources.ts        # Hooks spécialisés par ressource (useOperators, useStations, etc.)

/.env.example               # Template de configuration
```

---

## 🚀 DÉMARRAGE RAPIDE

### 1. Configuration de l'environnement

Créez un fichier `.env.local` à la racine :

```bash
cp .env.example .env.local
```

Configurez vos variables :

```env
# Mode développement SANS backend
VITE_ENABLE_MOCK_DATA=true
VITE_API_BASE_URL=http://localhost:3000/api

# Mode production AVEC backend
VITE_ENABLE_MOCK_DATA=false
VITE_API_BASE_URL=https://api.fasotravel.bf
```

---

## 💻 UTILISATION DANS LES COMPOSANTS

### ✅ AVANT (Données en dur)

```tsx
// ❌ Mauvais - Données statiques, perdues au refresh
function OperatorList() {
  const [operators, setOperators] = useState([]);
  
  useEffect(() => {
    // Données en dur
    setOperators(MOCK_OPERATORS);
  }, []);
  
  return <div>{operators.map(op => ...)}</div>
}
```

### ✅ APRÈS (API Ready)

```tsx
// ✅ Bon - Données du backend, cache, loading, erreurs
import { useOperators, useCreateOperator } from '@/hooks/useResources';

function OperatorList() {
  // Lecture des données (GET)
  const { data, loading, error, refetch } = useOperators({ 
    page: 1, 
    limit: 20 
  });
  
  // Création d'un opérateur (POST)
  const createMutation = useCreateOperator();
  
  const handleCreate = async (formData) => {
    try {
      await createMutation.mutate(formData);
      toast.success('Opérateur créé avec succès');
    } catch (error) {
      toast.error(error.message);
    }
  };
  
  if (loading) return <Loader />;
  if (error) return <Error message={error.message} />;
  
  return (
    <div>
      {data?.data.map(op => (
        <OperatorCard key={op.id} operator={op} />
      ))}
      <CreateButton onClick={handleCreate} />
    </div>
  );
}
```

---

## 🎨 EXEMPLES PAR RESSOURCE

### 1️⃣ OPÉRATEURS (Sociétés de transport)

```tsx
import { 
  useOperators,        // Liste des opérateurs
  useOperator,         // Un seul opérateur
  useCreateOperator,   // Créer un opérateur
  useUpdateOperator,   // Modifier un opérateur
  useDeleteOperator    // Supprimer un opérateur
} from '@/hooks/useResources';

function OperatorsPage() {
  // GET /operators
  const { data, loading } = useOperators({ status: 'active' });
  
  // POST /operators
  const create = useCreateOperator();
  
  // PUT /operators/:id
  const update = useUpdateOperator();
  
  // DELETE /operators/:id
  const deleteOp = useDeleteOperator();
  
  return (
    <div>
      {data?.data.map(operator => (
        <OperatorCard 
          key={operator.id}
          operator={operator}
          onEdit={(updated) => update.mutate({ id: operator.id, data: updated })}
          onDelete={() => deleteOp.mutate(operator.id)}
        />
      ))}
    </div>
  );
}
```

### 2️⃣ GARES (Stations)

```tsx
import { useStations, useCreateStation } from '@/hooks/useResources';

function StationsPage() {
  // GET /stations?city=Ouagadougou
  const { data } = useStations({ city: 'Ouagadougou' });
  
  // POST /stations
  const create = useCreateStation();
  
  const handleCreate = async (formData) => {
    await create.mutate(formData);
  };
  
  return <StationList stations={data?.data} onCreate={handleCreate} />;
}
```

### 3️⃣ UTILISATEURS

```tsx
import { 
  useUsers, 
  useBlockUser, 
  useUpdateUser 
} from '@/hooks/useResources';

function UsersPage() {
  const { data, refetch } = useUsers({ role: 'passenger' });
  const blockUser = useBlockUser();
  
  const handleBlock = async (userId: string) => {
    await blockUser.mutate(userId);
    refetch(); // Recharge la liste
  };
  
  return <UserTable users={data?.data} onBlock={handleBlock} />;
}
```

### 4️⃣ RÉSERVATIONS

```tsx
import { useBookings, useCancelBooking } from '@/hooks/useResources';

function BookingsPage() {
  const { data } = useBookings({ status: 'CONFIRMED' });
  const cancel = useCancelBooking();
  
  const handleCancel = async (id: string, reason: string) => {
    await cancel.mutate({ id, reason });
  };
  
  return <BookingList bookings={data?.data} onCancel={handleCancel} />;
}
```

### 5️⃣ INCIDENTS

```tsx
import { 
  useIncidents, 
  useCreateIncident, 
  useResolveIncident 
} from '@/hooks/useResources';

function IncidentsPage() {
  const { data } = useIncidents({ status: 'open' });
  const create = useCreateIncident();
  const resolve = useResolveIncident();
  
  return (
    <IncidentDashboard 
      incidents={data?.data}
      onCreate={(incident) => create.mutate(incident)}
      onResolve={(id, resolution) => resolve.mutate({ id, resolution })}
    />
  );
}
```

### 6️⃣ DASHBOARD & STATS

```tsx
import { useDashboardStats } from '@/hooks/useResources';

function DashboardHome() {
  const { data, loading } = useDashboardStats();
  
  if (loading) return <Skeleton />;
  
  return (
    <div>
      <StatCard title="Réservations" value={data.bookings.today} />
      <StatCard title="Revenus" value={data.revenue.today} />
      <StatCard title="Utilisateurs" value={data.users.active} />
    </div>
  );
}
```

---

## 🔧 UTILISATION AVANCÉE

### Pagination automatique

```tsx
function PaginatedList() {
  const [page, setPage] = useState(1);
  const { data } = useOperators({ page, limit: 20 });
  
  return (
    <>
      <List items={data?.data} />
      <Pagination 
        current={data?.meta.page} 
        total={data?.meta.total}
        onChange={setPage}
      />
    </>
  );
}
```

### Filtres multiples

```tsx
function FilteredList() {
  const [filters, setFilters] = useState({ 
    status: 'active', 
    city: 'Ouagadougou' 
  });
  
  const { data } = useStations(filters);
  
  return (
    <>
      <FilterBar onFilterChange={setFilters} />
      <StationList stations={data?.data} />
    </>
  );
}
```

### Gestion des erreurs

```tsx
function ErrorHandlingExample() {
  const { data, error, refetch } = useOperators();
  
  if (error) {
    return (
      <ErrorBoundary 
        error={error}
        onRetry={refetch}
        message="Impossible de charger les opérateurs"
      />
    );
  }
  
  return <List data={data?.data} />;
}
```

### Invalidation du cache

```tsx
import { useInvalidateCache } from '@/hooks/useApi';

function AdminPanel() {
  const invalidate = useInvalidateCache();
  
  const handleRefreshAll = () => {
    invalidate(); // Invalide tout le cache
  };
  
  const handleRefreshOperators = () => {
    invalidate('operators'); // Invalide seulement les opérateurs
  };
  
  return (
    <div>
      <Button onClick={handleRefreshAll}>Rafraîchir tout</Button>
      <Button onClick={handleRefreshOperators}>Rafraîchir opérateurs</Button>
    </div>
  );
}
```

---

## 🔐 AUTHENTIFICATION

L'authentification est gérée automatiquement :

```tsx
import { authService, tokenManager } from '@/services/api';

// Connexion
const handleLogin = async (email: string, password: string) => {
  const { token, user } = await authService.login(email, password);
  tokenManager.setToken(token);
  // Le token est automatiquement ajouté à toutes les requêtes
};

// Déconnexion
const handleLogout = () => {
  tokenManager.removeToken();
  // Redirige automatiquement vers /login
};
```

---

## 📊 STRUCTURE D'UNE RÉPONSE API

Toutes les réponses suivent ce format :

```typescript
{
  data: T,                    // Données demandées
  message?: string,           // Message optionnel
  meta?: {                    // Métadonnées de pagination
    total: number,
    page: number,
    pageSize: number
  }
}
```

---

## 🎯 RÈGLES D'OR (ZÉRO DUPLICATION)

### ✅ À FAIRE

1. **Toujours** utiliser les hooks de `/hooks/useResources.ts`
2. **Toujours** utiliser les services de `/services/index.ts`
3. **Jamais** écrire `fetch()` directement dans un composant
4. **Jamais** dupliquer une URL d'endpoint
5. **Toujours** gérer les états loading/error avec les hooks

### ❌ À NE JAMAIS FAIRE

```tsx
// ❌ NE JAMAIS FAIRE ÇA
function BadComponent() {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    fetch('http://localhost:3000/api/operators') // ❌ URL en dur
      .then(res => res.json())
      .then(setData);
  }, []);
}
```

### ✅ À FAIRE À LA PLACE

```tsx
// ✅ TOUJOURS FAIRE ÇA
import { useOperators } from '@/hooks/useResources';

function GoodComponent() {
  const { data, loading, error } = useOperators();
  // Le hook gère tout : URL, fetch, cache, erreurs, loading
}
```

---

## 🔄 MIGRATION D'UN COMPOSANT EXISTANT

### Étape 1 : Identifier les données utilisées

```tsx
// AVANT
const [operators, setOperators] = useState(MOCK_OPERATORS);
```

### Étape 2 : Remplacer par le hook correspondant

```tsx
// APRÈS
import { useOperators } from '@/hooks/useResources';
const { data, loading, error } = useOperators();
const operators = data?.data || [];
```

### Étape 3 : Ajouter les états loading/error

```tsx
if (loading) return <Loader />;
if (error) return <Error message={error.message} />;
```

### Étape 4 : Remplacer les mutations

```tsx
// AVANT
const handleCreate = (newOp) => {
  setOperators([...operators, newOp]);
};

// APRÈS
import { useCreateOperator } from '@/hooks/useResources';
const create = useCreateOperator();
const handleCreate = async (newOp) => {
  await create.mutate(newOp);
};
```

---

## 🎉 AVANTAGES DE CETTE ARCHITECTURE

### ✅ ZÉRO DUPLICATION
- Un seul client HTTP (`/services/api.ts`)
- Un seul fichier d'endpoints (`/services/endpoints.ts`)
- Un seul système de cache
- Un seul système d'erreurs

### ✅ TYPE-SAFE
- TypeScript partout
- Erreurs détectées à la compilation
- Autocomplétion dans l'IDE

### ✅ MAINTENABLE
- Ajouter un endpoint = 3 lignes dans `/services/endpoints.ts`
- Modifier l'URL API = 1 ligne dans `.env.local`
- Debug facile avec les logs centralisés

### ✅ PERFORMANT
- Cache automatique (5 minutes par défaut)
- Retry automatique en cas d'échec
- Timeout configurables
- Invalidation de cache intelligente

### ✅ TESTABLE
- Services isolés et testables unitairement
- Mocks faciles avec `VITE_ENABLE_MOCK_DATA=true`

---

## 📚 RESSOURCES SUPPLÉMENTAIRES

- **Types** : Voir `/types/index.ts`
- **Mock Data** : Voir `/lib/mockData.ts` et `/lib/modelsMockData.ts`
- **Configuration** : Voir `/config/env.ts`
- **Constantes** : Voir `/lib/constants.ts`

---

## 🚨 TROUBLESHOOTING

### Problème : "Request timeout"
**Solution** : Augmentez `API_TIMEOUT` dans `/config/env.ts`

### Problème : "401 Unauthorized"
**Solution** : Le token est expiré ou invalide. Reconnectez-vous.

### Problème : "Cannot read property 'data' of null"
**Solution** : Ajoutez un optional chaining : `data?.data`

### Problème : Les données ne se rafraîchissent pas
**Solution** : Utilisez `refetch()` ou `invalidateCache()`

---

## 📞 CONTACT

Pour toute question sur cette architecture, consultez ce guide ou les commentaires dans le code source.

**Architecture créée pour FasoTravel Admin - Janvier 2026**
