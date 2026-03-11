# ✅ CHECKLIST DE MIGRATION - Composants vers API

## 🎯 Objectif

Migrer progressivement tous les composants de FasoTravel Admin pour utiliser la nouvelle architecture API.

---

## 📊 ÉTAT DE LA MIGRATION

### Légende
- ⏳ **À faire** - Composant non migré
- 🔄 **En cours** - Migration en cours
- ✅ **Terminé** - Utilise la nouvelle architecture API

---

## 🔐 1. AUTHENTIFICATION

### `/components/Login.tsx`
- [ ] ⏳ État : À faire
- [ ] Remplacer le mock login par `authService.login()`
- [ ] Utiliser `tokenManager` pour stocker le token
- [ ] Gérer les erreurs de connexion
- [ ] Ajouter un loading state

**Code à ajouter :**
```tsx
import { authService, tokenManager } from '@/services/api';

const handleLogin = async (email: string, password: string) => {
  try {
    const { token, user } = await authService.login(email, password);
    tokenManager.setToken(token);
    // Rediriger vers le dashboard
  } catch (error) {
    toast.error(error.message);
  }
};
```

---

## 📊 2. DASHBOARD

### `/components/dashboard/DashboardHome.tsx`
- [ ] ⏳ État : À faire
- [ ] Remplacer `calculateDashboardStats` par `useDashboardStats()`
- [ ] Ajouter loading states pour les statistiques
- [ ] Gérer les erreurs de chargement

**Code à ajouter :**
```tsx
import { useDashboardStats } from '@/hooks/useResources';

const { data: stats, loading, error } = useDashboardStats();
```

### `/components/dashboard/AnalyticsDashboard.tsx`
- [ ] ⏳ État : À faire
- [ ] Utiliser `useDashboardOverview()` pour les analytics

---

## 🚌 3. OPÉRATEURS

### `/components/dashboard/OperatorManagement.tsx`
- [ ] ⏳ État : À faire
- [ ] Remplacer `useState(MODEL_OPERATORS)` par `useOperators()`
- [ ] Remplacer `setOperators` par `useCreateOperator()`
- [ ] Remplacer les mutations par `useUpdateOperator()` et `useDeleteOperator()`
- [ ] Ajouter pagination avec `useOperators({ page, limit })`
- [ ] Ajouter filtres avec `useOperators({ status: 'active' })`

**Code à remplacer :**
```tsx
// AVANT
const [operators, setOperators] = useState(MODEL_OPERATORS);

// APRÈS
import { useOperators, useCreateOperator } from '@/hooks/useResources';
const { data, loading, error } = useOperators();
const create = useCreateOperator();
```

---

## 🏛️ 4. GARES

### `/components/dashboard/StationManagement.tsx`
- [ ] ⏳ État : À faire
- [ ] Remplacer `useState(MODEL_STATIONS)` par `useStations()`
- [ ] Remplacer les mutations par les hooks
- [ ] Ajouter filtres par ville

**Code à remplacer :**
```tsx
// AVANT
const [stations, setStations] = useState(MODEL_STATIONS);

// APRÈS
import { useStations, useCreateStation } from '@/hooks/useResources';
const { data, loading } = useStations({ city: selectedCity });
```

---

## 👥 5. UTILISATEURS

### `/components/dashboard/UserManagement.tsx`
- [ ] ⏳ État : À faire
- [ ] Remplacer `useState(MOCK_USERS)` par `useUsers()`
- [ ] Implémenter `useBlockUser()` pour bloquer les utilisateurs
- [ ] Ajouter filtres par rôle

**Code à remplacer :**
```tsx
// AVANT
const [users, setUsers] = useState(MOCK_USERS);

// APRÈS
import { useUsers, useBlockUser } from '@/hooks/useResources';
const { data } = useUsers({ role: selectedRole });
const block = useBlockUser();
```

---

## 🎫 6. RÉSERVATIONS

### `/components/dashboard/BookingManagement.tsx`
- [ ] ⏳ État : À faire
- [ ] Remplacer `useState(MOCK_BOOKINGS)` par `useBookings()`
- [ ] Implémenter `useCancelBooking()` pour annuler les réservations
- [ ] Ajouter filtres par statut et date

**Code à remplacer :**
```tsx
// AVANT
const [bookings, setBookings] = useState(MOCK_BOOKINGS);

// APRÈS
import { useBookings, useCancelBooking } from '@/hooks/useResources';
const { data } = useBookings({ status: 'CONFIRMED' });
const cancel = useCancelBooking();
```

### `/components/dashboard/TicketManagement.tsx`
- [ ] ⏳ État : À faire
- [ ] Utiliser `useTickets()` si c'est pour les tickets de transport
- [ ] OU utiliser les données de `useBookings()` si c'est lié aux réservations

---

## 🚗 7. TRAJETS

### `/components/dashboard/TripManagement.tsx`
- [ ] ⏳ État : À faire
- [ ] Remplacer `useState(MODEL_TRIPS)` par `useTrips()`
- [ ] Implémenter `useCreateTrip()` et `useUpdateTrip()`
- [ ] Ajouter filtres par opérateur et date

**Code à remplacer :**
```tsx
// AVANT
const [trips, setTrips] = useState(MODEL_TRIPS);

// APRÈS
import { useTrips, useCreateTrip } from '@/hooks/useResources';
const { data } = useTrips({ operatorId: selectedOperator });
```

---

## 💳 8. PAIEMENTS

### `/components/dashboard/PaymentManagement.tsx`
- [ ] ⏳ État : À faire
- [ ] Remplacer `useState(MOCK_PAYMENTS)` par `usePayments()`
- [ ] Implémenter `useRefundPayment()` pour les remboursements
- [ ] Ajouter filtres par statut et méthode de paiement

**Code à remplacer :**
```tsx
// AVANT
const [payments, setPayments] = useState(MOCK_PAYMENTS);

// APRÈS
import { usePayments, useRefundPayment } from '@/hooks/useResources';
const { data } = usePayments({ status: 'COMPLETED' });
```

---

## 🚨 9. INCIDENTS

### `/components/dashboard/IncidentManagement.tsx`
- [ ] ⏳ État : À faire
- [ ] Remplacer `useState(MOCK_INCIDENTS)` par `useIncidents()`
- [ ] Implémenter `useCreateIncident()` et `useResolveIncident()`
- [ ] Ajouter filtres par statut et sévérité

**Code à remplacer :**
```tsx
// AVANT
const [incidents, setIncidents] = useState(MOCK_INCIDENTS);

// APRÈS
import { useIncidents, useResolveIncident } from '@/hooks/useResources';
const { data } = useIncidents({ status: 'open' });
```

---

## 🎧 10. SUPPORT

### `/components/dashboard/SupportCenter.tsx`
- [ ] ⏳ État : À faire
- [ ] Remplacer `useState(MOCK_SUPPORT_TICKETS)` par `useTickets()`
- [ ] Implémenter `useCreateTicket()` pour créer des tickets
- [ ] Ajouter filtres par statut et priorité

**Code à remplacer :**
```tsx
// AVANT
const [tickets, setTickets] = useState(MOCK_SUPPORT_TICKETS);

// APRÈS
import { useTickets, useCreateTicket } from '@/hooks/useResources';
const { data } = useTickets({ status: 'open' });
```

---

## ⭐ 11. AVIS

### `/components/dashboard/ReviewManagement.tsx`
- [ ] ⏳ État : À faire
- [ ] Remplacer `useState(MOCK_REVIEWS)` par `useReviews()`
- [ ] Implémenter `useModerateReview()` pour modérer les avis
- [ ] Ajouter filtres par opérateur et note

**Code à remplacer :**
```tsx
// AVANT
const [reviews, setReviews] = useState(MOCK_REVIEWS);

// APRÈS
import { useReviews, useModerateReview } from '@/hooks/useResources';
const { data } = useReviews({ operatorId: selectedOperator });
```

---

## 🎁 12. PROMOTIONS

### `/components/dashboard/PromotionManagement.tsx`
- [ ] ⏳ État : À faire
- [ ] Remplacer `useState(MOCK_PROMOTIONS)` par `usePromotions()`
- [ ] Implémenter `useCreatePromotion()` pour créer des promotions
- [ ] Ajouter filtres par statut et date

**Code à remplacer :**
```tsx
// AVANT
const [promotions, setPromotions] = useState(MOCK_PROMOTIONS);

// APRÈS
import { usePromotions, useCreatePromotion } from '@/hooks/useResources';
const { data } = usePromotions({ status: 'active' });
```

---

## 📢 13. PUBLICITÉS

### `/components/dashboard/AdvertisingManagement.tsx`
- [ ] ⏳ État : À faire
- [ ] Remplacer `useState(MOCK_ADVERTISEMENTS)` par `useAds()`
- [ ] Implémenter `useCreateAd()` pour créer des publicités
- [ ] Ajouter gestion des statistiques avec `adService.getStats()`

**Code à remplacer :**
```tsx
// AVANT
const [ads, setAds] = useState(MOCK_ADVERTISEMENTS);

// APRÈS
import { useAds, useCreateAd } from '@/hooks/useResources';
const { data } = useAds({ status: 'active' });
```

---

## 🔌 14. INTÉGRATIONS

### `/components/dashboard/Integrations.tsx`
- [ ] ⏳ État : À faire
- [ ] Remplacer `useState(MOCK_INTEGRATIONS)` par `useIntegrations()`
- [ ] Implémenter `useUpdateIntegration()` pour modifier les configs
- [ ] Ajouter test de connexion avec `integrationService.testConnection()`

**Code à remplacer :**
```tsx
// AVANT
const [integrations, setIntegrations] = useState(MOCK_INTEGRATIONS);

// APRÈS
import { useIntegrations, useUpdateIntegration } from '@/hooks/useResources';
const { data } = useIntegrations();
```

---

## 📊 15. LOGS SYSTÈME

### `/components/dashboard/SystemLogs.tsx`
- [ ] ⏳ État : À faire
- [ ] Remplacer `useState(MOCK_SYSTEM_LOGS)` par `useLogs()`
- [ ] Ajouter filtres par niveau et catégorie
- [ ] Implémenter export avec `logService.export()`

**Code à remplacer :**
```tsx
// AVANT
const [logs, setLogs] = useState(MOCK_SYSTEM_LOGS);

// APRÈS
import { useLogs } from '@/hooks/useResources';
const { data } = useLogs({ level: 'error', category: 'payment' });
```

---

## 🗺️ 16. CARTE TEMPS RÉEL

### `/components/dashboard/GlobalMap.tsx`
- [ ] ⏳ État : À faire
- [ ] Utiliser `useDashboardOverview()` pour les données de la carte
- [ ] Ajouter WebSocket pour les mises à jour en temps réel (futur)

---

## 🔔 17. NOTIFICATIONS

### `/components/dashboard/NotificationCenter.tsx`
- [ ] ⏳ État : À faire
- [ ] Remplacer `useState(MOCK_NOTIFICATIONS)` par `useNotifications()`
- [ ] Implémenter `useMarkNotificationAsRead()`
- [ ] Ajouter badge de compteur non lues

**Code à remplacer :**
```tsx
// AVANT
const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

// APRÈS
import { useNotifications, useMarkNotificationAsRead } from '@/hooks/useResources';
const { data } = useNotifications({ read: false });
```

---

## ⚙️ 18. PARAMÈTRES

### `/components/dashboard/Settings.tsx`
- [ ] ⏳ État : À faire
- [ ] Utiliser `useSettings()` pour charger les paramètres
- [ ] Implémenter `useUpdateSettings()` pour sauvegarder
- [ ] Ajouter `settingsService.uploadLogo()` pour le logo
- [ ] Ajouter `settingsService.exportData()` pour l'export

**Code à remplacer :**
```tsx
// AVANT
const [companySettings, setCompanySettings] = useState({ ... });

// APRÈS
import { useSettings, useUpdateSettings } from '@/hooks/useResources';
const { data: settings } = useSettings();
const update = useUpdateSettings();
```

---

## 🎨 19. SERVICES

### `/components/dashboard/ServiceManagement.tsx`
- [ ] ⏳ État : À faire
- [ ] Remplacer `useState(MOCK_SERVICES)` par un hook approprié
- [ ] (Note : Vérifier si c'est pour les services des opérateurs)

---

## 📊 20. POLITIQUES

### `/components/dashboard/PolicyManagement.tsx`
- [ ] ⏳ État : À faire
- [ ] Remplacer `useState(MOCK_POLICIES)` par un hook approprié

---

## 👤 21. SESSIONS

### `/components/dashboard/SessionManagement.tsx`
- [ ] ⏳ État : À faire
- [ ] Remplacer `useState(MOCK_SESSIONS)` par un hook approprié

---

## 📈 22. STATISTIQUES

### Composants utilisant `useStats()`
- [ ] ⏳ `/hooks/useStats.ts` - À migrer vers `useDashboardStats()`

---

## 🎯 PRIORITÉS DE MIGRATION

### 🔥 Priorité HAUTE (Commencer ici)
1. ✅ Login.tsx - Authentification d'abord
2. ✅ DashboardHome.tsx - Page principale
3. ✅ OperatorManagement.tsx - Fonctionnalité clé
4. ✅ StationManagement.tsx - Fonctionnalité clé

### 🟡 Priorité MOYENNE
5. ✅ BookingManagement.tsx
6. ✅ TripManagement.tsx
7. ✅ PaymentManagement.tsx
8. ✅ UserManagement.tsx

### 🟢 Priorité BASSE (Finir par ici)
9. ✅ IncidentManagement.tsx
10. ✅ SupportCenter.tsx
11. ✅ ReviewManagement.tsx
12. ✅ PromotionManagement.tsx
13. ✅ AdvertisingManagement.tsx
14. ✅ Integrations.tsx
15. ✅ SystemLogs.tsx
16. ✅ Settings.tsx

---

## 📝 TEMPLATE DE MIGRATION

Pour chaque composant, suivez ce template :

```tsx
// ==========================================
// AVANT (Données en dur)
// ==========================================
import { useState } from 'react';
import { MOCK_DATA } from '@/lib/mockData';

function MyComponent() {
  const [data, setData] = useState(MOCK_DATA);
  
  const handleCreate = (newItem) => {
    setData([...data, newItem]);
  };
  
  return <div>{data.map(item => ...)}</div>;
}

// ==========================================
// APRÈS (API Ready)
// ==========================================
import { useResource, useCreateResource } from '@/hooks/useResources';
import { toast } from 'sonner@2.0.3';

function MyComponent() {
  // 1. Remplacer useState par le hook
  const { data, loading, error, refetch } = useResource();
  const create = useCreateResource();
  
  // 2. Adapter les handlers
  const handleCreate = async (newItem) => {
    try {
      await create.mutate(newItem);
      toast.success('Créé avec succès');
    } catch (error) {
      toast.error(error.message);
    }
  };
  
  // 3. Ajouter les états loading/error
  if (loading) return <Loader />;
  if (error) return <Error error={error} onRetry={refetch} />;
  
  // 4. Adapter le rendu
  const items = data?.data || [];
  return <div>{items.map(item => ...)}</div>;
}
```

---

## ✅ CHECKLIST PAR COMPOSANT

Pour chaque migration, vérifier :

- [ ] ✅ Import des bons hooks depuis `/hooks/useResources`
- [ ] ✅ Remplacement de `useState` par `useResource()`
- [ ] ✅ Ajout de `loading` state avec un loader
- [ ] ✅ Ajout de `error` state avec gestion d'erreur
- [ ] ✅ Ajout de `refetch()` si nécessaire
- [ ] ✅ Remplacement des mutations par les hooks appropriés
- [ ] ✅ Ajout de `toast` pour le feedback utilisateur
- [ ] ✅ Test en mode mock (`VITE_ENABLE_MOCK_DATA=true`)
- [ ] ✅ Test avec erreurs simulées
- [ ] ✅ Vérification TypeScript (pas d'erreurs)
- [ ] ✅ Vérification console (pas d'erreurs ou warnings)

---

## 📊 PROGRESSION GLOBALE

```
Composants migrés : 0 / 22 (0%)
□□□□□□□□□□□□□□□□□□□□□□ 0%
```

**À mettre à jour après chaque migration !**

---

## 🚀 COMMANDES UTILES

### Test en mode mock
```bash
# Dans .env.local
VITE_ENABLE_MOCK_DATA=true
```

### Test avec API réelle
```bash
# Dans .env.local
VITE_ENABLE_MOCK_DATA=false
VITE_API_BASE_URL=http://localhost:3000/api
```

### Vérifier les erreurs TypeScript
```bash
npm run type-check
```

### Lancer l'application
```bash
npm run dev
```

---

## 📞 AIDE

- 📖 Guide complet : `/ARCHITECTURE_API_GUIDE.md`
- 📚 Référence hooks : `/HOOKS_REFERENCE.md`
- 💻 Exemple concret : `/examples/OperatorsExample.tsx`
- 🎯 Architecture : `/REFACTORISATION_API_COMPLETE.md`

---

**🎉 Bonne migration ! N'oubliez pas : ZÉRO DUPLICATION !**
