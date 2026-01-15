# 🚀 GUIDE D'IMPLÉMENTATION - UTILISATION DES CONFIGS

**Temps estimé:** 2-3 heures  
**Difficulté:** ⭐⭐☆☆☆ (Facile)  
**Impact:** 🎯 Haute maintenabilité

---

## 📝 ORDRE D'IMPLÉMENTATION

Suivez cet ordre pour éviter les erreurs:

1. ✅ DataContext (Core - Commission & Mock)
2. ✅ SalesChannelCard (Business Model)
3. ✅ RecentTripsTable (UI Seuils)
4. ✅ PoliciesPage (Texte Dynamique)
5. ✅ DashboardHome Responsable (Fenêtres Temps)
6. ✅ Formatters globaux (Optionnel mais recommandé)

---

## 1️⃣ DATACONTEXT - COMMISSION

**Fichier:** `/contexts/DataContext.tsx`  
**Ligne:** 602  
**Temps:** 2 minutes

### Avant
```typescript
commission: method === 'online' ? trip.price * 0.05 : undefined, // 5% commission for online sales
```

### Après
```typescript
import BUSINESS_CONFIG from '../config/business';

// ... plus bas dans le fichier (ligne 602)
commission: method === 'online' ? trip.price * BUSINESS_CONFIG.COMMISSION.RATE : undefined,
```

### Test
```typescript
// Vérifiez que les tickets online ont toujours commission = price * 5%
console.log('Commission rate:', BUSINESS_CONFIG.COMMISSION.RATE); // 0.05
```

---

## 2️⃣ SALESCHANNELCARD - OBJECTIFS

**Fichier:** `/components/dashboard/SalesChannelCard.tsx`  
**Lignes:** 1 (import), 73-74 (badge), 149-152 (objectif)  
**Temps:** 5 minutes

### Étape 1: Ajouter import
```typescript
import { useMemo } from 'react';
import { Smartphone, Store, TrendingUp } from 'lucide-react@0.487.0';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import type { Ticket } from '../../contexts/DataContext';
import BUSINESS_CONFIG, { checkAdoptionRate } from '../../config/business'; // ← NOUVEAU
```

### Étape 2: Remplacer badge (lignes 73-74)

**Avant:**
```typescript
<Badge 
  variant={adoptionRate >= 50 ? 'default' : 'secondary'} 
  className={adoptionRate >= 50 ? 'bg-green-600' : 'bg-orange-500'}
>
```

**Après:**
```typescript
<Badge 
  variant={adoptionRate >= BUSINESS_CONFIG.ADOPTION.MIN_GOOD ? 'default' : 'secondary'} 
  className={adoptionRate >= BUSINESS_CONFIG.ADOPTION.MIN_GOOD ? 'bg-green-600' : 'bg-orange-500'}
>
```

### Étape 3: Remplacer objectif (lignes 149-152)

**Avant:**
```typescript
<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
  {adoptionRate >= 60 
    ? '✓ Objectif atteint (60%+)' 
    : `Objectif: 60% (${60 - adoptionRate}% à atteindre)`
  }
</p>
```

**Après:**
```typescript
<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
  {checkAdoptionRate(adoptionRate).message}
</p>
```

### Test
```typescript
// Le texte doit s'adapter automatiquement selon le taux
// 65% → "✓ Objectif atteint (60%+)"
// 55% → "Bon taux - Objectif: 60% (5% à atteindre)"
// 45% → "Objectif: 60% (15% à atteindre)"
```

---

## 3️⃣ RECENTTRIPSTABLE - SEUILS REMPLISSAGE

**Fichier:** `/components/dashboard/RecentTripsTable.tsx`  
**Lignes:** 1 (import), 80  
**Temps:** 3 minutes

### Étape 1: Ajouter import
```typescript
import { Bus, ArrowRight, Users } from 'lucide-react@0.487.0';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import { getFillRateStatus } from '../../config/business'; // ← NOUVEAU
```

### Étape 2: Remplacer calcul couleur (ligne 80)

**Avant:**
```typescript
const fillColor = fillPercentage >= 80 ? '#16a34a' : fillPercentage >= 50 ? '#f59e0b' : '#dc2626';
```

**Après:**
```typescript
const fillStatus = getFillRateStatus(fillPercentage);
const fillColor = fillStatus.color;
```

### Bonus: Ajouter label (optionnel)
```typescript
// Si vous voulez afficher "Excellent", "Bon", "Faible"
<span className="text-xs" style={{ color: fillColor }}>
  {fillStatus.label}
</span>
```

### Test
```typescript
// Vérifiez les couleurs:
// 85% → Vert (#16a34a) "Excellent"
// 65% → Jaune (#f59e0b) "Bon"
// 30% → Rouge (#dc2626) "Faible"
```

---

## 4️⃣ POLICIESPAGE - TEXTE DYNAMIQUE

**Fichier:** `/pages/responsable/PoliciesPage.tsx`  
**Lignes:** 1 (import), 30  
**Temps:** 2 minutes

### Étape 1: Ajouter import
```typescript
import { useState } from 'react';
import { Save, Ban, Clock, Users, Shield, FileText, AlertCircle } from 'lucide-react@0.487.0';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { toast } from 'sonner@2.0.3';
import { getCancellationPolicyText } from '../../config/business'; // ← NOUVEAU
```

### Étape 2: Remplacer texte hardcodé (ligne 30)

**Avant:**
```typescript
{
  id: 'cancellation',
  title: 'Politique d\'Annulation',
  description: 'Conditions d\'annulation et de remboursement',
  icon: Ban,
  value: '• Annulation >24h avant départ : remboursement 100%\n• Annulation 12-24h avant : remboursement 50%\n• Annulation <12h avant : aucun remboursement\n• Frais administratifs : 500 FCFA'
},
```

**Après:**
```typescript
{
  id: 'cancellation',
  title: 'Politique d\'Annulation',
  description: 'Conditions d\'annulation et de remboursement',
  icon: Ban,
  value: getCancellationPolicyText()
},
```

### Test
```typescript
// Le texte doit être identique
// Si vous modifiez BUSINESS_CONFIG.CANCELLATION, le texte change automatiquement
```

---

## 5️⃣ DASHBOARDHOME - FENÊTRE TEMPS

**Fichier:** `/pages/responsable/DashboardHome.tsx`  
**Lignes:** 1 (import), 23-24  
**Temps:** 2 minutes

### Étape 1: Ajouter import
```typescript
import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Bus, Users, MapPin, AlertCircle, Clock, DollarSign, Calendar, ArrowUpRight, Activity, Smartphone, Store } from "lucide-react@0.487.0";
import { useNavigate } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import StatCard from '../../components/dashboard/StatCard';
import SalesChannelCard from '../../components/dashboard/SalesChannelCard';
import RecentTripsTable from '../../components/dashboard/RecentTripsTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Progress } from '../../components/ui/progress';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner@2.0.3';
import BUSINESS_CONFIG from '../../config/business'; // ← NOUVEAU
```

### Étape 2: Remplacer calcul 6h (lignes 23-24)

**Avant:**
```typescript
const upcomingTrips = useMemo(() => {
  const now = new Date();
  const sixHoursLater = new Date(now.getTime() + 6 * 60 * 60 * 1000);
  return trips.filter(t => {
    const departureTime = new Date(t.departureTime);
    return t.status === 'scheduled' && departureTime >= now && departureTime <= sixHoursLater;
  });
}, [trips]);
```

**Après:**
```typescript
const upcomingTrips = useMemo(() => {
  const now = new Date();
  const windowMs = BUSINESS_CONFIG.TIME_WINDOWS.UPCOMING_TRIPS_HOURS * 60 * 60 * 1000;
  const windowLater = new Date(now.getTime() + windowMs);
  return trips.filter(t => {
    const departureTime = new Date(t.departureTime);
    return t.status === 'scheduled' && departureTime >= now && departureTime <= windowLater;
  });
}, [trips]);
```

### Bonus: Afficher durée dynamique
```typescript
// Dans le subtitle de la StatCard "Prochains Départs"
subtitle: `Dans les ${BUSINESS_CONFIG.TIME_WINDOWS.UPCOMING_TRIPS_HOURS}h`
```

### Test
```typescript
// Si vous changez UPCOMING_TRIPS_HOURS de 6 à 12
// → "Prochains Départs" affichera les 12 prochaines heures
```

---

## 6️⃣ FORMATTERS GLOBAUX (Recommandé)

**Nouveau fichier:** `/utils/formatters.ts`  
**Temps:** 5 minutes

### Créer le fichier

```typescript
/**
 * FORMATTERS - Fonctions utilitaires de formatage
 * Centralise tous les formatages pour cohérence
 */

import { 
  formatCurrency as formatCurrencyUI, 
  formatDate as formatDateUI, 
  formatTime as formatTimeUI,
  getStatusColor,
  getStatusLabel,
  getChartColor 
} from '../config/ui';

/**
 * Formatte un montant en FCFA
 * @example formatMoney(5000) → "5 000 F"
 */
export function formatMoney(amount: number): string {
  return formatCurrencyUI(amount);
}

/**
 * Formatte une date
 * @example formatDate(new Date()) → "17/12/2024"
 */
export function formatDate(date: Date | string, format: 'short' | 'long' = 'short'): string {
  return formatDateUI(date, format);
}

/**
 * Formatte une heure
 * @example formatTime(new Date()) → "14:30"
 */
export function formatTime(date: Date | string): string {
  return formatTimeUI(date);
}

/**
 * Formatte datetime complet
 * @example formatDateTime(new Date()) → "17/12/2024 14:30"
 */
export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

/**
 * Formatte un pourcentage
 * @example formatPercent(0.45) → "45%"
 */
export function formatPercent(value: number, decimals: number = 0): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Formatte un numéro de téléphone burkinabè
 * @example formatPhone("+22670123456") → "+226 70 12 34 56"
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11 && cleaned.startsWith('226')) {
    return `+226 ${cleaned.slice(3, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9)}`;
  }
  return phone;
}

// Réexporter helpers UI
export { getStatusColor, getStatusLabel, getChartColor };
```

### Utiliser partout

**Exemple dans n'importe quel composant:**

```typescript
import { formatMoney, formatDate, formatTime } from '../../utils/formatters';

// Au lieu de:
const formatted = new Intl.NumberFormat('fr-FR').format(amount) + ' F';

// Utiliser:
const formatted = formatMoney(amount);

// Au lieu de:
const date = new Date(ticket.purchaseDate).toLocaleDateString('fr-FR');

// Utiliser:
const date = formatDate(ticket.purchaseDate);
```

---

## ✅ CHECKLIST DE VÉRIFICATION

Après chaque implémentation, vérifiez:

### DataContext
- [ ] Import `BUSINESS_CONFIG` présent en haut
- [ ] Ligne 602: `BUSINESS_CONFIG.COMMISSION.RATE` utilisé
- [ ] Tickets online ont toujours `commission` calculée
- [ ] Pas d'erreur TypeScript

### SalesChannelCard
- [ ] Import `BUSINESS_CONFIG` et `checkAdoptionRate` présents
- [ ] Badge utilise `BUSINESS_CONFIG.ADOPTION.MIN_GOOD`
- [ ] Texte objectif utilise `checkAdoptionRate()`
- [ ] Affichage correct avec différents taux (test 45%, 55%, 65%)

### RecentTripsTable
- [ ] Import `getFillRateStatus` présent
- [ ] Couleurs correctes selon taux remplissage
- [ ] Pas d'erreur console

### PoliciesPage
- [ ] Import `getCancellationPolicyText` présent
- [ ] Texte politique affiché correctement
- [ ] Format identique à avant

### DashboardHome
- [ ] Import `BUSINESS_CONFIG` présent
- [ ] Fenêtre "Prochains départs" utilise config
- [ ] Subtitle affiche la bonne durée

### Formatters (optionnel)
- [ ] Fichier `/utils/formatters.ts` créé
- [ ] Toutes les fonctions exportées
- [ ] Tests manuels fonctionnent
- [ ] Remplacer dans au moins 3 composants pour valider

---

## 🧪 TESTS MANUELS

### Test 1: Modifier Commission

1. Ouvrir `/config/business.ts`
2. Changer `COMMISSION.RATE: 0.05` → `0.10` (10%)
3. Recharger dashboard
4. Vérifier dans SalesChannelCard: commission doublée ✅
5. Remettre à `0.05`

### Test 2: Modifier Objectif Adoption

1. Ouvrir `/config/business.ts`
2. Changer `ADOPTION.TARGET: 60` → `50`
3. Recharger dashboard
4. Vérifier message: "✓ Objectif atteint (50%+)" si taux > 50% ✅
5. Remettre à `60`

### Test 3: Modifier Politique Annulation

1. Ouvrir `/config/business.ts`
2. Changer `CANCELLATION.FULL_REFUND_HOURS: 24` → `48`
3. Aller sur page Politiques
4. Vérifier texte: "Annulation >48h..." ✅
5. Remettre à `24`

### Test 4: Modifier Seuils Remplissage

1. Ouvrir `/config/business.ts`
2. Changer `PERFORMANCE.FILL_RATE_EXCELLENT: 80` → `70`
3. Vérifier tableau trips: plus de bus en vert ✅
4. Remettre à `80`

---

## 🚨 ERREURS COMMUNES

### Erreur 1: Module not found

```
Error: Cannot find module '../config/business'
```

**Solution:** Vérifier le chemin relatif depuis votre fichier
- Depuis `/contexts/` → `../config/business`
- Depuis `/components/dashboard/` → `../../config/business`
- Depuis `/pages/responsable/` → `../../config/business`

### Erreur 2: Type error

```
Property 'RATE' does not exist on type...
```

**Solution:** Vérifier l'import
```typescript
// Bon
import BUSINESS_CONFIG from '../config/business';

// Mauvais
import { BUSINESS_CONFIG } from '../config/business';
```

### Erreur 3: Undefined value

```
Cannot read property 'COMMISSION' of undefined
```

**Solution:** S'assurer que le fichier `/config/business.ts` existe et exporte correctement
```typescript
// À la fin du fichier business.ts
export default BUSINESS_CONFIG;
```

---

## 📊 AVANT / APRÈS

### Avant (Hardcodé - Problème)

```
Pour changer commission de 5% à 6%:
→ Modifier 1 ligne dans DataContext ✏️
→ Modifier 1 ligne dans documentation 📝
→ Modifier 1 ligne dans calculs analytics 📊
→ RISQUE: oublier un endroit ❌
```

### Après (Centralisé - Solution)

```
Pour changer commission de 5% à 6%:
→ Modifier 1 seule ligne: COMMISSION.RATE: 0.06 ✏️
→ Tout le reste s'adapte automatiquement ✅
→ ZERO risque d'oubli 🎯
```

---

## 🎯 BÉNÉFICES FINAUX

Après implémentation complète:

1. **Maintenabilité:** Config métier en 1 endroit
2. **Clarté:** Code plus lisible avec noms explicites
3. **Flexibilité:** Changements rapides sans toucher code
4. **Évolutivité:** Prêt pour interface admin
5. **Documentation:** Config auto-documentée
6. **Tests:** Facile de tester différentes configs

---

## 🚀 NEXT LEVEL (Futur)

### Interface Admin Config

```typescript
// Future: /pages/responsable/ConfigPage.tsx
function ConfigPage() {
  const [config, setConfig] = useState(BUSINESS_CONFIG);
  
  const handleSave = async () => {
    // Sauvegarder dans Supabase
    await supabase
      .from('company_config')
      .upsert({ id: companyId, config });
    
    toast.success('Configuration mise à jour!');
  };
  
  return (
    <form onSubmit={handleSave}>
      <Input 
        label="Taux de commission (%)"
        value={config.COMMISSION.RATE * 100}
        onChange={(e) => setConfig({
          ...config,
          COMMISSION: { 
            ...config.COMMISSION, 
            RATE: parseFloat(e.target.value) / 100 
          }
        })}
      />
      {/* Autres champs... */}
    </form>
  );
}
```

---

## ✅ VALIDATION FINALE

Une fois tout implémenté:

```bash
# Vérifier qu'il n'y a pas d'erreurs TypeScript
npm run build

# Vérifier que l'app fonctionne
npm run dev

# Tester les 4 scénarios manuels ci-dessus
```

**Si tout passe:** 🎉 **IMPLÉMENTATION RÉUSSIE !**

---

*Guide créé le ${new Date().toLocaleDateString('fr-FR')}*  
*Temps estimé total: 2-3 heures*  
*Difficulté: ⭐⭐☆☆☆*
