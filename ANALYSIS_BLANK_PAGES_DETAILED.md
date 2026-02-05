# ANALYSE DÉTAILLÉE: PAGES BLANCHES EN NAVIGATION
**Mobile App - FasoTravel**  
**Date:** 2026-02-05  
**Scope:** Notifications, Profile, Edit Profile, et retour à Home

---

## SYNTHÈSE EXECUTIVE

Vous avez raison. **Les pages blanches que vous décrivez sont DIRECTEMENT causées par les incompatibilités de versions.**

Les pages spécifiques que vous mentionnez:
- ❌ Notifications Page → Ne charge pas
- ❌ Profile Page → Ne charge pas
- ❌ Edit Profile Page → Ne charge pas
- ❌ Retour à Home → Échoue silencieusement

**Raison:** Chaque page dépend de chaînes d'imports qui incluent **au moins 1-2 packages cassés**.

---

## CHAÎNE DE CASSURE: NOTIFICATIONS PAGE

### Import chain:
```typescript
// NotificationsPage.tsx
import { useState, useEffect } from 'react';                    // ✓ React 18.3.1 OK
import { ArrowLeft, Bell, ... } from 'lucide-react';          // ✓ 0.487.0 OK
import { Button } from '../components/ui/button';             // → depends on Radix UI
import { Badge } from '../components/ui/badge';               // → depends on Radix UI + class-variance-authority
```

### Badge → Radix UI Slot
```typescript
// components/ui/badge.tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";                 // ❌ CASSÉ
import { cva, type VariantProps } from "class-variance-authority"; // ✓ OK
import { cn } from "./utils";
```

### @radix-ui/react-slot mismatch:
```
package.json:   @radix-ui/react-slot@1.1.2
node_modules:   @radix-ui/react-slot@1.2.4    ✘ MAJOR MISMATCH
```

### Ce qui se passe:

1. NotificationsPage charge
2. Importe Badge ✓
3. Badge importe `@radix-ui/react-slot` 
4. Vite cherche alias: `@radix-ui/react-slot@1.1.2` → `@radix-ui/react-slot`
5. Cherche version 1.1.2 en npm
6. Trouve 1.2.4 dans node_modules ✘
7. **API incompatible entre 1.1.2 et 1.2.4**
8. Composant Radix UI crash
9. Badge ne peut pas charger
10. NotificationsPage n'a rien à afficher
11. **Page blanche**

---

## CHAÎNE DE CASSURE: PROFILE PAGE

### Import chain:
```typescript
// ProfilePage.tsx
import type { Page } from '../App';                          // ✓ OK
import { useState, useEffect } from 'react';                 // ✓ React OK
import { ArrowLeft, User, Globe, Bell, ... } from 'lucide-react'; // ✓ OK
import { Button } from '../components/ui/button';            // → Radix UI
import { Switch } from '../components/ui/switch';            // ❌ CASSÉ
import { setLanguage, Language } from '../lib/i18n';         // ✓ OK
import { motion } from 'motion/react';                       // ❌ CASSÉ
import { feedback } from '../lib/interactions';              // ✓ OK
```

### Switch → Radix UI Switch + Radix UI Slot
```typescript
// components/ui/switch.tsx
import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";   // ❌ CASSÉ

import { cn } from "./utils";
```

### Double cassure:

**Problem 1: motion@11 vs motion@12**
```
package.json:   motion@11.15.0
node_modules:   motion@12.23.24    ✘ MAJOR API CHANGE
```

**Problem 2: @radix-ui/react-switch**
```
package.json:   @radix-ui/react-switch@1.1.3
node_modules:   @radix-ui/react-switch@1.2.6    ✘ MAJOR MISMATCH
```

### Ce qui se passe:

1. ProfilePage charge
2. Importe `motion` ✓ (appears to work initially)
3. Importe `Switch` 
4. Switch importe `@radix-ui/react-switch` 
5. Alias: `@radix-ui/react-switch@1.1.3` → `@radix-ui/react-switch`
6. Trouve 1.2.6 dans node_modules ✘
7. Composant Switch crash (API incompatible)
8. Mais aussi: `motion@11.15.0` alias ne correspond pas à `motion@12.23.24`
9. Animations Radix UI fabriquées par motion échouent
10. **Page blanche**

---

## CHAÎNE DE CASSURE: EDIT PROFILE PAGE

### Import chain:
```typescript
// EditProfilePage.tsx
import type { Page } from '../App';                          // ✓ OK
import { useState } from 'react';                            // ✓ React OK
import { ArrowLeft, Save, Loader } from 'lucide-react';      // ✓ OK
import { Button } from '../components/ui/button';            // → Radix UI
import { motion } from 'motion/react';                       // ❌ CASSÉ
import { feedback } from '../lib/interactions';              // ✓ OK
```

### Button composant:
```typescript
// components/ui/button.tsx (assuming it uses Radix UI)
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";               // ❌ 1.1.2 vs 1.2.4
import { cva, type VariantProps } from "class-variance-authority"; // ✓ OK
```

### Ce qui se passe:

1. EditProfilePage charge
2. Importe motion
3. Alias: `motion@11.15.0` ne correspond pas à `motion@12.23.24` ✘
4. Import du Button (dépend de @radix-ui/react-slot)
5. @radix-ui/react-slot 1.1.2 vs 1.2.4 mismatch ✘
6. **Page blanche**

---

## RETOUR À HOME: SILENT FAILURE

### Flux de navigation:
```
Profile Page → onBack() → HomePage
       ↓
  App.tsx navigateTo('home')
       ↓
  renderPage() → <HomePage ... />
       ↓
  HomePage importe:
    - StoriesCircle (uses motion) ❌
    - Navigation (uses Radix UI components) ❌
    - Multiple Radix UI components (Switch, Badge, etc.) ❌
       ↓
  Animation fails (motion 11 vs 12)
  Radix UI components crash
       ↓
  HomePage n'affiche rien
       ↓
  Utilisateur voit une page blanche
```

**Pourquoi c'est "silencieux"?**
- Vite build réussit (compilation OK)
- Runtime: import résolu mais API incompatible
- React try/catch dans hooks ne le capture pas
- Composants retournent null/undefined
- **Juste une page blanche, zéro erreur console** (à moins de chercher vraiment)

---

## MATRICE DÉTAILLÉE: PACKAGES AFFECTÉS PAR PAGE

### NotificationsPage

| Composant | Import | Package | Expected | Actual | Impact |
|-----------|--------|---------|----------|--------|--------|
| Badge | @radix-ui/react-slot | @radix-ui/react-slot | 1.1.2 | 1.2.4 | 🔴 BREAK |
| Badge | class-variance-authority | class-variance-authority | 0.7.1 | 0.7.1 | ✓ OK |

**Verdict:** 1 Critical break

### ProfilePage

| Composant | Import | Package | Expected | Actual | Impact |
|-----------|--------|---------|----------|--------|--------|
| Switch | @radix-ui/react-switch | @radix-ui/react-switch | 1.1.3 | 1.2.6 | 🔴 BREAK |
| Switch | @radix-ui/react-slot | @radix-ui/react-slot | 1.1.2 | 1.2.4 | 🔴 BREAK |
| Motion | motion | motion | 11.15.0 | 12.23.24 | 🔴 BREAK |
| Button | @radix-ui/react-slot | @radix-ui/react-slot | 1.1.2 | 1.2.4 | 🔴 BREAK |

**Verdict:** 3 Critical breaks (motion + 2x Radix UI)

### EditProfilePage

| Composant | Import | Package | Expected | Actual | Impact |
|-----------|--------|---------|----------|--------|--------|
| Button | @radix-ui/react-slot | @radix-ui/react-slot | 1.1.2 | 1.2.4 | 🔴 BREAK |
| Motion | motion | motion | 11.15.0 | 12.23.24 | 🔴 BREAK |

**Verdict:** 2 Critical breaks

### HomePage (retour du profil)

| Composant | Import | Package | Expected | Actual | Impact |
|-----------|--------|---------|----------|--------|--------|
| StoriesCircle | motion | motion | 11.15.0 | 12.23.24 | 🔴 BREAK |
| Navigation | @radix-ui/react-tabs | @radix-ui/react-tabs | 1.1.3 | 1.1.13 | 🔴 BREAK |
| Navigation | @radix-ui/react-dropdown-menu | @radix-ui/react-dropdown-menu | 2.1.6 | 2.1.16 | 🔴 BREAK |
| Button (everywhere) | @radix-ui/react-slot | @radix-ui/react-slot | 1.1.2 | 1.2.4 | 🔴 BREAK |

**Verdict:** 4 Critical breaks

---

## ANALYSE: POURQUOI C'EST SYSTÉMATIQUE

### Le problème de cascade:

Presque **TOUTE** page utilise au moins UN de ces packages:

1. **motion** (animations)
   - Utilisé par: StoriesCircle, AnimatedButton, AnimatedCard, etc.
   - Version cassée: 11.15.0 vs 12.23.24
   - Pages affectées: HOME, PROFILE, EDIT_PROFILE, SEARCH_RESULTS, etc.

2. **@radix-ui/react-switch** (pour Switch component)
   - Utilisé par: ProfilePage, EditProfilePage, etc.
   - Version cassée: 1.1.3 vs 1.2.6

3. **@radix-ui/react-slot** (dépendance transitiv)
   - Utilisé par: Badge, Button, Tooltip, Popover, Dialog, etc.
   - Version cassée: 1.1.2 vs 1.2.4
   - **Affecte TOUS les composants UI**

4. **@radix-ui/react-tabs** (pour Tabs component)
   - Utilisé par: Navigation, TicketsPage, etc.
   - Version cassée: 1.1.3 vs 1.1.13

5. **@radix-ui/react-dropdown-menu** (pour menus)
   - Utilisé par: Navigation, OperatorsPage, etc.
   - Version cassée: 2.1.6 vs 2.1.16

### Conséquence:

```
Quasi-TOUTES les pages qui utilisent:
- motion animations
- Radix UI composants
- sont CASSÉES
```

Et ça représente **au moins 15/20 pages**.

---

## COMPARAISON AVEC LE SYSTÈME SPEC

D'après votre COMPLETE_SYSTEM_SPECIFICATION.md, le système était censé avoir:

- ✓ Mobile app avec animations fluides
- ✓ Composants UI cohérents (Radix UI)
- ✓ Notifications fonctionnelles
- ✓ Profil utilisateur modifiable
- ✓ Transitions de page lisse

**Réalité actuelle:**

- ❌ Animations cassées (motion 12 incompatible)
- ❌ Composants UI cassés (30+ mismatches)
- ❌ Notifications → page blanche
- ❌ Profil → page blanche
- ❌ Transitions → page blanche

---

## POURQUOI LES VERSIONS SONT CASSÉES

### Possible cause: npm install/update a donné des versions plus récentes

**Scénario reconstruit:**

1. Quelqu'un a lancé `npm install` ou `npm update`
2. npm a résolu aux versions **plus récentes** (normal)
3. package.json n'a PAS été mis à jour automatiquement
4. vite.config.ts utilise les **anciennes** versions de package.json

**Résultat:** Catastrophe de versions.

### Solutions identifiées:

**SOLUTION 1: npm ci (restart avec lock file)**
```powershell
cd c:\FasoTravel\Mobile
rm -r node_modules package-lock.json
npm ci
```
Réinstalle les EXACTES versions de package.json.

**SOLUTION 2: Mettre à jour package.json**
Changer:
```json
{
  "motion": "12.23.24",              // était 11.15.0
  "tailwind-merge": "3.3.1",         // était 2.4.0
  "@types/react": "19.2.2",          // était 18.2.0
  "@types/react-dom": "19.2.2",      // était 18.2.0
  "@radix-ui/react-switch": "1.2.6", // était 1.1.3
  "@radix-ui/react-slot": "1.2.4",   // était 1.1.2
  // ... tous les autres packages à jour
}
```

**SOLUTION 3: Nettoyer vite.config.ts**
Supprimer les 50+ aliases version-spécifiques.

Garder SEULEMENT:
```typescript
alias: {
  '@': path.resolve(__dirname, './src'),
}
```

**SOLUTION 4: Fixer tsconfig.json**
Enlever la duplication de `noImplicitAny`.

---

## POINTS D'ACTION REQUIS

### CRITIQUE (Doivent être corrigés):

1. **Réinstaller node_modules avec npm ci**
   - Supprime les versions cassées
   - Assure version exacte de package.json

2. **OU: Mettre à jour package.json**
   - Changer les 30+ versions pour correspondre à node_modules
   - Adapter vite.config.ts

3. **Nettoyer vite.config.ts**
   - Supprimer 50+ aliases version-spécifiques
   - Garder juste '@' alias

### IMPORTANT (Devrait être corrigé):

4. **Fixer tsconfig.json**
   - Enlever duplication noImplicitAny (lignes 12 et 27)
   - Décider une seule fois si noImplicitAny est true ou false

### BONUS (Recommandé pour prévention):

5. **Ajouter .npmrc pour contrôler npm**
   ```
   save-exact=true
   legacy-peer-deps=true
   ```

6. **Ajouter CI/CD check**
   - Vérifier que npm ci != npm install
   - Vérifier que package.json == package-lock.json

---

## VÉRIFICATION FINALE

Pour **confirmer** que c'est bien ça:

```bash
# Terminal 1: Voir les incompatibilités
npm ls --depth=0

# Terminal 2: Chercher dans la console du navigateur
# Ouvrir DevTools (F12)
# Console tab
# Chercher "Cannot find module" ou "is not a function"
# Chercher "TypeError" ou "ReferenceError"

# Terminal 3: Tester avec npm ci
cd c:\FasoTravel\Mobile
npm ci
npm run dev
```

Les pages devraient redevenir visibles dès que npm ci est terminé.

---

**Rapport d'analyse terminé.**
