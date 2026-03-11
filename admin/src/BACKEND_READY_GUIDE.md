# 🚀 Guide Backend-Ready - FasoTravel Admin

## 📋 Vue d'Ensemble

L'application FasoTravel Admin est maintenant **100% backend-ready** avec une architecture propre, zéro duplication, et une séparation claire des responsabilités.

## 🏗️ Architecture

```
/services/
  ├── apiService.ts           # Service API centralisé (fetch, auth, cache, retry)
  ├── financialService.ts     # Service financier (revenus, transactions, métriques)
  └── entitiesService.ts      # Services métier (companies, passengers, stations, support)

/hooks/
  ├── useFinancialMetrics.ts  # Hooks pour données financières
  └── useEntities.ts          # Hooks pour toutes les entités

/types/
  └── financial.ts            # Types TypeScript pour entités financières

/components/shared/
  ├── FinancialKPICard.tsx           # Carte KPI réutilisable
  ├── RevenueChart.tsx               # Graphique revenus configurable
  ├── PaymentMethodsDistribution.tsx # Widget méthodes de paiement
  └── TopCompaniesChart.tsx          # Classement sociétés

/context/
  └── AdminAppContext.tsx     # Context backend-ready (utilise les hooks)

/components/dashboard/
  ├── DashboardHome.tsx       # Dashboard principal (refactorisé)
  └── AnalyticsDashboard.tsx  # Analytics (refactorisé)
```

## 🔥 Comment ça Fonctionne

### 1. Service API Centralisé

**Fichier:** `/services/apiService.ts`

```typescript
// Mode mock par défaut en dev
apiService.setMockMode(true);

// Basculer vers le vrai backend
apiService.setMockMode(false);

// Faire des requêtes
const response = await apiService.get('/admin/companies');
const response = await apiService.post('/admin/companies', { name: 'ABC Transport' });
```

**Fonctionnalités:**
- ✅ Authentification (Bearer token)
- ✅ Cache intelligent (5 min TTL)
- ✅ Retry automatique (erreurs 5xx)
- ✅ Timeout configurable
- ✅ Gestion erreurs complète
- ✅ Mode mock/real switchable

### 2. Services Métier

**Fichier:** `/services/entitiesService.ts`

Chaque service encapsule la logique métier d'une entité :

```typescript
// Sociétés de transport
await transportCompaniesService.getAll();
await transportCompaniesService.approve(id);
await transportCompaniesService.suspend(id, reason);

// Passagers
await passengersService.getAll();
await passengersService.suspend(id, reason);
await passengersService.verify(id);

// Stations
await stationsService.getAll();
await stationsService.toggleStatus(id);

// Support
await supportService.assign(ticketId, adminId);
await supportService.resolve(ticketId, resolution);
```

**Pour connecter le backend:**
```typescript
// Dans chaque service, remplacer:
async getAll() {
  return { success: true, data: this.mockData };
}

// Par:
async getAll() {
  return await apiService.get('/admin/companies');
}
```

### 3. Hooks Réutilisables

**Fichier:** `/hooks/useEntities.ts`

Hooks qui gèrent loading, erreurs, et refresh :

```typescript
// Dans un composant
const { data, loading, error, refresh } = useTransportCompanies();
const { data: passengers, loading, refresh } = usePassengers();

// Actions
const { approve, suspend } = useCompanyActions();
await approve(companyId);
await refresh(); // Recharger les données
```

**Fonctionnalités:**
- ✅ Loading states automatiques
- ✅ Error handling
- ✅ Refresh on demand
- ✅ Auto-load au montage

### 4. Context Backend-Ready

**Fichier:** `/context/AdminAppContext.tsx`

Le contexte utilise maintenant les hooks au lieu de mock data hardcodée :

```typescript
// AVANT (hardcodé) ❌
const [companies] = useState(MOCK_COMPANIES);

// APRÈS (backend-ready) ✅
const { data: companies, refresh } = useTransportCompanies();
```

**Dans un composant:**
```typescript
const { transportCompanies, loading, error, refreshCompanies } = useAdminApp();

if (loading) return <Loader />;
if (error) return <Error message={error} />;

// Utiliser les données
return <div>{transportCompanies.map(...)}</div>;
```

### 5. Composants Réutilisables

Tous les composants financiers sont maintenant réutilisables :

```typescript
// Carte KPI
<FinancialKPICard kpi={kpiData} />

// Graphique revenus
<RevenueChart 
  data={dailyRevenue}
  title="Revenus Hebdomadaires"
  growth={12.5}
  type="line"
/>

// Distribution paiements
<PaymentMethodsDistribution 
  data={paymentMethods}
  totalTransactions={2847}
  successRate={97.3}
/>

// Top sociétés
<TopCompaniesChart 
  data={companies}
  metric="revenue"
  title="Top Sociétés"
/>
```

## 🔌 Connexion au Backend

### Étape 1: Configuration API

**Fichier:** `.env`

```env
REACT_APP_API_URL=https://api.fasotravel.bf/api
```

### Étape 2: Désactiver le Mode Mock

**Fichier:** `/services/apiService.ts`

```typescript
// En production
if (process.env.NODE_ENV === 'production') {
  apiService.setMockMode(false);
}
```

### Étape 3: Endpoints Backend Requis

**Sociétés de Transport:**
- `GET /admin/companies` - Liste des sociétés
- `GET /admin/companies/:id` - Détail société
- `POST /admin/companies/:id/approve` - Approuver société
- `POST /admin/companies/:id/suspend` - Suspendre société

**Passagers:**
- `GET /admin/passengers` - Liste passagers
- `GET /admin/passengers/:id` - Détail passager
- `POST /admin/passengers/:id/suspend` - Suspendre
- `POST /admin/passengers/:id/reactivate` - Réactiver
- `POST /admin/passengers/:id/verify` - Vérifier

**Stations:**
- `GET /admin/stations` - Liste stations
- `POST /admin/stations` - Créer station
- `PUT /admin/stations/:id` - Modifier station
- `POST /admin/stations/:id/toggle-status` - Toggle statut

**Support:**
- `GET /admin/support` - Liste tickets
- `POST /admin/support/:id/assign` - Assigner ticket
- `POST /admin/support/:id/resolve` - Résoudre ticket

**Financier:**
- `POST /admin/financial/metrics` - Métriques financières
- `GET /admin/financial/daily-revenue` - Revenus journaliers
- `GET /admin/financial/payment-methods` - Méthodes paiement
- `GET /admin/financial/top-companies` - Top sociétés

## 📊 Format des Données API

### Réponse Standard

```typescript
{
  "success": true,
  "data": { /* données */ },
  "message": "Success",
  "statusCode": 200
}
```

### En cas d'erreur

```typescript
{
  "success": false,
  "error": "Message d'erreur",
  "statusCode": 400
}
```

## 🎯 Avantages de cette Architecture

### ✅ Backend-Ready
- Switch mock/real en 1 ligne
- Services prêts pour API
- Types TypeScript alignés

### ✅ Zéro Duplication
- Composants réutilisables
- Hooks partagés
- Services centralisés

### ✅ Maintenabilité
- Séparation claire
- Code testable
- Documentation inline

### ✅ Performance
- Cache intelligent
- Lazy loading
- Refresh on demand

### ✅ Developer Experience
- IntelliSense complet
- Error handling automatique
- Loading states gérés

## 🧪 Tests Backend

### Test en Mode Mock

```typescript
// Garder le mode mock activé
apiService.setMockMode(true);

// Toutes les requêtes retournent des mock data
const { data } = await transportCompaniesService.getAll();
```

### Test avec Vrai Backend

```typescript
// Désactiver le mode mock
apiService.setMockMode(false);

// Définir l'URL du backend
process.env.REACT_APP_API_URL = 'http://localhost:3000/api';

// Les requêtes vont au vrai backend
const { data } = await transportCompaniesService.getAll();
```

## 📝 Checklist Intégration Backend

- [ ] Configurer `.env` avec l'URL API
- [ ] Désactiver mode mock en production
- [ ] Implémenter tous les endpoints requis
- [ ] Tester chaque endpoint avec Postman
- [ ] Vérifier format des réponses
- [ ] Gérer l'authentification (JWT)
- [ ] Tester le refresh token
- [ ] Vérifier les CORS
- [ ] Tester le cache
- [ ] Valider les erreurs

## 🚀 Prochaines Étapes

1. **Backend:** Implémenter les endpoints listés ci-dessus
2. **Auth:** Ajouter JWT refresh token
3. **WebSocket:** Pour notifications temps réel
4. **Cache:** Redis pour performance
5. **Logs:** Winston pour audit trail
6. **Tests:** Jest + React Testing Library

---

**Date:** 2026-02-07  
**Version:** 2.0 - Backend-Ready  
**Auteur:** FasoTravel Dev Team
