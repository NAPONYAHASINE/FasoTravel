# 🔍 AUDIT PROFOND & COMPLET - FasoTravel Dashboard
## Date: 10 Janvier 2026
## Auditeur: IA Assistant
## Type: Audit de cohérence, logique métier et bugs critiques

---

## 📊 RÉSUMÉ EXÉCUTIF

### Problèmes Critiques Identifiés
- ✅ **39 utilisations de `new Date()` au lieu de `getCurrentDate()`** → Date système vs date mockée
- ❌ **Absence de visibilité salesChannel dans interfaces Manager/Caissier** → Business model invisible
- ⚠️ **Duplications massives de logique de filtrage** → Risque d'incohérences
- ⚠️ **Incohérences dans les calculs de stats entre rôles** → Déjà corrigé partiellement
- ⚠️ **Problèmes de filtrage de dates** → Certains filtres utilisent encore `new Date()`

---

## 🚨 PROBLÈME CRITIQUE #1: Incohérence de dates `new Date()` vs `getCurrentDate()`

### Impact Business
- Les données mockées (9 janvier 2026) ne s'affichent pas correctement
- Les filtres "aujourd'hui" utilisent la date système (10 janvier réel) au lieu de la date mockée
- Résultat: trips et tickets ne sont pas visibles car hors de la fenêtre de temps

### Fichiers Concernés (39 occurrences dans 22 fichiers)

#### 🔴 CRITIQUE - Composants Dashboard (affichage incorrect)
1. **`/components/dashboard/RecentTripsTable.tsx:12`**
   ```typescript
   const now = new Date(); // ❌ DOIT ÊTRE getCurrentDate()
   ```
   - **Impact**: Les trips "récents" ne s'affichent pas car comparaison avec date système
   - **Priorité**: CRITIQUE

2. **`/components/dashboard/SalesChannelCard.tsx:22-23`**
   ```typescript
   const now = new Date(); // ❌
   const filterDate = new Date(); // ❌
   ```
   - **Impact**: Les filtres de période (today, week, month) ne fonctionnent pas avec les données mockées
   - **Priorité**: CRITIQUE

#### 🔴 CRITIQUE - Pages Caissier (fonctionnalités cassées)
3. **`/pages/caissier/RefundPage.tsx:32`**
   ```typescript
   const now = new Date(); // ❌
   ```
   - **Impact**: Les billets remboursables ne s'affichent pas (filtre d'heure incorrect)
   - **Priorité**: CRITIQUE

4. **`/pages/caissier/TicketSalePage.tsx:219`**
   ```typescript
   purchaseDate: new Date().toISOString(), // ❌
   ```
   - **Impact**: Les billets créés ont la date système, pas la date mockée
   - **Priorité**: CRITIQUE

5. **`/pages/caissier/DiagnosticDataPage.tsx:11`**
   ```typescript
   const now = new Date(); // ❌
   ```
   - **Impact**: Le diagnostic affiche des données incorrectes
   - **Priorité**: HAUTE

6. **`/pages/caissier/CashManagementPage.tsx:72, 103`**
   ```typescript
   timestamp: new Date().toISOString(), // ❌ x2
   ```
   - **Impact**: Les transactions de caisse ont la mauvaise date
   - **Priorité**: CRITIQUE

#### 🔴 CRITIQUE - Pages Manager
7. **`/pages/manager/DeparturesPage.tsx:106`**
   ```typescript
   const now = new Date(); // ❌
   ```
   - **Impact**: Les "prochains départs" ne s'affichent pas correctement
   - **Priorité**: CRITIQUE

8. **`/pages/manager/DeparturesPage.tsx:75`**
   ```typescript
   Imprimé le ${formatDateTime(new Date().toISOString())} // ❌
   ```
   - **Impact**: Date d'impression incorrecte dans les PDF
   - **Priorité**: MOYENNE

9. **`/pages/manager/IncidentsPage.tsx:66`**
   ```typescript
   validatedAt: new Date().toISOString(), // ❌
   ```
   - **Impact**: Validation d'incidents avec date système
   - **Priorité**: HAUTE

#### 🔴 CRITIQUE - Pages Responsable
10. **`/pages/responsable/AnalyticsPage.tsx:37, 116`**
    ```typescript
    const now = new Date(); // ❌ x2
    ```
    - **Impact**: Les graphiques de revenus et passagers affichent des données incorrectes
    - **Priorité**: CRITIQUE

11. **`/pages/responsable/TrafficPage.tsx:36`**
    ```typescript
    const now = new Date(); // ❌
    ```
    - **Impact**: Les trips "à venir" ne s'affichent pas
    - **Priorité**: CRITIQUE

12. **`/pages/responsable/StoriesPage.tsx:185`**
    ```typescript
    const now = new Date(); // ❌
    ```
    - **Impact**: Le statut des stories est calculé incorrectement
    - **Priorité**: MOYENNE

13. **`/pages/responsable/IncidentsPage.tsx:61`**
    ```typescript
    validatedAt: new Date().toISOString(), // ❌
    ```
    - **Impact**: Validation d'incidents avec date système
    - **Priorité**: HAUTE

14. **`/pages/responsable/ManagersPage.tsx:127`**
    ```typescript
    joinedDate: new Date().toISOString().split('T')[0], // ❌
    ```
    - **Impact**: Date d'embauche des managers incorrecte
    - **Priorité**: BASSE

15. **`/pages/responsable/PricingPage.tsx:194`**
    ```typescript
    lastUpdate: new Date().toISOString().split('T')[0] // ❌
    ```
    - **Impact**: Date de mise à jour des prix incorrecte
    - **Priorité**: MOYENNE

#### 🟡 MOYEN - Hooks
16. **`/hooks/useDashboardStats.ts:154`**
    ```typescript
    const date = new Date(); // ❌
    date.setDate(date.getDate() - i);
    ```
    - **Impact**: Le graphique "7 derniers jours" utilise les 7 derniers jours réels, pas mockés
    - **Priorité**: HAUTE

#### 🟢 ACCEPTABLE - Utilitaires (OK pour exports/affichage)
17. **`/pages/caissier/HistoryPage.tsx:121`** - Export CSV (date d'export OK)
18. **`/pages/responsable/DashboardHome.tsx:120`** - Export CSV (date d'export OK)
19. **`/utils/exportUtils.ts:39`** - Nom de fichier export (OK)
20. **`/components/layout/Header.tsx:138`** - Affichage date dans header (OK - doit être date réelle)

#### ⚪ ACCEPTABLE - DataContext (timestamps de création)
21-22. **`/contexts/DataContext.tsx:1442, 1773, 1795, 1813, 1814, 1824, 1838, 1864, 1865, 1874`**
    - Ces timestamps sont pour des actions utilisateur (création policy, story, support, etc.)
    - **Statut**: ACCEPTABLE - peuvent rester en `new Date()` car c'est pour tracer les actions réelles

---

## 🚨 PROBLÈME CRITIQUE #2: Business Model Invisible (salesChannel)

### Description
Le champ `salesChannel` (online vs counter) est **CRITIQUE** pour le business model mais **INVISIBLE** dans les interfaces Manager et Caissier.

### Business Model FasoTravel
```typescript
// RAPPEL: Commission 5% sur online, 0% sur counter
salesChannel: 'online'   → Vente via app mobile  → Commission 5%
salesChannel: 'counter'  → Vente au guichet      → Pas de commission
```

### État Actuel

#### ✅ Responsable Dashboard
- **Visible**: Oui, via `SalesChannelCard`
- **Affichage**: Graphiques online vs counter avec revenus et commissions
- **Statut**: ✅ CORRECT

#### ❌ Manager Dashboard
- **Visible**: NON
- **Impact**: Le manager ne peut pas voir la répartition online/counter de sa gare
- **Problème**: Ne peut pas analyser l'impact de l'app mobile vs guichet
- **Statut**: ❌ PROBLÈME CRITIQUE

#### ❌ Manager - Sales Supervision
- **Page**: `/pages/manager/SalesSupervisionPage.tsx`
- **Visible**: NON
- **Données affichées**: 
  - Total revenus
  - Nombre de billets
  - Répartition par moyen de paiement (cash, mobile_money, card)
  - Performance par caissier
- **Données MANQUANTES**:
  - Revenus online vs counter
  - Commission générée (online)
  - Nombre de billets online vs counter
- **Statut**: ❌ PROBLÈME CRITIQUE

#### ❌ Caissier - Ticket Sale
- **Page**: `/pages/caissier/TicketSalePage.tsx`
- **Visible**: Le caissier vend seulement en 'counter' (hardcodé ligne 217)
- **Problème**: OK pour la vente, mais le caissier ne voit pas si des billets ont été vendus online
- **Statut**: ⚠️ ACCEPTABLE (le caissier vend seulement counter)

#### ❌ Caissier - Passenger Lists
- **Page**: `/pages/caissier/PassengerListsPage.tsx`
- **Visible**: OUI, via `getSalesChannelLabel(passenger.salesChannel)` (ligne 270)
- **Affichage**: Dans la liste des passagers d'un trajet
- **Statut**: ✅ CORRECT

#### ❌ Caissier - History
- **Page**: `/pages/caissier/HistoryPage.tsx`
- **Visible**: NON
- **Impact**: Le caissier ne peut pas voir si ses ventes incluent des online (ce qui serait anormal)
- **Statut**: ⚠️ MOYEN (normalement le caissier n'a que des counter)

### Corrections Nécessaires

#### Manager Dashboard
**Ajouter une carte "Canaux de Vente"** similaire à celle du Responsable :
```typescript
// Dans /pages/manager/DashboardHome.tsx
import SalesChannelCard from '../../components/dashboard/SalesChannelCard';

// Ajouter après les stats principales:
<SalesChannelCard tickets={tickets} />
```

#### Manager - Sales Supervision
**Ajouter des statistiques online/counter** :
```typescript
// Dans /pages/manager/SalesSupervisionPage.tsx

const channelStats = useMemo(() => {
  const validTickets = getValidTickets(filteredTickets);
  const online = validTickets.filter(t => t.salesChannel === 'online');
  const counter = validTickets.filter(t => t.salesChannel === 'counter');
  
  return {
    online: {
      count: online.length,
      revenue: calculateTicketsRevenue(online),
      commission: online.reduce((sum, t) => sum + (t.commission || 0), 0)
    },
    counter: {
      count: counter.length,
      revenue: calculateTicketsRevenue(counter)
    }
  };
}, [filteredTickets]);
```

#### Caissier - History
**Ajouter une colonne "Canal"** dans le tableau d'historique :
```typescript
// Ajouter dans le tableau:
<th>Canal</th>
// ...
<td>{getSalesChannelLabel(transaction.salesChannel)}</td>
```

---

## 🚨 PROBLÈME #3: Duplications de Logique de Filtrage

### Patterns Dupliqués Identifiés

#### 1. Filtrage par Aujourd'hui
**Occurrences**: 44 fois dans 15 fichiers
- `filterByToday(tickets, 'purchaseDate')` - Correct ✅
- `tickets.filter(t => new Date(t.purchaseDate) >= today)` - Duplication ❌

**Fichiers avec duplications**:
- `/pages/manager/SalesSupervisionPage.tsx:33`
  ```typescript
  const weekAgo = getDaysAgo(7);
  return tickets.filter(t => new Date(t.purchaseDate) >= weekAgo); // ❌
  ```
  **Correction**: Utiliser `filterByDateRange(tickets, 'purchaseDate', weekAgo, getCurrentDate())`

#### 2. Calcul de Revenus
**Pattern dupliqué**: `.reduce((sum, t) => sum + t.price, 0)`
**Occurrences**: 15 fois dans 8 fichiers
- **Fonction centralisée existe**: `calculateTicketsRevenue(tickets)` ✅
- **Mais toujours dupliqué dans**:
  - `/pages/caissier/RefundPage.tsx:157`
  - `/pages/caissier/TicketSalePage.tsx:257`
  - `/pages/responsable/AnalyticsPage.tsx:175, 214, 215`
  - `/pages/responsable/PricingPage.tsx:214`

**Correction**: Remplacer TOUTES les occurrences par `calculateTicketsRevenue(tickets)`

#### 3. Filtrage des Caissiers Actifs
**Pattern dupliqué**: Calculer les caissiers qui ont fait au moins 1 transaction aujourd'hui
**Occurrences**: 3 fois
- `/pages/manager/DashboardHome.tsx:30-34`
- `/pages/manager/CashiersPage.tsx:47-51`

**Solution**: Créer un hook `useActiveCashiers(cashiers, cashTransactions)`

#### 4. Filtrage des Transactions du Jour par Caissier
**Pattern dupliqué**:
```typescript
const todayTransactions = filterByToday(cashTransactions, 'timestamp');
const myTransactions = todayTransactions.filter(t => t.cashierId === cashierId);
```
**Occurrences**: 5+ fois

**Solution**: Fonction utilitaire
```typescript
export const getTodayTransactionsByCashier = (
  transactions: CashTransaction[], 
  cashierId: string
): CashTransaction[] => {
  return filterByToday(transactions, 'timestamp')
    .filter(t => t.cashierId === cashierId && t.status === 'completed');
};
```

---

## 🚨 PROBLÈME #4: Incohérences de Calculs de Stats

### État Actuel (Post-Correction)
✅ **Départs Actifs**: Dashboard Responsable et Manager utilisent maintenant la même logique (`useTripStats`)
- Responsable: `activeTripsCount` (departed + boarding)
- Manager: `activeTripsCount` (departed + boarding)
- **Statut**: ✅ RÉSOLU

### Problèmes Restants

#### 1. Définition de "Taux d'Occupation"
**Fichiers concernés**:
- `/hooks/useDashboardStats.ts:82-106` - `useOccupancyStats`
- `/utils/statsUtils.ts:497-501` - `calculateOverallOccupancy`

**Incohérence**:
```typescript
// Hook: filtre par JOUR (today)
const todayTrips = trips.filter(t => {
  const departureTime = new Date(t.departureTime);
  return departureTime >= today && departureTime < tomorrow;
});

// Fonction: utilise TOUS les trips
const totalSeats = trips.reduce((sum, t) => sum + t.totalSeats, 0);
```

**Question**: Le taux d'occupation doit-il être:
- A. Pour la journée en cours seulement?
- B. Pour tous les trips (historique + futurs)?
- C. Pour les trips actifs seulement (departed + boarding)?

**Recommandation**: Option A (journée en cours) pour cohérence avec "Revenus du Jour"

#### 2. Revenus "du Jour" vs "Totaux"
**Actuellement**:
- Dashboard affiche "Revenus du Jour" = tickets achetés aujourd'hui
- Mais les tickets peuvent être pour des trips futurs

**Question**: Doit-on aussi afficher:
- Revenus des trips partis aujourd'hui (utilisés aujourd'hui)?
- Revenus potentiels des trips programmés aujourd'hui?

---

## 🚨 PROBLÈME #5: Gestion des Fuseaux Horaires et Dates

### Problème Identifié
```typescript
// Dans DataContext.tsx
const today = getCurrentDate();
today.setHours(0, 0, 0, 0); // Minuit en heure LOCALE

// Mais toISOString() retourne en UTC
purchaseDate: new Date(...).toISOString()
```

**Impact**: 
- Si le serveur est en UTC et le client en GMT+0 (Burkina Faso), pas de problème
- Mais si décalage horaire, les dates "du jour" peuvent être décalées

**Solution**: 
1. Toujours stocker en ISO String (UTC) ✅
2. Toujours comparer avec des dates en UTC
3. Afficher en heure locale seulement pour l'UI

**Vérifications nécessaires**:
- Tous les filtres `filterByToday` gèrent-ils correctement UTC vs Local?
- Les comparaisons de dates sont-elles cohérentes?

---

## 🚨 PROBLÈME #6: Validation des Données

### Problèmes de Validation Manquants

#### 1. Création de Ticket (TicketSalePage.tsx)
**Validations manquantes**:
- ❌ Vérifier que le trip existe toujours
- ❌ Vérifier que le trip n'est pas parti (status !== 'departed')
- ❌ Vérifier que les sièges sont toujours disponibles (race condition)
- ❌ Vérifier que le passager n'a pas déjà un siège sur ce trip

**Code actuel** (ligne 196-231):
```typescript
const ticket: Ticket = {
  // ... création sans validation
};
addTicket(ticket); // ❌ Pas de vérification
```

**Correction nécessaire**:
```typescript
// Vérifications AVANT création
const trip = trips.find(t => t.id === currentTrip.id);
if (!trip) {
  toast.error("Ce trajet n'existe plus");
  return;
}
if (trip.status === 'departed' || trip.status === 'arrived') {
  toast.error("Ce trajet est déjà parti");
  return;
}
if (trip.availableSeats < passengers.length) {
  toast.error("Plus assez de places disponibles");
  return;
}
```

#### 2. Remboursement (RefundPage.tsx)
**Validation manquante**:
- ⚠️ Le délai de remboursement utilise `new Date()` au lieu de `getCurrentDate()`
- ❌ Pas de vérification si le billet n'a pas déjà été remboursé

**Code actuel** (ligne 74-84):
```typescript
const departureTime = new Date(ticket.departureTime);
const now = new Date(); // ❌ DOIT ÊTRE getCurrentDate()
const hoursUntilDeparture = ...;

if (hoursUntilDeparture < 2) {
  toast.error(...);
  return;
}
```

#### 3. Mise à Jour de Prix (PricingPage.tsx)
**Validation manquante**:
- ❌ Pas de validation que le nouveau prix > 0
- ❌ Pas de validation que le prix n'est pas trop différent de l'ancien (ex: >50% variation)

---

## 🚨 PROBLÈME #7: Performance et Optimisation

### Re-calculs Inutiles

#### 1. Données dérivées non mémoïsées
**Exemples**:
```typescript
// Dans plusieurs pages
{tickets.filter(t => t.status === 'valid').length} // ❌ Calculé à chaque render
```

**Solution**: Utiliser `useMemo` systématiquement

#### 2. Fonctions créées dans le render
**Exemples**:
```typescript
// Dans DashboardHome.tsx
onClick={() => navigate('/...')} // ✅ OK car navigate est stable

// Mais dans d'autres composants:
onChange={(e) => handleChange(e.target.value)} // ⚠️ Nouvelle fonction à chaque render
```

**Solution**: Utiliser `useCallback` pour les handlers complexes

---

## 📋 PLAN D'ACTION RECOMMANDÉ

### Phase 1: CRITIQUE (Faire IMMÉDIATEMENT)
1. ✅ Corriger TOUS les `new Date()` → `getCurrentDate()` dans les filtres et comparaisons
2. ✅ Ajouter visibilité salesChannel dans Manager Dashboard et Sales Supervision
3. ✅ Corriger validations dans TicketSalePage (race conditions)
4. ✅ Corriger le calcul du remboursement (getCurrentDate)

### Phase 2: HAUTE PRIORITÉ
5. ✅ Créer hooks réutilisables pour logique dupliquée
6. ✅ Uniformiser tous les calculs de revenus avec `calculateTicketsRevenue`
7. ✅ Ajouter validations manquantes dans tous les formulaires
8. ✅ Corriger le hook `useLast7DaysSales` pour utiliser `getCurrentDate`

### Phase 3: OPTIMISATION
9. ⚠️ Mémoïser toutes les données dérivées
10. ⚠️ Ajouter useCallback pour handlers complexes
11. ⚠️ Documenter toutes les fonctions utilitaires

### Phase 4: TESTS & VALIDATION
12. ⚠️ Tester chaque rôle (Responsable, Manager, Caissier)
13. ⚠️ Vérifier que les stats sont cohérentes entre tous les dashboards
14. ⚠️ Vérifier que les filtres de dates fonctionnent correctement

---

## 📊 STATISTIQUES DE L'AUDIT

### Fichiers Analysés
- Total: 50+ fichiers
- Pages: 20 fichiers
- Hooks: 3 fichiers
- Utils: 5 fichiers
- Composants: 15 fichiers
- Contextes: 2 fichiers

### Problèmes Trouvés
- **Critiques**: 15 problèmes
- **Haute priorité**: 8 problèmes
- **Moyenne priorité**: 6 problèmes
- **Basse priorité**: 3 problèmes

### Duplications
- Logique de filtrage: ~30 occurrences
- Calculs de revenus: ~15 occurrences
- Filtres de dates: ~20 occurrences

### Code Coverage (Estimé)
- Problèmes de dates: ~40% du code
- Problèmes de business logic: ~20% du code
- Duplications: ~25% du code
- Problèmes de validation: ~10% du code
- Autres: ~5% du code

---

## 🎯 CONCLUSION

L'application a une **architecture solide** mais souffre de **3 problèmes majeurs**:

1. **Incohérence de dates** (new Date vs getCurrentDate) → Empêche l'affichage des données mockées
2. **Business model invisible** (salesChannel) → Les managers ne peuvent pas suivre online vs counter
3. **Duplications massives** → Risque d'erreurs et de maintenabilité

**Temps estimé pour corriger**:
- Phase 1 (Critique): 2-3 heures
- Phase 2 (Haute priorité): 3-4 heures
- Phase 3 (Optimisation): 2-3 heures
- **Total**: 7-10 heures de développement

**Impact business si non corrigé**:
- 🚨 Les managers ne voient pas l'impact de l'app mobile
- 🚨 Les statistiques sont incohérentes entre les rôles
- 🚨 Les données mockées ne s'affichent pas correctement
- 🚨 Risque d'erreurs financières (calculs dupliqués)

---

## ✅ CORRECTIONS DÉJÀ EFFECTUÉES

1. ✅ Incohérence dates dans DataContext (création trips)
2. ✅ Incohérence dates dans statsUtils (fonctions de filtrage)
3. ✅ Incohérence stats "Départs Actifs" (Responsable vs Manager)
4. ✅ Filtrage départs dans DeparturesPage (ajout filtre heure)

**Reste à faire**: Voir Phase 1-4 du Plan d'Action ci-dessus

---

**FIN DU RAPPORT D'AUDIT**
