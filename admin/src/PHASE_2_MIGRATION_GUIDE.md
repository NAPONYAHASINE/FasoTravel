# 📘 PHASE 2 - GUIDE DE MIGRATION: Context → Hooks Métier

## 🎯 Objectif
Éliminer la duplication en migrant les composants dashboard du pattern **Context** vers le pattern **Hooks Métier + Services API**.

## ❌ PROBLÈME ACTUEL

### Pattern Context (à éviter)
```typescript
// ❌ MAUVAIS: Duplication de logique dans le Context
export function TransportCompanyManagement() {
  const { transportCompanies, approveCompany, suspendCompany } = useAdminApp();
  
  // Problèmes:
  // 1. Données chargées en mémoire pour tous les composants
  // 2. Pas de cache intelligent
  // 3. Pas de retry automatique
  // 4. Pas d'invalidation de cache
  // 5. Logique métier dupliquée entre Context et Services
}
```

## ✅ SOLUTION: Hooks Métier

### Pattern Hooks Métier (à utiliser)
```typescript
// ✅ BON: Utilisation des hooks métier
import { useOperators, useUpdateOperator } from '../../hooks/useResources';

export function TransportCompanyManagement() {
  // Lecture: avec cache automatique, retry, loading states
  const { data: operators, loading, error, refetch } = useOperators({
    page: 1,
    limit: 10,
    status: 'active'
  });
  
  // Mutation: avec invalidation de cache automatique
  const { mutate: updateOperator, loading: updating } = useUpdateOperator();

  const handleApprove = async (id: string) => {
    await updateOperator({ id, data: { status: 'approved' } });
    // Cache invalidé automatiquement ✅
  };

  // Avantages:
  // ✅ Cache intelligent (évite requêtes dupliquées)
  // ✅ Retry automatique sur erreur
  // ✅ Loading states automatiques
  // ✅ Invalidation de cache automatique
  // ✅ Pas de duplication de logique
}
```

## 📋 HOOKS MÉTIER DISPONIBLES

### `/hooks/useResources.ts`
Tous les hooks métier sont déjà créés et prêts à utiliser:

#### Operators (Sociétés de transport)
- `useOperators(params?, options?)` - Liste
- `useOperator(id, options?)` - Détail
- `useCreateOperator()` - Création
- `useUpdateOperator()` - Modification
- `useDeleteOperator()` - Suppression

#### Stations (Gares)
- `useStations(params?, options?)` - Liste
- `useStation(id, options?)` - Détail
- `useCreateStation()` - Création
- `useUpdateStation()` - Modification
- `useDeleteStation()` - Suppression

#### Users (Utilisateurs)
- `useUsers(params?, options?)` - Liste
- `useUser(id, options?)` - Détail
- `useCreateUser()` - Création
- `useUpdateUser()` - Modification
- `useDeleteUser()` - Suppression
- `useBlockUser()` - Blocage

#### Bookings (Réservations)
- `useBookings(params?, options?)` - Liste
- `useBooking(id, options?)` - Détail
- `useCancelBooking()` - Annulation

#### Trips (Trajets)
- `useTrips(params?, options?)` - Liste
- `useTrip(id, options?)` - Détail
- `useCreateTrip()` - Création
- `useUpdateTrip()` - Modification

#### Payments (Paiements)
- `usePayments(params?, options?)` - Liste
- `usePayment(id, options?)` - Détail
- `useRefundPayment()` - Remboursement

#### Incidents
- `useIncidents(params?, options?)` - Liste
- `useIncident(id, options?)` - Détail
- `useCreateIncident()` - Création
- `useResolveIncident()` - Résolution

#### Support Tickets
- `useTickets(params?, options?)` - Liste
- `useTicket(id, options?)` - Détail
- `useCreateTicket()` - Création

#### Reviews (Avis)
- `useReviews(params?, options?)` - Liste
- `useModerateReview()` - Modération

#### Promotions
- `usePromotions(params?, options?)` - Liste
- `useCreatePromotion()` - Création

#### Advertising (Publicités)
- `useAds(params?, options?)` - Liste
- `useCreateAd()` - Création

#### Integrations
- `useIntegrations(options?)` - Liste
- `useUpdateIntegration()` - Modification

#### Logs
- `useLogs(params?, options?)` - Liste

#### Dashboard
- `useDashboardOverview(options?)` - Vue d'ensemble
- `useDashboardStats(options?)` - Statistiques

#### Notifications
- `useNotifications(params?, options?)` - Liste
- `useMarkNotificationAsRead()` - Marquer comme lu

#### Settings
- `useSettings(options?)` - Configuration
- `useUpdateSettings()` - Modification

## 🔄 PROCESSUS DE MIGRATION

### Étape 1: Identifier les données utilisées
```typescript
// AVANT
const { transportCompanies, approveCompany } = useAdminApp();
```

### Étape 2: Remplacer par les hooks métier
```typescript
// APRÈS
const { data: operators, loading, error } = useOperators();
const { mutate: updateOperator } = useUpdateOperator();
```

### Étape 3: Adapter les handlers
```typescript
// AVANT
const handleApprove = (id: string) => {
  approveCompany(id);
};

// APRÈS
const handleApprove = async (id: string) => {
  try {
    await updateOperator({ id, data: { status: 'approved' } });
    toast.success('Société approuvée');
  } catch (error) {
    toast.error('Erreur lors de l\'approbation');
  }
};
```

### Étape 4: Gérer les états de chargement
```typescript
if (loading) return <div>Chargement...</div>;
if (error) return <div>Erreur: {error.message}</div>;
if (!operators?.data) return <div>Aucune donnée</div>;
```

## 📦 STRUCTURE DES RÉPONSES

### Liste paginée
```typescript
const { data, loading, error } = useOperators({ page: 1, limit: 10 });

// Structure de data:
{
  data: Operator[],     // Les données
  meta: {
    page: 1,
    limit: 10,
    total: 100,
    totalPages: 10
  }
}
```

### Détail unique
```typescript
const { data, loading, error } = useOperator('op-123');

// Structure de data: Operator | null
```

### Mutation
```typescript
const { mutate, loading, error, data } = useUpdateOperator();

// Utilisation:
await mutate({ id: 'op-123', data: { name: 'Nouveau nom' } });
```

## 🎨 PATTERNS RECOMMANDÉS

### Pattern 1: Liste avec filtres
```typescript
export function MyComponent() {
  const [filters, setFilters] = useState({ page: 1, limit: 10, status: 'active' });
  const { data, loading, error, refetch } = useOperators(filters);

  const handleFilterChange = (newFilters) => {
    setFilters({ ...filters, ...newFilters });
    // refetch() appelé automatiquement quand filters change
  };

  return (
    <div>
      <FilterBar onChange={handleFilterChange} />
      {loading ? <Spinner /> : <DataTable data={data?.data} />}
    </div>
  );
}
```

### Pattern 2: Détail avec édition
```typescript
export function MyDetailComponent({ id }: { id: string }) {
  const { data: item, loading } = useOperator(id);
  const { mutate: update, loading: updating } = useUpdateOperator();

  const handleSave = async (formData) => {
    await update({ id, data: formData });
    // Cache invalidé automatiquement
  };

  return (
    <form onSubmit={handleSave}>
      {/* Form fields */}
      <button type="submit" disabled={updating}>
        {updating ? 'Enregistrement...' : 'Enregistrer'}
      </button>
    </form>
  );
}
```

### Pattern 3: Création avec redirection
```typescript
export function MyCreateComponent() {
  const navigate = useNavigate();
  const { mutate: create, loading } = useCreateOperator();

  const handleSubmit = async (formData) => {
    const newItem = await create(formData);
    navigate(`/operators/${newItem.id}`);
  };

  return <form onSubmit={handleSubmit}>{/* Form */}</form>;
}
```

## 🚀 AVANTAGES DE LA MIGRATION

### 1. Performance
- ✅ Cache automatique (pas de requêtes dupliquées)
- ✅ Invalidation intelligente
- ✅ Chargement optimisé

### 2. Résilience
- ✅ Retry automatique sur erreur réseau
- ✅ Gestion centralisée des erreurs
- ✅ Timeout configurable

### 3. Maintenabilité
- ✅ ZÉRO duplication de code
- ✅ Logic métier centralisée dans les services
- ✅ Tests plus faciles

### 4. Developer Experience
- ✅ Types TypeScript automatiques
- ✅ Auto-completion IDE
- ✅ États de chargement automatiques

## 🔧 OPTIONS AVANCÉES

### Désactiver le cache
```typescript
const { data } = useOperators({}, { cacheTime: 0 });
```

### Polling (actualisation automatique)
```typescript
const { data } = useOperators({}, { 
  enabled: true,
  retry: 3,
  onSuccess: (data) => console.log('Données chargées', data)
});
```

### Invalidation manuelle du cache
```typescript
import { useInvalidateCache } from '../../hooks/useApi';

const invalidateCache = useInvalidateCache();

const handleAction = async () => {
  await someAction();
  invalidateCache('operators'); // Invalide toutes les clés contenant 'operators'
};
```

## 📝 CHECKLIST DE MIGRATION

Pour chaque composant à migrer:

- [ ] Identifier les données du Context utilisées
- [ ] Remplacer par les hooks métier correspondants
- [ ] Adapter les handlers pour les mutations
- [ ] Gérer les états loading/error
- [ ] Tester le comportement (cache, invalidation)
- [ ] Supprimer les imports du Context
- [ ] Vérifier les types TypeScript

## 🎯 PRIORITÉS DE MIGRATION

### Phase 2A (Haute priorité)
1. ✅ TransportCompanyManagement (exemple fourni)
2. StationManagement
3. UserManagement
4. BookingManagement

### Phase 2B (Moyenne priorité)
5. PaymentManagement
6. IncidentManagement
7. SupportCenter
8. TicketManagement

### Phase 2C (Basse priorité)
9. ReviewManagement
10. PromotionManagement
11. AdvertisingManagement
12. Integrations

## 🔗 RESSOURCES

- `/services/index.ts` - Tous les services API
- `/services/endpoints.ts` - Tous les endpoints
- `/hooks/useApi.ts` - Hook générique
- `/hooks/useResources.ts` - Hooks métier spécialisés
- `/shared/services/apiClient.ts` - Client HTTP
- `/PHASE_2_REFACTORED_EXAMPLE.tsx` - Exemple complet de migration

---

**🎉 Cette migration nous permettra d'atteindre 100% de conformité avec ZÉRO duplication !**
