# 🔍 AUDIT DE COHÉRENCE COMPLET - FasoTravel Mobile vs Dashboard

**Date:** 19 Décembre 2025  
**Statut:** ✅ Analyse exhaustive terminée

---

## 📊 VUE D'ENSEMBLE

### Contexte des Applications

| Application | Utilisateurs Cibles | Objectif Principal |
|-------------|---------------------|-------------------|
| **📱 Mobile** | Voyageurs finaux | Réserver, acheter billets, suivre voyages |
| **💼 Dashboard** | Sociétés de transport | Gérer gares, ventes, caissiers, analytics |

**⚠️ IMPORTANT:** Ces applications sont **complémentaires** mais ont des **objectifs différents**.  
Certaines différences sont **NORMALES** (fonctionnalités métier), d'autres sont des **INCOHÉRENCES** à corriger.

---

## 🚨 INCOHÉRENCES CRITIQUES (À CORRIGER IMMÉDIATEMENT)

### 1. ❌ Type `Ticket` - Champs Manquants dans Mobile

#### Dashboard ✅
```typescript
export interface Ticket {
  // ... champs de base
  commission?: number;            // 🆕 MANQUE dans mobile
  salesChannel: 'online' | 'counter'; // 🆕 CRITIQUE - MANQUE dans mobile
  cashierId: string;              // ✅ Présent
  cashierName: string;            // ✅ Présent
}
```

#### Mobile ❌
```typescript
// Recherche GitHub: AUCUN résultat pour "salesChannel"
// Recherche GitHub: AUCUN résultat pour "commission"
```

**🔴 PROBLÈME:**
- L'app mobile ne peut PAS distinguer entre ventes online et comptoir
- Impossible de calculer les commissions FasoTravel (5%)
- **BLOQUANT pour le business model**

**📝 ACTION:**
```typescript
// À AJOUTER dans src/data/models.ts (mobile)
export interface Ticket {
  // ... champs existants
  salesChannel: 'online' | 'counter'; // Toujours 'online' pour app mobile
  commission?: number; // Calculé par le backend
}
```

---

### 2. ❌ Configuration Business Absente dans Mobile

| Configuration | Dashboard | Mobile | Impact |
|---------------|-----------|--------|--------|
| `BUSINESS_CONFIG.COMMISSION` | ✅ 5% défini | ❌ Absent | 🔴 CRITIQUE |
| `BUSINESS_CONFIG.CANCELLATION` | ✅ Politique complète | ❌ Absent | 🔴 IMPORTANT |
| `BUSINESS_CONFIG.VEHICLE_CAPACITY` | ✅ Standard/VIP/Mini | ❌ Hardcodé | 🟡 Moyen |
| `BUSINESS_CONFIG.PRICING` | ✅ VIP markup, réductions | ❌ Absent | 🟡 Moyen |

**📝 ACTION:**  
Créer `/src/config/business.ts` dans l'app mobile avec les MÊMES valeurs que le dashboard.

---

### 3. ❌ Calcul de Commission Manquant

#### Dashboard ✅
```typescript
// /config/business.ts
export function calculateCommission(price: number): number {
  const commission = price * BUSINESS_CONFIG.COMMISSION.RATE;
  return Math.max(commission, BUSINESS_CONFIG.COMMISSION.MIN_AMOUNT);
}
```

#### Mobile ❌
Fonction inexistante

**📝 ACTION:**  
Copier la fonction dans le fichier config de l'app mobile.

---

## ⚠️ TYPES PRÉSENTS UNIQUEMENT DANS LE DASHBOARD (Normal)

Ces types sont **NORMAUX** car ce sont des fonctionnalités de **gestion** pour les sociétés.

### 1. `ScheduleTemplate` (Dashboard uniquement)
```typescript
export interface ScheduleTemplate {
  id: string;
  routeId: string;
  departureTime: string;
  daysOfWeek: number[];
  serviceClass: 'standard' | 'vip';
  // ... GESTION des horaires récurrents
}
```

**✅ NORMAL:** Les voyageurs ne gèrent PAS les horaires, ils les consultent seulement.

---

### 2. `PricingRule` (Dashboard uniquement)
```typescript
export interface PricingRule {
  id: string;
  type: 'percentage' | 'fixed';
  value: number;
  // ... GESTION de tarification variable
}
```

**✅ NORMAL:** Les voyageurs voient le prix final, pas les règles de tarification.

---

### 3. `CashTransaction` (Dashboard uniquement)
```typescript
export interface CashTransaction {
  id: string;
  type: 'sale' | 'refund' | 'deposit' | 'withdrawal';
  amount: number;
  method: 'cash' | 'mobile_money' | 'card';
  // ... GESTION de caisse
}
```

**✅ NORMAL:** Les voyageurs ne gèrent PAS la caisse des sociétés.

---

### 4. `Manager` et `Cashier` (Dashboard uniquement)
```typescript
export interface Manager { /* ... */ }
export interface Cashier { /* ... */ }
```

**✅ NORMAL:** Gestion interne des sociétés de transport.

---

## ✅ TYPES COHÉRENTS (Présents dans les deux)

Ces types existent dans les deux applications et sont **cohérents**.

| Type | Mobile | Dashboard | Cohérence |
|------|--------|-----------|-----------|
| `Station` | ✅ | ✅ | ✅ OK |
| `Route` | ✅ | ✅ | ✅ OK |
| `Trip` | ✅ | ✅ | ✅ OK (légères variations) |
| `Story` | ✅ | ✅ | ✅ OK |
| `Review` | ✅ | ✅ | ✅ OK |
| `Incident` | ✅ | ✅ | ✅ OK |
| `SupportTicket` | ⚠️ Partiel | ✅ Complet | 🟡 À harmoniser |

---

## 📱 PAGES - Comparaison Fonctionnelle

### App Mobile (20 pages utilisateur)
```
✅ LandingPage           - Onboarding
✅ AuthPage              - Login/Register
✅ HomePage              - Recherche trajets
✅ SearchResultsPage     - Résultats
✅ TripDetailPage        - Détail voyage
✅ SeatSelectionPage     - Choix siège
✅ PaymentPage           - Paiement (Orange/Moov)
✅ PaymentSuccessPage    - Confirmation
✅ TicketsPage           - Mes billets
✅ TicketDetailPage      - QR code + détails
✅ NearbyPage            - GPS stations proches
✅ NotificationsPage     - Notifications
✅ ProfilePage           - Profil voyageur
✅ EditProfilePage       - Édition profil
✅ OperatorsPage         - Liste compagnies
✅ OperatorDetailPage    - Détail compagnie
✅ RatingReviewPage      - Noter voyage
✅ SupportPage           - Support client
✅ ChatPage              - Chat support
✅ TermsConditionsPage   - CGU
```

### Dashboard (24+ pages gestion)
```
✅ LoginPage            - Login gestion
✅ StatusPage           - Page statut

📊 RESPONSABLE SOCIÉTÉ (11 pages)
✅ DashboardHome        - Vue d'ensemble
✅ TrafficPage          - Gestion trafic
✅ SchedulesPage        - Horaires récurrents
✅ PricingPage          - Tarification variable
✅ RoutesPage           - Gestion trajets
✅ StationsPage         - Gestion gares
✅ ManagersPage         - Gestion managers
✅ StoriesPage          - Stories marketing
✅ AnalyticsPage        - Analytics avancées
✅ ReviewsPage          - Modération avis
✅ PoliciesPage         - Politiques
✅ SupportPage          - Support

👨‍💼 MANAGER DE GARE (7 pages)
✅ DashboardHome        - Vue gare
✅ DeparturesPage       - Prochains départs
✅ CashiersPage         - Gestion caissiers
✅ SalesSupervisionPage - Suivi ventes
✅ IncidentsPage        - Gestion incidents
✅ LocalMapPage         - Carte locale
✅ SupportPage          - Support

💵 CAISSIER (6 pages)
✅ DashboardHome        - Vue caisse
✅ TicketSalePage       - Vente billets (GUICHET)
✅ PassengerListsPage   - Liste passagers
✅ CashManagementPage   - Gestion caisse
✅ RefundPage           - Remboursements
✅ HistoryPage          - Historique
✅ ReportPage           - Rapports
```

**✅ COHÉRENT:** Fonctionnalités adaptées à chaque type d'utilisateur.

---

## 🎨 IDENTITÉ VISUELLE - Comparaison

### Couleurs TransportBF (Drapeau Burkina Faso)

| Couleur | Mobile | Dashboard | Cohérence |
|---------|--------|-----------|-----------|
| 🔴 Rouge `#dc2626` | ✅ | ✅ | ✅ PARFAIT |
| 🟡 Jaune `#f59e0b` | ✅ | ✅ | ✅ PARFAIT |
| 🟢 Vert `#16a34a` | ✅ | ✅ | ✅ PARFAIT |

**Vérification Mobile:**
```css
/* src/styles/globals.css */
--color-red: #dc2626;
--color-yellow: #f59e0b;
--color-green: #16a34a;
```

**Vérification Dashboard:**
```css
/* /styles/globals.css */
--color-transportbf-red: #dc2626;
--color-transportbf-yellow: #f59e0b;
--color-transportbf-green: #16a34a;
```

### Logo FasoTravel

| Emplacement | Mobile | Dashboard |
|-------------|--------|-----------|
| Header | ✅ | ✅ |
| Page Login/Auth | ✅ | ✅ |
| Splash/Status | ✅ | ✅ |
| Sidebar | ❌ | ✅ |

**✅ COHÉRENT**

---

## 🔧 ARCHITECTURE - Différences d'Organisation

### Structure des Fichiers

#### Mobile GitHub
```
src/
├── data/
│   └── models.ts          ⚠️ Tous les types dans un fichier
├── lib/
│   ├── api.ts             ⚠️ Fichier volumineux (38k lignes)
│   ├── config.ts          ⚠️ Config partielle
│   └── hooks.ts
├── pages/                 ✅ 20 pages utilisateur
└── components/            ✅ Composants UI
```

#### Dashboard
```
/
├── contexts/
│   └── DataContext.tsx    ✅ Types + data management
├── config/
│   ├── business.ts        ✅ Config business centralisée
│   └── ui.ts              ✅ Config UI centralisée
├── pages/
│   ├── responsable/       ✅ 11 pages
│   ├── manager/           ✅ 7 pages
│   └── caissier/          ✅ 6 pages
└── components/            ✅ Composants dashboard
```

**📝 RECOMMANDATION:**
- Mobile: Créer `/src/config/business.ts` et `/src/config/ui.ts`
- Mobile: Diviser models.ts en plusieurs fichiers si trop volumineux

---

## 💰 BUSINESS MODEL - Analyse Critique

### Commission 5% sur Ventes Online

#### Dashboard ✅ IMPLÉMENTÉ
```typescript
// Type Ticket avec salesChannel
salesChannel: 'online' | 'counter'

// Calcul automatique
if (ticket.salesChannel === 'online') {
  ticket.commission = calculateCommission(ticket.price);
}
```

#### Mobile ❌ NON IMPLÉMENTÉ
```typescript
// Aucun champ salesChannel
// Aucun calcul de commission
```

**🔴 IMPACT BUSINESS:**
```
Scénario: 100 billets vendus à 5000 FCFA

❌ Situation actuelle:
- Dashboard peut tracker: ✅
- Mobile peut tracker: ❌
- Backend peut calculer: ❌ (données manquantes)

✅ Situation cible:
- 60 ventes online (app) → 60 × 250 FCFA = 15 000 FCFA commission
- 40 ventes counter (guichet) → 0 FCFA commission
- Total revenus FasoTravel: 15 000 FCFA
```

**Sans le champ `salesChannel`, impossible de:**
1. Calculer les revenus FasoTravel
2. Mesurer l'adoption de l'app mobile
3. Tracker les KPIs business critiques
4. Facturer correctement les sociétés de transport

---

## 📊 MÉTRIQUES BUSINESS - Comparaison

| Métrique | Dashboard | Mobile | Cohérence |
|----------|-----------|--------|-----------|
| Taux d'adoption app | ✅ Calcul complet | ❌ Impossible | 🔴 CRITIQUE |
| Commission totale | ✅ SalesChannelCard | ❌ N/A | 🔴 CRITIQUE |
| Ventes online vs counter | ✅ Dashboard | ❌ Impossible | 🔴 CRITIQUE |
| Taux de remplissage | ✅ Dashboard | ⚠️ Info partielle | 🟡 OK |
| Revenus par gare | ✅ Dashboard | ❌ N/A | ✅ NORMAL |

---

## 🔄 FLUX DE DONNÉES - Vente de Billet

### Flux Actuel (INCOMPLET)

```mermaid
Voyageur → App Mobile
                ↓
         [Achète billet]
                ↓
         POST /api/tickets
         {
           passengerName,
           seatNumber,
           price,
           // ❌ MANQUE: salesChannel
           // ❌ MANQUE: commission
         }
                ↓
           Backend (à créer)
                ↓
         Dashboard 
         (Ne peut pas distinguer online/counter)
```

### Flux Cible (À IMPLÉMENTER)

```mermaid
Voyageur → App Mobile
                ↓
         [Achète billet]
                ↓
         POST /api/tickets
         {
           passengerName,
           seatNumber,
           price,
           salesChannel: 'online', // ✅ AUTOMATIQUE
           paymentMethod: 'mobile_money'
         }
                ↓
           Backend
           ├─ Calcule commission (5%)
           └─ Enregistre avec salesChannel
                ↓
         Dashboard
         ├─ Affiche dans SalesChannelCard
         ├─ Calcule taux adoption
         └─ Génère analytics business
```

---

## 📋 PLAN D'ACTION COMPLET

### 🔴 Phase 1: URGENTE (Cette semaine)

#### 1.1 Mobile - Ajouter champs Ticket
```typescript
// src/data/models.ts
export interface Ticket {
  // ... champs existants
  salesChannel: 'online' | 'counter'; // 🆕 AJOUTER
  commission?: number; // 🆕 AJOUTER
}
```

#### 1.2 Mobile - Créer config business
```bash
mkdir -p src/config
```

```typescript
// src/config/business.ts (NOUVEAU FICHIER)
export const BUSINESS_CONFIG = {
  COMMISSION: {
    RATE: 0.05, // 5%
    MIN_AMOUNT: 100,
    DESCRIPTION: 'Commission FasoTravel sur ventes app mobile',
  },
  CANCELLATION: {
    FULL_REFUND_HOURS: 24,
    PARTIAL_REFUND_HOURS: 12,
    PARTIAL_REFUND_PERCENT: 50,
    ADMIN_FEE: 500,
  },
  VEHICLE_CAPACITY: {
    STANDARD: 45,
    VIP: 35,
    MINIBUS: 25,
  },
  // ... copier le reste depuis dashboard
};

export function calculateCommission(price: number): number {
  const commission = price * BUSINESS_CONFIG.COMMISSION.RATE;
  return Math.max(commission, BUSINESS_CONFIG.COMMISSION.MIN_AMOUNT);
}
```

#### 1.3 Mobile - Mettre à jour PaymentPage
```typescript
// src/pages/PaymentPage.tsx
const handlePayment = async () => {
  const ticketData = {
    // ... données existantes
    salesChannel: 'online', // ✅ TOUJOURS 'online' pour app mobile
    paymentMethod: selectedMethod,
  };
  
  await api.createTicket(ticketData);
};
```

---

### 🟡 Phase 2: IMPORTANTE (2 semaines)

#### 2.1 Harmoniser les types partagés
- Vérifier que `Station`, `Route`, `Trip` sont 100% identiques
- Documenter les différences acceptables

#### 2.2 Créer tests de cohérence
```typescript
// tests/coherence.test.ts
describe('Type Coherence', () => {
  it('Ticket type includes salesChannel', () => {
    const ticket: Ticket = { /* ... */ };
    expect(ticket).toHaveProperty('salesChannel');
  });
});
```

#### 2.3 Documentation partagée
Créer `SHARED_BUSINESS_RULES.md` dans les deux repos avec:
- Taux de commission officiel
- Politiques d'annulation
- Règles métier communes

---

### 🟢 Phase 3: AMÉLIORATION (1 mois)

#### 3.1 Monorepo (optionnel)
Considérer la création d'un monorepo avec package partagé:
```
fasotravel-platform/
├── packages/
│   ├── shared/          # Types, configs partagés
│   ├── mobile-app/      
│   ├── dashboard/       
│   └── backend/         
```

#### 3.2 CI/CD Checks
Automatiser la vérification de cohérence:
- Types identiques
- Configs synchronisées
- Tests de régression

---

## 📊 MATRICE COMPLÈTE DES INCOHÉRENCES

| # | Élément | Mobile | Dashboard | Priorité | Action |
|---|---------|--------|-----------|----------|--------|
| 1 | `Ticket.salesChannel` | ❌ | ✅ | 🔴 P0 | AJOUTER |
| 2 | `Ticket.commission` | ❌ | ✅ | 🔴 P0 | AJOUTER |
| 3 | `/config/business.ts` | ❌ | ✅ | 🔴 P0 | CRÉER |
| 4 | `calculateCommission()` | ❌ | ✅ | 🔴 P0 | CRÉER |
| 5 | Couleurs BF | ✅ | ✅ | ✅ OK | Aucune |
| 6 | Logo FasoTravel | ✅ | ✅ | ✅ OK | Aucune |
| 7 | `ScheduleTemplate` | ❌ | ✅ | ✅ NORMAL | Aucune (gestion) |
| 8 | `PricingRule` | ❌ | ✅ | ✅ NORMAL | Aucune (gestion) |
| 9 | `CashTransaction` | ❌ | ✅ | ✅ NORMAL | Aucune (gestion) |
| 10 | `Manager` / `Cashier` | ❌ | ✅ | ✅ NORMAL | Aucune (gestion) |
| 11 | Pages gestion | ❌ | ✅ | ✅ NORMAL | Aucune (rôles différents) |
| 12 | Config UI centralisée | ❌ | ✅ | 🟡 P2 | CRÉER |
| 13 | Tests cohérence | ❌ | ❌ | 🟡 P2 | CRÉER (les deux) |
| 14 | Documentation business | ⚠️ | ⚠️ | 🟡 P2 | AMÉLIORER (les deux) |

**Légende Priorités:**
- 🔴 P0: CRITIQUE - Bloquant business
- 🟡 P2: IMPORTANT - À faire rapidement
- 🟢 P3: AMÉLIORATION - Nice to have

---

## ✅ CHECKLIST DE VALIDATION

### Avant Déploiement Mobile
- [ ] `Ticket.salesChannel` ajouté
- [ ] `Ticket.commission` ajouté
- [ ] `/src/config/business.ts` créé
- [ ] Fonction `calculateCommission()` implémentée
- [ ] Tous les achats incluent `salesChannel: 'online'`
- [ ] Tests unitaires pour les nouveaux champs
- [ ] Documentation mise à jour

### Avant Déploiement Backend
- [ ] API accepte `salesChannel`
- [ ] Calcul automatique de `commission` si `salesChannel === 'online'`
- [ ] Validation: mobile = 'online', dashboard/caissier = 'counter'
- [ ] Migration base de données pour ajouter colonnes
- [ ] Tests d'intégration mobile ↔ backend

### Avant Déploiement Dashboard
- [ ] Dashboard peut afficher métriques avec `salesChannel`
- [ ] `SalesChannelCard` fonctionne correctement
- [ ] Analytics business incluent taux d'adoption
- [ ] Rapports commission fonctionnels

---

## 🎯 CONCLUSION & RECOMMANDATIONS

### Résumé Exécutif

| Aspect | Statut | Note |
|--------|--------|------|
| **Incohérences critiques** | 🔴 4 trouvées | Bloquant business |
| **Différences normales** | ✅ 4 identifiées | Fonctionnalités métier |
| **Cohérences** | ✅ 6 vérifiées | Identité visuelle OK |
| **Priorité globale** | 🔴 URGENTE | Mise à jour mobile P0 |

### Actions Immédiates (72h)

1. **Ajouter `salesChannel` et `commission` au type Ticket** (mobile)
2. **Créer `/src/config/business.ts`** (mobile)
3. **Mettre à jour PaymentPage** pour inclure `salesChannel: 'online'`

### Impact Estimé

**Sans correction:**
- ❌ Impossible de calculer revenus FasoTravel
- ❌ Impossible de mesurer taux adoption app
- ❌ Modèle business non viable

**Avec correction:**
- ✅ Tracking complet online vs counter
- ✅ Calcul automatique commissions
- ✅ Analytics business fonctionnels
- ✅ Modèle business opérationnel

### Prochaine Révision

**Recommandé:** Audit de cohérence après:
1. Implémentation backend (quand créé)
2. Première mise en production
3. Tous les 3 mois ensuite

---

**Généré le:** 19 Décembre 2025  
**Repos audités:**
- Mobile: `github.com/NAPONYAHASINE/FasoTravel`
- Dashboard: Application actuelle

**Contact:** Pour questions sur cet audit

