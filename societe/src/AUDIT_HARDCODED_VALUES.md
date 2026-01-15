# 🔍 AUDIT COMPLET - VALEURS HARDCODÉES

**Date:** ${new Date().toLocaleDateString('fr-FR')}  
**Objectif:** Identifier toutes les valeurs hardcodées dans l'application TransportBF Dashboard

---

## 📊 RÉSUMÉ EXÉCUTIF

| Catégorie | Nombre | Statut | Action Requise |
|-----------|--------|--------|----------------|
| **✅ Mock Data (OK)** | ~200 | Acceptable | Remplacer par API réelle |
| **⚠️ Configuration Business** | 8 | À extraire | Créer fichier config |
| **⚠️ Seuils UI** | 6 | À extraire | Créer thèmes/config |
| **✅ Calculs Temporels** | ~30 | OK | Logique métier valide |
| **🟢 TOTAL CRITIQUE** | **14** | **À corriger** | **Priorité moyenne** |

---

## 🚨 CATÉGORIE 1: CONFIGURATION BUSINESS (Critique)

### 1.1 Taux de Commission
**Fichier:** `/contexts/DataContext.tsx:602`

```typescript
commission: method === 'online' ? trip.price * 0.05 : undefined
```

**Problème:** Commission de **5%** hardcodée  
**Impact:** Business model rigide  
**Solution:**

```typescript
// Créer fichier /config/business.ts
export const BUSINESS_CONFIG = {
  COMMISSION_RATE: 0.05, // 5%
  COMMISSION_DESCRIPTION: 'Commission sur ventes en ligne',
  MINIMUM_COMMISSION: 100, // FCFA minimum
};

// Utiliser dans DataContext
import { BUSINESS_CONFIG } from '../config/business';
commission: method === 'online' ? trip.price * BUSINESS_CONFIG.COMMISSION_RATE : undefined
```

---

### 1.2 Objectif Adoption App
**Fichier:** `/components/dashboard/SalesChannelCard.tsx:149-151`

```typescript
{adoptionRate >= 60 
  ? '✓ Objectif atteint (60%+)' 
  : `Objectif: 60% (${60 - adoptionRate}% à atteindre)`
}
```

**Problème:** Objectif **60%** hardcodé (apparaît 2 fois)  
**Impact:** Objectifs non configurables  
**Solution:**

```typescript
// Dans /config/business.ts
export const BUSINESS_CONFIG = {
  // ... autres configs
  APP_ADOPTION_TARGET: 60, // Objectif 60%
  APP_ADOPTION_MIN_GOOD: 50, // Seuil "bon" 50%
};

// Utiliser dans SalesChannelCard
import { BUSINESS_CONFIG } from '../../config/business';

{adoptionRate >= BUSINESS_CONFIG.APP_ADOPTION_TARGET 
  ? `✓ Objectif atteint (${BUSINESS_CONFIG.APP_ADOPTION_TARGET}%+)` 
  : `Objectif: ${BUSINESS_CONFIG.APP_ADOPTION_TARGET}% (${BUSINESS_CONFIG.APP_ADOPTION_TARGET - adoptionRate}% à atteindre)`
}
```

---

### 1.3 Prix des Routes
**Fichier:** `/contexts/DataContext.tsx:292-296`

```typescript
const initialRoutes: Route[] = [
  { ..., basePrice: 5000, ... }, // Ouagadougou → Bobo
  { ..., basePrice: 2000, ... }, // Ouagadougou → Koudougou
  { ..., basePrice: 3500, ... }, // Ouagadougou → Ouahigouya
  { ..., basePrice: 5000, ... }, // Bobo → Ouagadougou
  { ..., basePrice: 2000, ... }, // Koudougou → Ouagadougou
];
```

**Problème:** Prix de base hardcodés  
**Impact:** ✅ **ACCEPTABLE** pour mock data  
**Action:** Remplacer par API backend quand connecté à Supabase

---

### 1.4 Capacité des Bus
**Fichier:** `/contexts/DataContext.tsx:302-324`

```typescript
totalSeats: 45  // Standard (15 occurrences)
totalSeats: 35  // VIP (2 occurrences)
```

**Problème:** Capacités hardcodées  
**Impact:** ✅ **ACCEPTABLE** - Correspond aux bus réels burkinabè  
**Note:** 45 places = bus standard, 35 places = VIP plus spacieux  
**Action:** Peut rester ainsi ou extraire dans config véhicules

---

## ⚠️ CATÉGORIE 2: SEUILS UI / UX

### 2.1 Seuil Remplissage Bus
**Fichier:** `/components/dashboard/RecentTripsTable.tsx:80`

```typescript
const fillColor = fillPercentage >= 80 ? '#16a34a' : fillPercentage >= 50 ? '#f59e0b' : '#dc2626';
```

**Problème:** Seuils **80%** et **50%** hardcodés  
**Impact:** Indicateurs visuels non configurables  
**Solution:**

```typescript
// Dans /config/ui.ts
export const UI_THRESHOLDS = {
  BUS_FILL_EXCELLENT: 80, // Vert
  BUS_FILL_GOOD: 50,      // Jaune
  // < 50% = Rouge
};

// Utiliser
const fillColor = 
  fillPercentage >= UI_THRESHOLDS.BUS_FILL_EXCELLENT ? '#16a34a' : 
  fillPercentage >= UI_THRESHOLDS.BUS_FILL_GOOD ? '#f59e0b' : 
  '#dc2626';
```

---

### 2.2 Badge Adoption App
**Fichier:** `/components/dashboard/SalesChannelCard.tsx:73-74`

```typescript
variant={adoptionRate >= 50 ? 'default' : 'secondary'} 
className={adoptionRate >= 50 ? 'bg-green-600' : 'bg-orange-500'}
```

**Problème:** Seuil **50%** hardcodé  
**Impact:** Lié à BUSINESS_CONFIG.APP_ADOPTION_MIN_GOOD  
**Solution:** Utiliser `BUSINESS_CONFIG.APP_ADOPTION_MIN_GOOD`

---

### 2.3 Taux d'Occupation Mock
**Fichier:** `/contexts/DataContext.tsx:381`

```typescript
const soldSeats = departureDate < now ? totalSeats : Math.floor(Math.random() * totalSeats * 0.6);
```

**Problème:** Mock occupancy max **60%**  
**Impact:** ✅ **OK** - Juste pour mock data réaliste  
**Action:** Sera remplacé par vraies données

---

## ✅ CATÉGORIE 3: CALCULS TEMPORELS (OK)

### 3.1 Périodes de Filtrage
**Répartition dans pages:**

- `today.setHours(0, 0, 0, 0)` → Début de journée (30+ occurrences)
- `yesterday.setDate(yesterday.getDate() - 1)` → Hier (7 occurrences)
- `startDate.setDate(now.getDate() - 7)` → 7 jours (2 occurrences)
- `startDate.setDate(now.getDate() - 30)` → 30 jours (2 occurrences)

**Statut:** ✅ **ACCEPTABLE**  
**Raison:** Ce sont des périodes standard de reporting  
**Option:** Extraire si vous voulez des périodes configurables

```typescript
// Optionnel: /config/time.ts
export const TIME_PERIODS = {
  WEEK_DAYS: 7,
  MONTH_DAYS: 30,
  UPCOMING_HOURS: 6, // "Prochains départs" = 6h
};
```

---

### 3.2 Fenêtre "Prochains Départs"
**Fichier:** `/pages/responsable/DashboardHome.tsx:23`

```typescript
const sixHoursLater = new Date(now.getTime() + 6 * 60 * 60 * 1000);
```

**Problème:** Fenêtre de **6 heures** hardcodée  
**Impact:** Moyen  
**Solution:**

```typescript
// Dans /config/business.ts
UPCOMING_TRIPS_WINDOW_HOURS: 6,

// Utiliser
const windowMs = BUSINESS_CONFIG.UPCOMING_TRIPS_WINDOW_HOURS * 60 * 60 * 1000;
const windowLater = new Date(now.getTime() + windowMs);
```

---

## 📦 CATÉGORIE 4: MOCK DATA (Acceptable)

### 4.1 Données Initiales
**Fichiers:** `/contexts/DataContext.tsx`

- **Gares:** 4 gares hardcodées (lignes 285-289)
- **Routes:** 5 routes hardcodées (lignes 291-297)
- **Horaires:** 15 horaires récurrents (lignes 300-325)
- **Caissiers:** Mock caissiers générés
- **Trips:** Générés automatiquement depuis horaires
- **Tickets:** Générés avec mix online/counter

**Statut:** ✅ **TOTALEMENT ACCEPTABLE**  
**Raison:** Ce sont des données de démonstration  
**Action:** Remplacer par Supabase quand backend connecté

---

## 🎨 CATÉGORIE 5: STYLES & COULEURS (OK)

### 5.1 Gradient Burkina Faso
**Fichiers multiples:**

```css
background: linear-gradient(135deg, #EF2B2D 0%, #FCD116 50%, #009E49 100%)
```

**Occurrences:**
- `/components/layout/Sidebar.tsx:78, 94`
- `/pages/LoginPage.tsx:110, 192`
- `/pages/StatusPage.tsx:107`

**Statut:** ✅ **PARFAIT**  
**Raison:** C'est l'identité visuelle TransportBF (drapeau Burkina Faso)  
**Action:** Aucune - C'est votre branding

---

### 5.2 Couleurs Thématiques
**Couleurs principales:**
- Rouge: `#dc2626` / `#EF2B2D`
- Jaune: `#f59e0b` / `#FCD116`
- Vert: `#16a34a` / `#009E49`

**Statut:** ✅ **OK**  
**Note:** Déjà dans `/styles/globals.css` via variables CSS  
**Action:** Aucune

---

## 🎯 CATÉGORIE 6: BUSINESS LOGIC (À Valider)

### 6.1 Politique d'Annulation
**Fichier:** `/pages/responsable/PoliciesPage.tsx:30`

```typescript
value: '• Annulation >24h avant départ : remboursement 100%\n
        • Annulation 12-24h avant : remboursement 50%\n
        • Annulation <12h avant : aucun remboursement\n
        • Frais administratifs : 500 FCFA'
```

**Problème:** Politique hardcodée  
**Impact:** **CRITIQUE** si vous voulez la changer  
**Solution:**

```typescript
// Dans /config/policies.ts
export const CANCELLATION_POLICY = {
  FULL_REFUND_HOURS: 24,      // >24h = 100%
  PARTIAL_REFUND_HOURS: 12,   // 12-24h = 50%
  PARTIAL_REFUND_PERCENT: 50,
  ADMIN_FEE: 500,              // FCFA
};

// Générer dynamiquement le texte
const generateCancellationText = () => `
  • Annulation >${CANCELLATION_POLICY.FULL_REFUND_HOURS}h avant départ : remboursement 100%
  • Annulation ${CANCELLATION_POLICY.PARTIAL_REFUND_HOURS}-${CANCELLATION_POLICY.FULL_REFUND_HOURS}h avant : remboursement ${CANCELLATION_POLICY.PARTIAL_REFUND_PERCENT}%
  • Annulation <${CANCELLATION_POLICY.PARTIAL_REFUND_HOURS}h avant : aucun remboursement
  • Frais administratifs : ${CANCELLATION_POLICY.ADMIN_FEE} FCFA
`;
```

---

## 📋 PLAN D'ACTION RECOMMANDÉ

### 🔴 PRIORITÉ 1: Configuration Business (Important)

**Créer:** `/config/business.ts`

```typescript
export const BUSINESS_CONFIG = {
  // Commission
  COMMISSION_RATE: 0.05, // 5%
  COMMISSION_MIN: 100,   // FCFA minimum
  
  // Objectifs
  APP_ADOPTION_TARGET: 60,    // Objectif 60%
  APP_ADOPTION_MIN_GOOD: 50,  // Seuil acceptable
  
  // Fenêtres temporelles
  UPCOMING_TRIPS_WINDOW_HOURS: 6,
  
  // Politique annulation
  CANCELLATION: {
    FULL_REFUND_HOURS: 24,
    PARTIAL_REFUND_HOURS: 12,
    PARTIAL_REFUND_PERCENT: 50,
    ADMIN_FEE: 500, // FCFA
  },
  
  // Capacités véhicules
  VEHICLE_CAPACITY: {
    STANDARD: 45,
    VIP: 35,
  },
} as const;
```

**Fichiers à modifier:**
- ✅ `/contexts/DataContext.tsx` → Importer BUSINESS_CONFIG
- ✅ `/components/dashboard/SalesChannelCard.tsx` → Utiliser objectifs
- ✅ `/pages/responsable/DashboardHome.tsx` → Fenêtre 6h
- ✅ `/pages/responsable/PoliciesPage.tsx` → Politique annulation

---

### 🟡 PRIORITÉ 2: Seuils UI (Optionnel)

**Créer:** `/config/ui.ts`

```typescript
export const UI_THRESHOLDS = {
  // Taux de remplissage
  BUS_FILL_EXCELLENT: 80,
  BUS_FILL_GOOD: 50,
  
  // Périodes reporting
  RECENT_DAYS: 7,
  RECENT_MONTH: 30,
} as const;
```

**Fichiers à modifier:**
- `/components/dashboard/RecentTripsTable.tsx`
- `/pages/caissier/HistoryPage.tsx`
- Autres pages avec filtres temporels

---

### 🟢 PRIORITÉ 3: Migration Supabase (Futur)

**Remplacer mock data par:**
- Gares depuis `supabase.from('stations')`
- Routes depuis `supabase.from('routes')`
- Horaires depuis `supabase.from('schedule_templates')`
- Trips depuis `supabase.from('trips')`
- Tickets depuis `supabase.from('tickets')`

---

## 📈 STATISTIQUES FINALES

### Répartition par Type

| Type | Nombre | Critique | Action |
|------|--------|----------|--------|
| Mock Data | ~200 | Non | Remplacer par API |
| Config Business | 8 | **Oui** | **Extraire** |
| Seuils UI | 6 | Non | Optionnel |
| Calculs Temps | 30+ | Non | OK |
| Styles/Branding | 12 | Non | OK |
| **TOTAL** | **256+** | **8 critiques** | **14 à extraire** |

### Impact Business

- **🔴 Critique (8):** Taux commission, objectifs, politique annulation
- **🟡 Moyen (6):** Seuils UI, fenêtres temporelles
- **🟢 Faible (242+):** Mock data, styles, calculs OK

---

## ✅ RECOMMANDATIONS FINALES

### Court Terme (Cette semaine)
1. ✅ Créer `/config/business.ts` avec configuration métier
2. ✅ Extraire taux commission (CRITIQUE pour business model)
3. ✅ Extraire objectifs adoption app
4. ✅ Extraire politique annulation

### Moyen Terme (Ce mois)
1. Créer `/config/ui.ts` pour seuils visuels
2. Refactoriser périodes temporelles
3. Documenter toutes les configs

### Long Terme (Après MVP)
1. Remplacer tout mock data par Supabase
2. Interface admin pour modifier configs
3. Multi-tenant avec configs par compagnie

---

## 🎯 CONCLUSION

**Bonne nouvelle:** Votre code est **très propre** ! La majorité des "hardcodés" sont :
- ✅ Mock data (normal pour démo)
- ✅ Calculs temporels valides
- ✅ Identité visuelle (branding)

**Seuls 8 éléments business critiques** doivent être extraits en configuration.

**Effort estimé:** 2-3 heures pour extraire toute la config business

---

*Audit réalisé le ${new Date().toLocaleDateString('fr-FR')} - TransportBF Dashboard v1.0*
