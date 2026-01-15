# 🔍 AUDIT DE COHÉRENCE - FasoTravel Mobile vs Dashboard

**Date:** 19 Décembre 2025  
**Repos comparés:**
- 📱 **Mobile:** `NAPONYAHASINE/FasoTravel` (Application utilisateur React)
- 💼 **Dashboard:** Application actuelle (Dashboard sociétés de transport)

---

## 📊 RÉSUMÉ EXÉCUTIF

### Statut Global: ⚠️ INCOHÉRENCES CRITIQUES DÉTECTÉES

| Aspect | Mobile | Dashboard | Cohérence |
|--------|---------|-----------|-----------|
| **Identité visuelle** | ✅ Couleurs BF | ✅ Couleurs BF | ✅ **COHÉRENT** |
| **Type Ticket** | ❌ Manque champs | ✅ Complet | ❌ **INCOHÉRENT** |
| **Business Model** | ❌ Pas de salesChannel | ✅ salesChannel + commission | ❌ **CRITIQUE** |
| **Configurations** | ⚠️ Dispersées | ✅ Centralisées | ⚠️ **À AMÉLIORER** |
| **Logo FasoTravel** | ✅ Présent | ✅ Présent | ✅ **COHÉRENT** |

---

## 🚨 INCOHÉRENCES CRITIQUES

### 1. ❌ Interface `Ticket` - INCOHÉRENCE MAJEURE

#### Dashboard (✅ À JOUR)
```typescript
// /contexts/DataContext.tsx
export interface Ticket {
  id: string;
  tripId: string;
  passengerName: string;
  passengerPhone: string;
  seatNumber: string;
  price: number;
  commission?: number; // 🆕 NOUVEAU CHAMP
  paymentMethod: 'cash' | 'mobile_money' | 'card' | 'online';
  salesChannel: 'online' | 'counter'; // 🆕 CRITIQUE: distinction ventes
  status: 'valid' | 'used' | 'refunded' | 'cancelled';
  purchaseDate: string;
  cashierId: string;
  cashierName: string;
  gareId: string;
  departure: string;
  arrival: string;
  departureTime: string;
}
```

#### Mobile GitHub (❌ MANQUE CHAMPS CRITIQUES)
```typescript
// Recherche dans repo: NO RESULTS pour "salesChannel"
// Recherche dans repo: NO RESULTS pour "commission"
```

**🔴 PROBLÈME:** L'application mobile ne peut PAS encore:
- Identifier si un billet a été vendu en ligne (via l'app) ou au guichet
- Calculer les commissions FasoTravel (5% sur ventes online)
- Tracker les métriques business critiques

---

### 2. ❌ Business Model - INCOHÉRENCE CRITIQUE

#### Dashboard (✅ Configuration complète)
```typescript
// /config/business.ts
export const BUSINESS_CONFIG = {
  COMMISSION: {
    RATE: 0.05, // 5% commission sur ventes app mobile
    MIN_AMOUNT: 100,
    DESCRIPTION: 'Commission sur ventes via app mobile FasoTravel',
  },
  // ... autres configs
}

export function calculateCommission(price: number): number {
  const commission = price * BUSINESS_CONFIG.COMMISSION.RATE;
  return Math.max(commission, BUSINESS_CONFIG.COMMISSION.MIN_AMOUNT);
}
```

#### Mobile GitHub (❌ PAS DE CONFIGURATION BUSINESS)
- ❌ Pas de fichier config/business.ts
- ❌ Pas de calcul de commission
- ❌ Pas de tracking salesChannel

**🔴 IMPACT:** Le business model FasoTravel repose sur la distinction entre:
- Ventes **en ligne** (app mobile) → Commission 5% pour FasoTravel
- Ventes **au guichet** (comptoir) → Pas de commission

Cette distinction est **absente** de l'app mobile GitHub !

---

### 3. ⚠️ Organisation du Code

#### Dashboard (✅ Bien structuré)
```
/config/
  ├── business.ts    ✅ Constantes métier centralisées
  └── ui.ts          ✅ Configuration UI centralisée
/contexts/
  ├── DataContext.tsx   ✅ Types globaux + data
  └── AuthContext.tsx   ✅ Authentication
```

#### Mobile GitHub (⚠️ À améliorer)
```
/src/lib/
  ├── api.ts         ✅ API (mais fichier trop volumineux)
  ├── config.ts      ⚠️ Config partielle
  └── hooks.ts       ✅ Hooks React
/src/data/
  └── models.ts      ✅ Types/interfaces
```

**💡 RECOMMANDATION:** Créer `/src/config/business.ts` dans l'app mobile

---

## ✅ ÉLÉMENTS COHÉRENTS

### 1. ✅ Identité Visuelle TransportBF

#### Couleurs du Drapeau Burkina Faso
Les deux applications utilisent **exactement les mêmes couleurs**:

| Couleur | Code Hex | Usage |
|---------|----------|-------|
| 🔴 Rouge | `#dc2626` | Erreurs, alertes, accents |
| 🟡 Jaune | `#f59e0b` | Warnings, highlights |
| 🟢 Vert | `#16a34a` | Success, validations |

**Vérification Mobile:**
```css
/* src/styles/globals.css - CONFIRMÉ */
--color-red: #dc2626;
--color-yellow: #f59e0b;
--color-green: #16a34a;
```

**Vérification Dashboard:**
```css
/* /styles/globals.css - CONFIRMÉ */
--color-transportbf-red: #dc2626;
--color-transportbf-yellow: #f59e0b;
--color-transportbf-green: #16a34a;
```

✅ **COHÉRENT** - Identité visuelle parfaitement alignée

---

### 2. ✅ Logo FasoTravel

Les deux applications utilisent le logo FasoTravel dans:
- Headers
- Pages de login
- Splash screens / Status pages

✅ **COHÉRENT**

---

### 3. ✅ Types de Base

#### Structures similaires pour:
- `Station`
- `Route`
- `Trip`
- `Manager`
- `Cashier`

**Note:** Légères variations dans certains champs optionnels, mais globalement cohérent.

---

## 📋 PLAN D'ACTION - SYNCHRONISATION

### Phase 1: Mise à Jour URGENTE App Mobile (Critique)

#### 1.1 Ajouter le champ `salesChannel` au type Ticket
```typescript
// À AJOUTER dans src/data/models.ts
export interface Ticket {
  // ... champs existants
  salesChannel: 'online' | 'counter'; // 🆕 AJOUTER
  commission?: number; // 🆕 AJOUTER (calculé côté backend)
}
```

#### 1.2 Créer `/src/config/business.ts`
```typescript
// NOUVEAU FICHIER à créer
export const BUSINESS_CONFIG = {
  COMMISSION: {
    RATE: 0.05, // 5%
    MIN_AMOUNT: 100,
  },
  // ... copier depuis dashboard
}
```

#### 1.3 Mettre à jour les appels API
Tous les achats de billets via l'app mobile doivent automatiquement:
```typescript
const ticketData = {
  // ... autres champs
  salesChannel: 'online', // ✨ Toujours 'online' pour app mobile
  paymentMethod: selectedPaymentMethod,
};
```

---

### Phase 2: Harmonisation Configurations

#### 2.1 Centraliser les configs dans les deux apps
- ✅ Dashboard: Déjà fait (`/config/business.ts`, `/config/ui.ts`)
- ❌ Mobile: À créer (`/src/config/business.ts`, `/src/config/ui.ts`)

#### 2.2 Créer un fichier de vérité unique
Créer `/SHARED_CONFIG.md` dans les deux repos avec:
- Taux de commission officiel
- Politiques d'annulation
- Règles métier

---

### Phase 3: Documentation Partagée

#### 3.1 Créer un guide de synchronisation
Document expliquant comment maintenir la cohérence entre:
- Types TypeScript
- Business logic
- Configurations

#### 3.2 Checklist de release
Avant chaque release, vérifier:
- [ ] Types Ticket identiques
- [ ] Configs business synchronisées
- [ ] Couleurs identiques
- [ ] Logo à jour

---

## 🔧 ACTIONS IMMÉDIATES REQUISES

### Pour l'App Mobile GitHub (Priorité 1)

```bash
# 1. Créer le dossier de config
mkdir src/config

# 2. Créer business.ts
cat > src/config/business.ts << 'EOF'
// Copier depuis dashboard /config/business.ts
EOF

# 3. Mettre à jour models.ts
# Ajouter salesChannel et commission à l'interface Ticket

# 4. Mettre à jour tous les composants d'achat
# Assurer que salesChannel = 'online' pour toutes les ventes app
```

### Pour le Backend (Quand créé)

Le backend doit:
1. ✅ Accepter le champ `salesChannel` dans POST /api/tickets
2. ✅ Calculer automatiquement `commission` si `salesChannel === 'online'`
3. ✅ Valider que:
   - Ventes mobile → toujours `salesChannel: 'online'`
   - Ventes dashboard caissier → toujours `salesChannel: 'counter'`

---

## 📊 MATRICE DE COHÉRENCE DÉTAILLÉE

| Élément | Mobile | Dashboard | Action Requise |
|---------|---------|-----------|----------------|
| **Types de données** ||||
| `Ticket.salesChannel` | ❌ Absent | ✅ Présent | 🔴 AJOUTER à mobile |
| `Ticket.commission` | ❌ Absent | ✅ Présent | 🔴 AJOUTER à mobile |
| `Station` | ✅ OK | ✅ OK | ✅ Aucune |
| `Route` | ✅ OK | ✅ OK | ✅ Aucune |
| `Trip` | ✅ OK | ✅ OK | ✅ Aucune |
| **Business Logic** ||||
| Commission 5% | ❌ Absent | ✅ Présent | 🔴 AJOUTER à mobile |
| Politiques annulation | ⚠️ Partiel | ✅ Complet | 🟡 HARMONISER |
| Capacités véhicules | ⚠️ Hardcodé | ✅ Config | 🟡 CENTRALISER |
| **Configuration** ||||
| Fichier business.ts | ❌ Absent | ✅ Présent | 🔴 CRÉER mobile |
| Fichier ui.ts | ❌ Absent | ✅ Présent | 🟡 CRÉER mobile |
| **Identité visuelle** ||||
| Couleurs BF | ✅ OK | ✅ OK | ✅ Aucune |
| Logo FasoTravel | ✅ OK | ✅ OK | ✅ Aucune |
| Dark mode | ✅ OK | ✅ OK | ✅ Aucune |

---

## 📝 RECOMMANDATIONS STRATÉGIQUES

### 1. Créer un Monorepo (Long terme)
Considérer la création d'un monorepo avec:
```
fasotravel-platform/
├── packages/
│   ├── shared/          # Types, configs partagés
│   ├── mobile-app/      # App React mobile
│   ├── dashboard/       # Dashboard sociétés
│   └── backend/         # API commune
```

**Avantages:**
- Un seul fichier de vérité pour les types
- Configs partagées automatiquement
- Plus facile à maintenir

### 2. Versioning des Types
Utiliser un système de versioning pour les interfaces:
```typescript
// v1.0.0
export interface TicketV1 {
  // Sans salesChannel
}

// v2.0.0
export interface Ticket {
  // Avec salesChannel
}
```

### 3. Tests de Cohérence Automatisés
Créer des tests qui vérifient:
- Types identiques entre mobile et dashboard
- Configurations synchronisées
- Couleurs identiques

---

## ✅ CHECKLIST DE MISE EN CONFORMITÉ

### Immédiat (Cette semaine)
- [ ] Ajouter `salesChannel` à l'interface Ticket (mobile)
- [ ] Ajouter `commission` à l'interface Ticket (mobile)
- [ ] Créer `/src/config/business.ts` (mobile)
- [ ] Mettre à jour tous les achats pour inclure `salesChannel: 'online'`

### Court terme (2 semaines)
- [ ] Créer `/src/config/ui.ts` (mobile)
- [ ] Harmoniser les politiques d'annulation
- [ ] Centraliser les capacités véhicules dans config
- [ ] Documenter le business model dans README

### Moyen terme (1 mois)
- [ ] Créer un package partagé pour les types
- [ ] Implémenter des tests de cohérence
- [ ] Mettre en place CI/CD checks pour vérifier la synchronisation

---

## 🎯 CONCLUSION

### Problèmes Critiques Identifiés
1. 🔴 **CRITIQUE:** L'app mobile ne supporte pas encore le système de canaux de vente
2. 🔴 **CRITIQUE:** Pas de calcul de commission dans l'app mobile
3. 🟡 **Important:** Configurations dispersées vs centralisées

### Ce Qui Fonctionne Bien
1. ✅ Identité visuelle parfaitement cohérente
2. ✅ Logo FasoTravel utilisé partout
3. ✅ Types de base (Station, Route, Trip) cohérents

### Prochaines Étapes
1. **Mise à jour URGENTE** de l'app mobile pour ajouter `salesChannel` et `commission`
2. **Création** du fichier `/src/config/business.ts` dans l'app mobile
3. **Documentation** du business model pour les deux équipes
4. **Tests** pour vérifier la cohérence avant chaque release

---

**Généré le:** 19 Décembre 2025  
**Repos audités:**
- Mobile: `github.com/NAPONYAHASINE/FasoTravel`
- Dashboard: Application actuelle

**Prochain audit recommandé:** Après implémentation du backend

