# 📚 RÉFÉRENCE RAPIDE DES HOOKS API

## 🎯 Quick Reference - Tous les hooks disponibles

---

## 🔐 AUTHENTIFICATION

```tsx
import { authService, tokenManager } from '@/services/api';

// Login
const { token, user } = await authService.login(email, password);
tokenManager.setToken(token);

// Logout
tokenManager.removeToken();

// Get current user
const user = await authService.getMe();

// Reset password
await authService.resetPassword(email);
```

---

## 🚌 OPÉRATEURS (Sociétés de transport)

```tsx
import { 
  useOperators, 
  useOperator, 
  useCreateOperator, 
  useUpdateOperator, 
  useDeleteOperator 
} from '@/hooks/useResources';

// GET /operators
const { data, loading, error, refetch } = useOperators({ 
  page: 1, 
  limit: 20, 
  status: 'active' 
});

// GET /operators/:id
const { data, loading, error } = useOperator('op-123');

// POST /operators
const create = useCreateOperator();
await create.mutate({ name: '...', contact_email: '...' });

// PUT /operators/:id
const update = useUpdateOperator();
await update.mutate({ id: 'op-123', data: { name: 'New Name' } });

// DELETE /operators/:id
const deleteOp = useDeleteOperator();
await deleteOp.mutate('op-123');
```

---

## 🏛️ GARES (Stations)

```tsx
import { 
  useStations, 
  useStation, 
  useCreateStation, 
  useUpdateStation, 
  useDeleteStation 
} from '@/hooks/useResources';

// GET /stations
const { data } = useStations({ city: 'Ouagadougou' });

// GET /stations/:id
const { data } = useStation('st-123');

// POST /stations
const create = useCreateStation();
await create.mutate({ name: '...', city: '...', location: {...} });

// PUT /stations/:id
const update = useUpdateStation();
await update.mutate({ id: 'st-123', data: { name: 'New Name' } });

// DELETE /stations/:id
const deleteStation = useDeleteStation();
await deleteStation.mutate('st-123');
```

---

## 👥 UTILISATEURS

```tsx
import { 
  useUsers, 
  useUser, 
  useCreateUser, 
  useUpdateUser, 
  useDeleteUser, 
  useBlockUser 
} from '@/hooks/useResources';

// GET /users
const { data } = useUsers({ role: 'passenger' });

// GET /users/:id
const { data } = useUser('user-123');

// POST /users
const create = useCreateUser();
await create.mutate({ email: '...', role: 'passenger' });

// PUT /users/:id
const update = useUpdateUser();
await update.mutate({ id: 'user-123', data: { email: 'new@email.com' } });

// DELETE /users/:id
const deleteUser = useDeleteUser();
await deleteUser.mutate('user-123');

// PATCH /users/:id/block
const block = useBlockUser();
await block.mutate('user-123');
```

---

## 🎫 RÉSERVATIONS

```tsx
import { 
  useBookings, 
  useBooking, 
  useCancelBooking 
} from '@/hooks/useResources';

// GET /bookings
const { data } = useBookings({ status: 'CONFIRMED' });

// GET /bookings/:id
const { data } = useBooking('bk-123');

// PATCH /bookings/:id/cancel
const cancel = useCancelBooking();
await cancel.mutate({ 
  id: 'bk-123', 
  reason: 'Client request' 
});
```

---

## 🚗 TRAJETS

```tsx
import { 
  useTrips, 
  useTrip, 
  useCreateTrip, 
  useUpdateTrip 
} from '@/hooks/useResources';

// GET /trips
const { data } = useTrips({ operatorId: 'op-123' });

// GET /trips/:id
const { data } = useTrip('trip-123');

// POST /trips
const create = useCreateTrip();
await create.mutate({ 
  operator_id: 'op-123',
  route_id: 'route-123',
  departure_time: '2026-01-20T08:00:00Z'
});

// PUT /trips/:id
const update = useUpdateTrip();
await update.mutate({ 
  id: 'trip-123', 
  data: { departure_time: '2026-01-20T09:00:00Z' } 
});
```

---

## 💳 PAIEMENTS

```tsx
import { 
  usePayments, 
  usePayment, 
  useRefundPayment 
} from '@/hooks/useResources';

// GET /payments
const { data } = usePayments({ status: 'COMPLETED' });

// GET /payments/:id
const { data } = usePayment('pay-123');

// POST /payments/:id/refund
const refund = useRefundPayment();
await refund.mutate({ 
  id: 'pay-123', 
  reason: 'Trip cancelled' 
});
```

---

## 🚨 INCIDENTS

```tsx
import { 
  useIncidents, 
  useIncident, 
  useCreateIncident, 
  useResolveIncident 
} from '@/hooks/useResources';

// GET /incidents
const { data } = useIncidents({ status: 'open' });

// GET /incidents/:id
const { data } = useIncident('inc-123');

// POST /incidents
const create = useCreateIncident();
await create.mutate({ 
  title: 'Server down',
  description: '...',
  severity: 'critical'
});

// PATCH /incidents/:id/resolve
const resolve = useResolveIncident();
await resolve.mutate({ 
  id: 'inc-123', 
  resolution: 'Fixed by restarting server' 
});
```

---

## 🎧 SUPPORT (Tickets)

```tsx
import { 
  useTickets, 
  useTicket, 
  useCreateTicket 
} from '@/hooks/useResources';

// GET /tickets
const { data } = useTickets({ status: 'open' });

// GET /tickets/:id
const { data } = useTicket('ticket-123');

// POST /tickets
const create = useCreateTicket();
await create.mutate({ 
  subject: 'Cannot book ticket',
  description: '...',
  priority: 'high'
});
```

---

## ⭐ AVIS (Reviews)

```tsx
import { 
  useReviews, 
  useModerateReview 
} from '@/hooks/useResources';

// GET /reviews
const { data } = useReviews({ operatorId: 'op-123' });

// PATCH /reviews/:id/moderate
const moderate = useModerateReview();
await moderate.mutate({ 
  id: 'rev-123', 
  approved: true 
});
```

---

## 🎁 PROMOTIONS

```tsx
import { 
  usePromotions, 
  useCreatePromotion 
} from '@/hooks/useResources';

// GET /promotions
const { data } = usePromotions({ status: 'active' });

// POST /promotions
const create = useCreatePromotion();
await create.mutate({ 
  code: 'SUMMER2026',
  discount_percent: 20,
  valid_until: '2026-08-31'
});
```

---

## 📢 PUBLICITÉS

```tsx
import { 
  useAds, 
  useCreateAd 
} from '@/hooks/useResources';

// GET /ads
const { data } = useAds({ status: 'active' });

// POST /ads
const create = useCreateAd();
await create.mutate({ 
  title: 'Summer Sale',
  image_url: '...',
  target_url: '...',
  placement: 'home_banner'
});
```

---

## 🔌 INTÉGRATIONS

```tsx
import { 
  useIntegrations, 
  useUpdateIntegration 
} from '@/hooks/useResources';

// GET /integrations
const { data } = useIntegrations();

// PUT /integrations/:id
const update = useUpdateIntegration();
await update.mutate({ 
  id: 'orange-money',
  data: { config: { apiKey: '...' } }
});
```

---

## 📊 LOGS SYSTÈME

```tsx
import { useLogs } from '@/hooks/useResources';

// GET /logs
const { data } = useLogs({ 
  level: 'error',
  category: 'payment'
});
```

---

## 📈 DASHBOARD & STATISTIQUES

```tsx
import { 
  useDashboardOverview, 
  useDashboardStats 
} from '@/hooks/useResources';

// GET /dashboard/overview
const { data } = useDashboardOverview();

// GET /dashboard/stats
const { data } = useDashboardStats();
```

---

## 🔔 NOTIFICATIONS

```tsx
import { 
  useNotifications, 
  useMarkNotificationAsRead 
} from '@/hooks/useResources';

// GET /notifications
const { data } = useNotifications({ read: false });

// PATCH /notifications/:id/read
const markAsRead = useMarkNotificationAsRead();
await markAsRead.mutate('notif-123');
```

---

## ⚙️ PARAMÈTRES

```tsx
import { 
  useSettings, 
  useUpdateSettings 
} from '@/hooks/useResources';

// GET /settings
const { data } = useSettings();

// PUT /settings
const update = useUpdateSettings();
await update.mutate({ 
  companyName: 'FasoTravel',
  email: 'contact@fasotravel.bf'
});
```

---

## 🛠️ UTILITAIRES

### Invalidation du cache

```tsx
import { useInvalidateCache } from '@/hooks/useApi';

const invalidate = useInvalidateCache();

// Invalider tout le cache
invalidate();

// Invalider seulement les opérateurs
invalidate('operators');

// Invalider seulement une station spécifique
invalidate('stations/st-123');
```

### Gestion des erreurs

```tsx
const { data, loading, error, refetch } = useOperators();

if (error) {
  console.error(error.message);
  console.error(error.status); // Code HTTP
  console.error(error.data);   // Données de l'erreur
}

// Réessayer
refetch();
```

### États de chargement

```tsx
const { loading, data } = useOperators();

if (loading) {
  return <Loader />;
}

return <List data={data?.data} />;
```

### Mutations avec feedback

```tsx
const create = useCreateOperator();

const handleCreate = async (formData) => {
  try {
    await create.mutate(formData);
    toast.success('Créé avec succès');
  } catch (error) {
    toast.error(error.message);
  }
};

// Vérifier l'état de la mutation
console.log(create.loading); // true pendant l'appel
console.log(create.error);   // Erreur si échec
console.log(create.data);    // Données retournées
```

---

## 📦 IMPORTS COURANTS

```tsx
// Services
import { authService, tokenManager } from '@/services/api';
import { ENDPOINTS } from '@/services/endpoints';
import { operatorService, stationService, ... } from '@/services';

// Hooks génériques
import { useApi, useMutation, useInvalidateCache } from '@/hooks/useApi';

// Hooks spécialisés
import { 
  useOperators,
  useStations,
  useUsers,
  useBookings,
  useTrips,
  // ... tous les autres
} from '@/hooks/useResources';

// Configuration
import { ENV } from '@/config/env';
```

---

## 🎯 PATTERN RECOMMANDÉ

```tsx
import { useResource, useCreateResource } from '@/hooks/useResources';
import { toast } from 'sonner@2.0.3';

function MyComponent() {
  // 1. Lecture des données
  const { data, loading, error, refetch } = useResource();
  
  // 2. Mutations
  const create = useCreateResource();
  
  // 3. Handlers
  const handleCreate = async (formData) => {
    try {
      await create.mutate(formData);
      toast.success('Succès');
    } catch (error) {
      toast.error(error.message);
    }
  };
  
  // 4. Gestion des états
  if (loading) return <Loader />;
  if (error) return <Error error={error} onRetry={refetch} />;
  
  // 5. Rendu
  return (
    <div>
      <List data={data?.data} />
      <CreateButton onClick={handleCreate} />
    </div>
  );
}
```

---

## 🚀 RÉSUMÉ

**Tous les hooks suivent le même pattern :**
- ✅ `use{Resource}s` - Liste (GET)
- ✅ `use{Resource}` - Un seul élément (GET)
- ✅ `useCreate{Resource}` - Créer (POST)
- ✅ `useUpdate{Resource}` - Modifier (PUT)
- ✅ `useDelete{Resource}` - Supprimer (DELETE)

**Toutes les mutations retournent :**
- ✅ `mutate(data)` - Fonction pour exécuter
- ✅ `loading` - État de chargement
- ✅ `error` - Erreur si échec
- ✅ `data` - Données retournées

**Toutes les requêtes retournent :**
- ✅ `data` - Données récupérées
- ✅ `loading` - État de chargement
- ✅ `error` - Erreur si échec
- ✅ `refetch()` - Fonction pour recharger

---

**🎉 ZÉRO DUPLICATION - Tout est centralisé et réutilisable !**
