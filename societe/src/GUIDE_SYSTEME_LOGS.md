# 📋 GUIDE D'UTILISATION : Système de Logs Professionnel

## 🎯 Objectif

Remplacer tous les `console.log()` par un système de logs intelligent qui :
- Se désactive automatiquement en production
- Ajoute du contexte (composant, catégorie, timestamp)
- Facilite le debug avec des niveaux et couleurs

---

## 🚀 EXEMPLES PRATIQUES PAR CAS D'USAGE

### 1. **Page de Vente de Billets** (TicketSalePage.tsx)

#### ❌ AVANT (console.log basique)
```typescript
const handleSeatSelect = (seatNumber: string) => {
  console.log('Siège sélectionné:', seatNumber);
  console.log('Sièges occupés:', occupiedSeats);
  
  if (occupiedSeats.includes(seatNumber)) {
    console.log('ERREUR: Siège déjà occupé');
    toast.error('Ce siège est déjà occupé');
    return;
  }
  
  setSelectedSeats([...selectedSeats, seatNumber]);
  console.log('Sièges sélectionnés mis à jour:', [...selectedSeats, seatNumber]);
};

const handleConfirmSale = () => {
  console.log('=== DÉBUT VENTE ===');
  console.log('Trip:', currentTrip);
  console.log('Passagers:', passengers);
  console.log('Paiement:', paymentMethod);
  
  passengers.forEach(passenger => {
    console.log('Création ticket pour:', passenger);
    addTicket({...});
  });
  
  console.log('=== FIN VENTE ===');
  toast.success('Vente confirmée');
};
```

#### ✅ APRÈS (Système de logs)
```typescript
import { createLogger } from '../../utils/logger';

// Créer un logger pour ce composant
const logger = createLogger('TicketSalePage', 'vente');

const handleSeatSelect = (seatNumber: string) => {
  logger.debug('Siège sélectionné:', seatNumber);
  logger.debug('Sièges occupés:', occupiedSeats);
  
  if (occupiedSeats.includes(seatNumber)) {
    logger.warn('Tentative de sélection d\'un siège occupé:', seatNumber);
    toast.error('Ce siège est déjà occupé');
    return;
  }
  
  const newSelection = [...selectedSeats, seatNumber];
  setSelectedSeats(newSelection);
  logger.info('Siège ajouté à la sélection:', { seatNumber, total: newSelection.length });
};

const handleConfirmSale = () => {
  logger.time('Vente complète'); // Mesure performance
  
  logger.group('Détails de la vente', {
    trip: currentTrip?.id,
    route: `${currentTrip?.departure} → ${currentTrip?.arrival}`,
    passengersCount: passengers.length,
    paymentMethod,
    totalPrice: passengers.length * (currentTrip?.price || 0)
  }, 'info');
  
  passengers.forEach((passenger, index) => {
    logger.debug(`Création ticket ${index + 1}/${passengers.length}`, passenger);
    addTicket({...});
  });
  
  logger.timeEnd('Vente complète');
  logger.info('✅ Vente confirmée avec succès', { ticketsCount: passengers.length });
  toast.success('Vente confirmée');
};
```

**Résultat Console (développement)** :
```
[14:30:25] [DEBUG] [vente] [TicketSalePage] Siège sélectionné: A1
[14:30:25] [DEBUG] [vente] [TicketSalePage] Sièges occupés: ["B2", "C3"]
[14:30:25] [INFO] [vente] [TicketSalePage] Siège ajouté à la sélection: { seatNumber: "A1", total: 1 }
[14:30:45] [INFO] [vente] [TicketSalePage] Détails de la vente
  ▼ {
      trip: "trip_123",
      route: "Ouagadougou → Bobo-Dioulasso",
      passengersCount: 2,
      paymentMethod: "cash",
      totalPrice: 10000
    }
[14:30:45] [DEBUG] [vente] [TicketSalePage] Création ticket 1/2 { name: "Jean", phone: "70123456" }
[14:30:45] [DEBUG] [vente] [TicketSalePage] Création ticket 2/2 { name: "Marie", phone: "76987654" }
[14:30:46] [DEBUG] [vente] [TicketSalePage] Vente complète: 1247.32ms
[14:30:46] [INFO] [vente] [TicketSalePage] ✅ Vente confirmée avec succès { ticketsCount: 2 }
```

---

### 2. **Gestion de la Caisse** (CashManagementPage.tsx)

#### ✅ UTILISATION
```typescript
import { createLogger } from '../../utils/logger';

const logger = createLogger('CashManagementPage', 'caisse');

const handleDeposit = (amount: number) => {
  logger.info('Dépôt de caisse initié', { amount: formatCurrency(amount) });
  
  try {
    addCashTransaction({
      type: 'deposit',
      amount,
      cashierId: user.id,
      timestamp: new Date().toISOString(),
    });
    
    logger.info('✅ Dépôt enregistré avec succès', { 
      newBalance: formatCurrency(cashBalance + amount) 
    });
    toast.success('Dépôt enregistré');
    
  } catch (error) {
    logger.error('❌ Erreur lors du dépôt', error);
    toast.error('Erreur lors du dépôt');
  }
};

const handleWithdrawal = (amount: number) => {
  if (amount > cashBalance) {
    logger.warn('Tentative de retrait supérieur au solde', {
      requested: formatCurrency(amount),
      available: formatCurrency(cashBalance)
    });
    toast.error('Solde insuffisant');
    return;
  }
  
  logger.info('Retrait de caisse initié', { amount: formatCurrency(amount) });
  // ... traitement
};
```

---

### 3. **Authentification** (AuthContext.tsx)

#### ✅ UTILISATION
```typescript
import { logAuth } from '../utils/logger';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const login = async (email: string, password: string) => {
    logAuth.info('Tentative de connexion', { email });
    
    try {
      const foundUser = users.find(u => u.email === email && u.password === password);
      
      if (!foundUser) {
        logAuth.warn('Échec de connexion : identifiants invalides', { email });
        throw new Error('Email ou mot de passe incorrect');
      }
      
      setUser(foundUser);
      localStorage.setItem('user', JSON.stringify(foundUser));
      
      logAuth.info('✅ Connexion réussie', { 
        userId: foundUser.id, 
        role: foundUser.role,
        gareId: foundUser.gareId 
      });
      
    } catch (error) {
      logAuth.error('❌ Erreur lors de la connexion', error);
      throw error;
    }
  };

  const logout = () => {
    logAuth.info('Déconnexion', { userId: user?.id, role: user?.role });
    setUser(null);
    localStorage.removeItem('user');
    navigate('/');
  };

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}
```

---

### 4. **DataContext** (Opérations CRUD)

#### ✅ UTILISATION
```typescript
import { logData } from '../utils/logger';

export function DataProvider({ children }: { children: React.ReactNode }) {
  
  const addTicket = (ticketData: Omit<Ticket, 'id'>) => {
    logData.debug('Ajout d\'un nouveau ticket', ticketData);
    
    const ticket: Ticket = {
      id: generateId('ticket'),
      ...ticketData
    };
    
    setTickets(prev => {
      const newTickets = [...prev, ticket];
      logData.info('✅ Ticket ajouté', { 
        ticketId: ticket.id,
        totalTickets: newTickets.length 
      });
      return newTickets;
    });

    // Mise à jour du trip
    const trip = trips.find(t => t.id === ticket.tripId);
    if (trip && trip.availableSeats > 0) {
      updateTrip(trip.id, { availableSeats: trip.availableSeats - 1 });
      logData.debug('Places disponibles mises à jour', {
        tripId: trip.id,
        availableSeats: trip.availableSeats - 1
      });
    }

    // Transaction de caisse (si counter)
    if (ticket.salesChannel === 'counter') {
      logData.debug('Création transaction caisse (vente counter)');
      addCashTransaction({ type: 'sale', amount: ticket.price, ... });
    } else {
      logData.debug('Vente online : pas de transaction caisse');
    }
  };

  const refundTicket = (ticketId: string) => {
    logData.time('Remboursement');
    
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) {
      logData.error('Ticket introuvable pour remboursement', { ticketId });
      throw new Error('Ticket introuvable');
    }

    logData.info('Remboursement initié', {
      ticketId,
      passengerName: ticket.passengerName,
      amount: formatCurrency(ticket.price),
      salesChannel: ticket.salesChannel
    });

    // ... logique remboursement ...

    logData.timeEnd('Remboursement');
    logData.info('✅ Remboursement effectué avec succès');
  };
}
```

---

### 5. **Analytics & Calculs** (AnalyticsPage.tsx)

#### ✅ UTILISATION
```typescript
import { logAnalytics } from '../../utils/logger';

export default function AnalyticsPage() {
  const calculateStats = () => {
    logAnalytics.time('Calcul stats globales');
    
    // Revenus
    const revenueStats = calculateRevenueByChannel(tickets);
    logAnalytics.debug('Stats revenus par canal', revenueStats);
    
    // Occupation
    const occupancyRate = calculateOverallOccupancy(trips);
    logAnalytics.debug('Taux d\'occupation global', { rate: `${occupancyRate}%` });
    
    // Top routes
    const topRoutes = getTopRoutes(tickets, 5);
    logAnalytics.table(topRoutes, 'debug'); // Affiche tableau dans console
    
    logAnalytics.timeEnd('Calcul stats globales');
    logAnalytics.info('Analytics calculés', {
      totalRevenue: formatCurrency(revenueStats.online.revenue + revenueStats.counter.revenue),
      occupancyRate: `${occupancyRate}%`,
      topRoute: topRoutes[0]?.route
    });
  };
  
  // ... rest of component
}
```

**Résultat Console** :
```
[14:35:10] [DEBUG] [analytics] [AnalyticsPage] Stats revenus par canal
  ▼ { online: { revenue: 150000, count: 30 }, counter: { revenue: 250000, count: 50 } }
[14:35:10] [DEBUG] [analytics] [AnalyticsPage] Taux d'occupation global { rate: "78%" }
[14:35:10] [DEBUG] [analytics] [AnalyticsPage]
┌─────────┬──────────────────────────────────┬─────────┬──────────┐
│ (index) │              route               │ tickets │  revenue │
├─────────┼──────────────────────────────────┼─────────┼──────────┤
│    0    │ 'Ouagadougou → Bobo-Dioulasso'   │   45    │  225000  │
│    1    │ 'Bobo-Dioulasso → Ouagadougou'   │   35    │  175000  │
└─────────┴──────────────────────────────────┴─────────┴──────────┘
[14:35:11] [DEBUG] [analytics] [AnalyticsPage] Calcul stats globales: 847.23ms
[14:35:11] [INFO] [analytics] [AnalyticsPage] Analytics calculés
  ▼ { totalRevenue: "400,000 FCFA", occupancyRate: "78%", topRoute: "Ouagadougou → Bobo-Dioulasso" }
```

---

## 🎨 NIVEAUX DE LOGS & QUAND LES UTILISER

| Niveau | Quand l'utiliser | Exemples |
|--------|------------------|----------|
| **debug** | Détails techniques, développement | Variables internes, états intermédiaires |
| **info** | Actions importantes réussies | Vente confirmée, connexion réussie |
| **warn** | Situations anormales mais gérées | Siège occupé, solde insuffisant |
| **error** | Erreurs critiques | Échec API, erreur de validation |

---

## ⚙️ CONFIGURATION AVANCÉE

### Filtrer par Catégorie (en développement)
```typescript
import { configureLogger } from '../utils/logger';

// Ne logger QUE les ventes et la caisse
configureLogger({
  allowedCategories: ['vente', 'caisse']
});

// Désactiver les logs de debug même en dev
configureLogger({
  enableDebug: false
});
```

### Désactiver complètement les logs (production)
```typescript
// Les logs se désactivent automatiquement en production
// Mais vous pouvez forcer :
configureLogger({
  enableDebug: false,
  enableInfo: false,
  enableWarn: false,
  // enableError reste true pour capturer les erreurs critiques
});
```

---

## 📊 AVANTAGES DU SYSTÈME

### ✅ Avant/Après Comparaison

| Aspect | console.log | Système de Logs |
|--------|-------------|-----------------|
| **Production** | ❌ S'affiche | ✅ Désactivé auto |
| **Contexte** | ❌ Aucun | ✅ Composant + catégorie |
| **Lisibilité** | ❌ Tout mélangé | ✅ Couleurs + niveaux |
| **Performance** | ❌ Ralentit app | ✅ Zero overhead en prod |
| **Filtrage** | ❌ Impossible | ✅ Par catégorie/niveau |
| **Grouping** | ❌ Manuel | ✅ Automatique |

---

## 🚀 MIGRATION RAPIDE

### Rechercher/Remplacer dans VSCode

1. **Rechercher** : `console\.log\(`
2. **Remplacer par** : `logger.debug(`

3. **Rechercher** : `console\.error\(`
4. **Remplacer par** : `logger.error(`

5. **Rechercher** : `console\.warn\(`
6. **Remplacer par** : `logger.warn(`

Puis ajouter en haut de chaque fichier :
```typescript
import { createLogger } from '../../utils/logger';
const logger = createLogger('NomDuComposant', 'categorie');
```

---

## 📝 CHECKLIST D'IMPLÉMENTATION

- [ ] Créer `/utils/logger.ts` ✅ (déjà fait)
- [ ] Migrer `TicketSalePage.tsx` (5 min)
- [ ] Migrer `CashManagementPage.tsx` (5 min)
- [ ] Migrer `AuthContext.tsx` (5 min)
- [ ] Migrer `DataContext.tsx` (10 min)
- [ ] Migrer `AnalyticsPage.tsx` (5 min)
- [ ] Vérifier en dev : logs colorés ✅
- [ ] Vérifier en prod : logs désactivés ✅

**Temps total estimé : 30 minutes**

---

## 🎯 RÉSULTAT FINAL

**En développement (localhost)** :
```
Console pleine de logs colorés et contextualisés 🎨
Facile de débugger 🔍
Performance mesurée ⏱️
```

**En production** :
```
Console propre 🧹
Aucun ralentissement ⚡
Erreurs critiques capturées 🚨
```

---

*Guide créé pour TransportBF Dashboard - Janvier 2026*
