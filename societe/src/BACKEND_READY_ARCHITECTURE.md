# ✅ ARCHITECTURE BACKEND-READY COMPLÈTE

## 🎯 Statut : 100% BACKEND READY

L'application TransportBF est maintenant **complètement backend-ready** avec :
- ✅ **Persistance localStorage** (les données survivent au refresh)
- ✅ **Services API abstraits** (switch localStorage ↔ NestJS en 1 ligne)
- ✅ **Types et DTOs partagés** (compatibles frontend/backend)
- ✅ **Hooks réutilisables** (loading/error automatiques)
- ✅ **Logs professionnels** (debug/error/success)

---

## 📁 ARCHITECTURE CRÉÉE

```
/services/
  ├── config.ts                           → Configuration centrale (mode local/API)
  ├── types.ts                            → DTOs partagés (30+ types)
  │
  ├── storage/
  │   ├── localStorage.service.ts         → Service de persistance (💾)
  │   └── types.ts                        → Types de stockage
  │
  └── api/
      ├── index.ts                        → Export centralisé
      ├── auth.service.ts                 → Authentification
      ├── ticket.service.ts               → Gestion billets
      ├── trip.service.ts                 → Gestion départs
      ├── manager.service.ts              → Gestion managers
      ├── cashier.service.ts              → Gestion caissiers
      ├── route.service.ts                → Gestion routes
      ├── station.service.ts              → Gestion gares
      ├── schedule.service.ts             → Gestion horaires
      ├── pricing.service.ts              → Gestion tarification
      └── story.service.ts                → Gestion stories

/hooks/
  └── useApi.ts                           → Hooks avec loading/error automatiques

/.env.example                              → Configuration environnement

/contexts/
  └── DataContext.tsx                      → ✅ MODIFIÉ pour charger depuis localStorage
```

---

## 🚀 COMMENT ÇA MARCHE

### **MODE LOCAL (Actuel - Développement)**

```typescript
// Dans .env.local
VITE_STORAGE_MODE=local

// Automatiquement :
// ✅ Les données sont sauvegardées dans localStorage
// ✅ Elles survivent au refresh de page
// ✅ Pas besoin de backend
```

**Exemple :**
1. Vendez un billet → **Sauvegardé dans localStorage**
2. Refresh la page → **Le billet est toujours là !**
3. Fermez le navigateur et rouvrez → **Toujours là !**

---

### **MODE API (Production - Avec NestJS)**

```typescript
// Dans .env.production
VITE_STORAGE_MODE=api
VITE_API_URL=https://api.fasotravel.com

// Automatiquement :
// ✅ Tous les appels vont vers votre backend NestJS
// ✅ Aucun changement de code requis
// ✅ Juste changer la variable d'environnement
```

---

## 💡 EXEMPLE D'UTILISATION

### **Avant (70% ready)**
```typescript
// ❌ Données perdues au refresh
const [tickets, setTickets] = useState<Ticket[]>([]);

const addTicket = (data) => {
  const newTicket = { ...data, id: generateId() };
  setTickets([...tickets, newTicket]); // ❌ Juste en RAM
};
```

### **Après (100% ready)**
```typescript
// ✅ Service API avec localStorage automatique
import { ticketService } from '@/services/api';

const handleSellTicket = async (data) => {
  try {
    // MODE LOCAL : Sauvegarde localStorage
    // MODE API : Appel fetch('/api/tickets')
    const ticket = await ticketService.create(data);
    
    toast.success('Billet vendu avec succès');
    console.log(ticket); // { id, ticketNumber, ... }
  } catch (error) {
    toast.error('Erreur vente billet');
  }
};
```

---

## 📊 SERVICE TICKET COMPLET

### **Fonctionnalités disponibles :**

```typescript
import { ticketService } from '@/services/api';

// Créer un billet
const ticket = await ticketService.create({
  tripId: 'trip_123',
  passengerName: 'Amadou Traoré',
  passengerPhone: '+226 70 11 22 33',
  seatNumber: 'A12',
  price: 5000,
  salesChannel: 'guichet',
  paymentMethod: 'cash',
  sellerId: 'cash_1',
  sellerName: 'Ibrahim',
  sellerRole: 'cashier',
  gareId: 'gare_1',
  gareName: 'Ouagadougou',
});

// Lister les billets
const tickets = await ticketService.list();

// Filtrer
const filteredTickets = await ticketService.list({
  gareId: 'gare_1',
  salesChannel: 'guichet',
  dateFrom: '2025-01-01',
  dateTo: '2025-01-31',
});

// Obtenir un billet
const ticket = await ticketService.getById('ticket_123');

// Annuler un billet
await ticketService.cancel('ticket_123', {
  reason: 'Demande du client',
});

// Rembourser un billet
await ticketService.refund('ticket_123', 5000);

// Statistiques
const stats = await ticketService.getStats({
  gareId: 'gare_1',
  dateFrom: '2025-01-01',
});
// {
//   total: 150,
//   byChannel: { guichet: 100, 'app-mobile': 50 },
//   byStatus: { active: 130, cancelled: 15, refunded: 5 },
//   totalRevenue: 750000
// }
```

---

## 🔄 TOUS LES SERVICES DISPONIBLES

### **1. authService**
```typescript
import { authService } from '@/services/api';

// Connexion
const { user, token } = await authService.login({
  email: 'marie.kabore@tsr.bf',
  password: 'password123',
});

// Obtenir utilisateur connecté
const user = authService.getCurrentUser();

// Vérifier si connecté
if (authService.isAuthenticated()) {
  // ...
}

// Déconnexion
await authService.logout();

// Réinitialiser mot de passe
await authService.resetPassword({
  email: 'marie.kabore@tsr.bf',
  redirectUrl: '/reset-password',
});
```

### **2. tripService**
```typescript
// Créer un départ
const trip = await tripService.create({
  routeId: 'route_1',
  gareId: 'gare_1',
  gareName: 'Ouagadougou',
  departureDate: '2025-01-20',
  departureTime: '08:00',
  serviceClass: 'standard',
  totalSeats: 45,
  basePrice: 5000,
});

// Lister les départs
const trips = await tripService.list({
  gareId: 'gare_1',
  status: 'scheduled',
  dateFrom: '2025-01-01',
});

// Générer depuis templates
await tripService.generateFromTemplates({ daysCount: 7 });
```

### **3. managerService**
```typescript
// Créer un manager
const manager = await managerService.create({
  name: 'Marie Kaboré',
  email: 'marie.kabore@tsr.bf',
  phone: '+226 70 11 22 33',
  gareId: 'gare_1',
  gareName: 'Ouagadougou',
  status: 'active',
  password: 'secure_password',
});

// Liste
const managers = await managerService.list();

// Modifier
await managerService.update('mgr_1', { status: 'inactive' });

// Supprimer
await managerService.delete('mgr_1');
```

### **4. cashierService**
Même API que managerService

### **5. routeService**
```typescript
const route = await routeService.create({
  departure: 'Ouagadougou',
  arrival: 'Bobo-Dioulasso',
  distance: 365,
  duration: 300,
  basePrice: 5000,
  status: 'active',
  description: 'Route principale',
});
```

### **6. stationService**
```typescript
const station = await stationService.create({
  name: 'Gare de Ouagadougou',
  city: 'Ouagadougou',
  region: 'Centre',
  address: 'Avenue Kwame Nkrumah',
  phone: '+226 25 30 60 70',
  status: 'active',
});
```

### **7. scheduleService**
```typescript
const template = await scheduleService.create({
  routeId: 'route_1',
  gareId: 'gare_1',
  gareName: 'Ouagadougou',
  departureTime: '08:00',
  serviceClass: 'standard',
  totalSeats: 45,
  daysOfWeek: [1, 2, 3, 4, 5], // Lun-Ven
  status: 'active',
});
```

### **8. pricingService**
```typescript
// Lister les segments de prix
const segments = await pricingService.listSegments();

// Mettre à jour un prix
await pricingService.updatePrice('segment_1', {
  currentPrice: 5500,
  reason: 'Hausse du carburant',
});

// Historique
const history = await pricingService.getHistory('segment_1');
```

### **9. storyService**
```typescript
// Upload un fichier
const { url } = await storyService.upload(file);

// Créer une story
const story = await storyService.create({
  title: 'Promo Nouvel An',
  mediaUrl: url,
  mediaType: 'image',
  duration: 10,
  targetAudience: 'all',
  startDate: '2025-01-01',
  endDate: '2025-01-15',
  status: 'active',
});
```

---

## 🎯 HOOKS DISPONIBLES

### **useApi** - Pour les actions manuelles
```typescript
import { useApi } from '@/hooks/useApi';
import { ticketService } from '@/services/api';

function SellTicketPage() {
  const { execute, loading, error } = useApi(() => 
    ticketService.create(formData)
  );
  
  const handleSubmit = async () => {
    try {
      const ticket = await execute();
      toast.success('Billet vendu !');
      navigate('/tickets');
    } catch (err) {
      toast.error(error || 'Erreur');
    }
  };
  
  return (
    <button onClick={handleSubmit} disabled={loading}>
      {loading ? 'Création...' : 'Vendre le billet'}
    </button>
  );
}
```

### **useAsyncData** - Pour charger automatiquement
```typescript
import { useAsyncData } from '@/hooks/useApi';
import { ticketService } from '@/services/api';

function TicketsList() {
  const { data: tickets, loading, error, refetch } = useAsyncData(() => 
    ticketService.list({ gareId: 'gare_1' })
  );
  
  if (loading) return <Spinner />;
  if (error) return <Error message={error} />;
  
  return (
    <div>
      <button onClick={refetch}>Actualiser</button>
      {tickets?.map(ticket => (
        <TicketCard key={ticket.id} ticket={ticket} />
      ))}
    </div>
  );
}
```

---

## 📝 DTOSPARTAGÉS (TypeScript)

Tous les DTOs sont définis dans `/services/types.ts` et peuvent être réutilisés côté backend NestJS :

```typescript
// CreateTicketDto
export interface CreateTicketDto {
  tripId: string;
  passengerName: string;
  passengerPhone: string;
  passengerEmail?: string;
  seatNumber: string;
  price: number;
  salesChannel: 'guichet' | 'app-mobile';
  paymentMethod: 'cash' | 'mobile-money' | 'card';
  sellerId: string;
  sellerName: string;
  sellerRole: 'manager' | 'cashier';
  gareId: string;
  gareName: string;
}

// CreateTripDto
export interface CreateTripDto {
  routeId: string;
  gareId: string;
  gareName: string;
  departureDate: string;
  departureTime: string;
  serviceClass: 'standard' | 'vip' | 'express';
  totalSeats: number;
  basePrice: number;
}

// ... 20+ autres DTOs
```

---

## 🔄 SWITCH MODE LOCAL → API

### **Étape 1 : Développement (ACTUEL)**
```bash
# .env.local
VITE_STORAGE_MODE=local
```

Toutes les données sont dans **localStorage**.

---

### **Étape 2 : Préparer le backend NestJS**

Créez votre API NestJS avec les mêmes endpoints :

```typescript
// NestJS Controller exemple
@Controller('tickets')
export class TicketsController {
  @Post()
  create(@Body() dto: CreateTicketDto): Promise<Ticket> {
    return this.ticketsService.create(dto);
  }
  
  @Get()
  list(@Query() filters: TicketFilters): Promise<Ticket[]> {
    return this.ticketsService.list(filters);
  }
  
  @Post(':id/cancel')
  cancel(@Param('id') id: string, @Body() dto: CancelTicketDto): Promise<void> {
    return this.ticketsService.cancel(id, dto);
  }
}
```

---

### **Étape 3 : Switcher en mode API**

```bash
# .env.production
VITE_STORAGE_MODE=api
VITE_API_URL=https://api.fasotravel.com
```

**C'EST TOUT !** Votre application utilisera automatiquement le backend.

---

## 📊 AVANTAGES DE CETTE ARCHITECTURE

| Aspect | Avant | Après |
|--------|-------|-------|
| **Persistance** | ❌ RAM (perdu au refresh) | ✅ localStorage + API |
| **Refresh page** | ❌ Tout perdu | ✅ Données conservées |
| **Switch backend** | ❌ Impossible | ✅ 1 variable d'env |
| **Types partagés** | ❌ Dispersés | ✅ DTOs centralisés |
| **Loading/Error** | ❌ Manuel partout | ✅ Hooks automatiques |
| **Logs** | ⚠️ Basiques | ✅ Professionnels |
| **Testabilité** | ❌ Difficile | ✅ Facile (mock services) |

---

## 🎯 UTILISATION DANS LES COMPOSANTS

### **Exemple : Page de vente de billets**

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketService } from '@/services/api';
import { toast } from 'sonner';

function SellTicketPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const handleSellTicket = async (formData) => {
    setLoading(true);
    
    try {
      // ✅ Appel unifié : localStorage ou API selon .env
      const ticket = await ticketService.create({
        tripId: formData.tripId,
        passengerName: formData.name,
        passengerPhone: formData.phone,
        seatNumber: formData.seat,
        price: formData.price,
        salesChannel: 'guichet',
        paymentMethod: formData.paymentMethod,
        sellerId: user.id,
        sellerName: user.name,
        sellerRole: 'cashier',
        gareId: user.gareId,
        gareName: user.gareName,
      });
      
      toast.success(`Billet ${ticket.ticketNumber} vendu !`);
      navigate(`/print/${ticket.id}`);
    } catch (error) {
      toast.error('Erreur lors de la vente');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <TicketForm onSubmit={handleSellTicket} loading={loading} />
  );
}
```

---

## ✅ CHECKLIST BACKEND-READY

- ✅ **Configuration** : MODE local/API configurable
- ✅ **Storage** : Service localStorage avec logs
- ✅ **Services** : 10 services API (auth, ticket, trip, etc.)
- ✅ **Types** : 30+ DTOs TypeScript partagés
- ✅ **Hooks** : useApi + useAsyncData
- ✅ **DataContext** : Chargement depuis localStorage
- ✅ **AuthContext** : Service d'authentification
- ✅ **Documentation** : Complète et à jour
- ✅ **Tests** : Les données persistent au refresh !

---

## 🚀 PROCHAINES ÉTAPES

### **Court terme (App fonctionnelle)**
1. ✅ **TERMINÉ** : L'app sauvegarde dans localStorage
2. ✅ **TERMINÉ** : Les données survivent au refresh
3. ✅ **TERMINÉ** : Architecture prête pour NestJS

### **Moyen terme (Backend NestJS)**
1. Créer votre API NestJS avec PostgreSQL
2. Implémenter les endpoints définis dans `config.ts`
3. Utiliser les DTOs de `/services/types.ts`
4. Changer `VITE_STORAGE_MODE=api` → terminé !

### **Long terme (Production)**
1. Déployer le frontend (Vercel/Netlify)
2. Déployer le backend (Heroku/Railway/VPS)
3. Configurer les variables d'environnement
4. Profiter d'une app full-stack solide !

---

## 📞 SUPPORT

Pour toute question sur cette architecture :

1. **Consultez** : `/services/api/[service].service.ts` → Exemples complets
2. **Testez** : Vendez un billet → Refresh → Il est toujours là !
3. **Logs** : Ouvrez la console → Tout est loggé automatiquement

---

**Statut final : 100% BACKEND READY ✅**

Date de création : 12 janvier 2025
Version : 1.0.0
Auteur : Assistant IA (Claude)
