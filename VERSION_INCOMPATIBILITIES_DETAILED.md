# INCOMPATIBILITÉS DE VERSIONS DÉTAILLÉES
**Mobile App - FasoTravel**  
**Date:** 2026-02-05

---

## RÉSUMÉ CHIFFRES

- **Total packages:** 48 déclarés
- **Incompatibilités majeures:** 4
- **Incompatibilités mineures:** 30+
- **Packages OK:** ~14

---

## INCOMPATIBILITÉS CRITIQUES (MAJOR VERSIONS)

### 1. motion
```
package.json:   motion@11.15.0
node_modules:   motion@12.23.24
Impact:         🔴 MAJEUR - Changements d'API incompatibles entre v11 et v12
Sévérité:       CRITIQUE
Utilisé par:    StoriesCircle, AnimatedButton, HomePage, AuthPage
Symptôme:       Animations cassées, composants vides
```

### 2. tailwind-merge
```
package.json:   tailwind-merge@2.4.0
node_modules:   tailwind-merge@3.3.1
Impact:         🔴 MAJEUR - Logique de fusion CSS changée
Sévérité:       HAUTE
Utilisé par:    Tous les composants (utility merging)
Symptôme:       Styles cassés, classes Tailwind non appliquées
```

### 3. @types/react
```
package.json:   @types/react@18.2.0
node_modules:   @types/react@19.2.2
Impact:         🔴 MAJEUR - Types TypeScript incompatibles
Sévérité:       CRITIQUE
Utilisé par:    Tous les fichiers TSX
Symptôme:       Erreurs TypeScript runtime, pages blanches
```

### 4. @types/react-dom
```
package.json:   @types/react-dom@18.2.0
node_modules:   @types/react-dom@19.2.2
Impact:         🔴 MAJEUR - Types TypeScript incompatibles
Sévérité:       CRITIQUE
Utilisé par:    Rendu DOM, pages, composants
Symptôme:       Rendu échoue silencieusement, pages blanches
```

---

## INCOMPATIBILITÉS MINEURES (PATCH/MINOR)

### @radix-ui/* (20+ packages)

```
PACKAGE                              EXPECTED    ACTUAL      STATUS
────────────────────────────────────────────────────────────────────
@radix-ui/react-accordion             1.2.3       1.2.12      ✘
@radix-ui/react-alert-dialog          1.1.6       1.1.15      ✘
@radix-ui/react-aspect-ratio          1.1.2       1.1.8       ✘
@radix-ui/react-avatar                1.1.3       1.1.11      ✘
@radix-ui/react-checkbox              1.1.4       1.3.3       ✘
@radix-ui/react-collapsible           1.1.3       1.1.12      ✘
@radix-ui/react-context-menu          2.2.6       2.2.16      ✘
@radix-ui/react-dialog                1.1.6       1.1.15      ✘
@radix-ui/react-dropdown-menu         2.1.6       2.1.16      ✘
@radix-ui/react-hover-card            1.1.6       1.1.15      ✘
@radix-ui/react-label                 2.1.2       2.1.8       ✘
@radix-ui/react-menubar               1.1.6       1.1.16      ✘
@radix-ui/react-navigation-menu       1.2.5       1.2.14      ✘
@radix-ui/react-popover               1.1.6       1.1.15      ✘
@radix-ui/react-progress              1.1.2       1.1.8       ✘
@radix-ui/react-radio-group           1.2.3       1.3.8       ✘
@radix-ui/react-scroll-area           1.2.3       1.2.10      ✘
@radix-ui/react-select                2.1.6       2.2.6       ✘
@radix-ui/react-separator             1.1.2       1.1.8       ✘
@radix-ui/react-slider                1.2.3       1.3.6       ✘
@radix-ui/react-slot                  1.1.2       1.2.4       ✘
@radix-ui/react-switch                1.1.3       1.2.6       ✘
@radix-ui/react-tabs                  1.1.3       1.1.13      ✘
@radix-ui/react-toggle                1.1.2       1.1.10      ✘
@radix-ui/react-toggle-group          1.1.2       1.1.11      ✘
@radix-ui/react-tooltip               1.1.8       1.2.8       ✘
```

**Impact:** 🟠 MOYEN
- Comportement de composants potentiellement altéré
- Bugs mineurs dans les dialogs, modals, selects
- Incompatibilités d'API possibles

### react-hook-form
```
package.json:   react-hook-form@7.55.0
node_modules:   react-hook-form@7.66.0
Impact:         🟡 MINEUR - Patch version, généralement compatible
Sévérité:       MOYEN
Utilisé par:    AuthPage, formulaires
Symptôme:       Possibles bugs de validation de formulaires
```

### recharts
```
package.json:   recharts@2.15.2
node_modules:   recharts@2.15.4
Impact:         🟡 MINEUR - Patch version
Sévérité:       BAS
Utilisé par:    Graphiques (si utilisés)
Symptôme:       Graphiques cassés ou mal rendus
```

### sonner
```
package.json:   sonner@2.0.3
node_modules:   sonner@2.0.7
Impact:         🟡 MINEUR - Patch version
Sévérité:       BAS
Utilisé par:    Toast notifications (feedback system)
Symptôme:       Toasts non affichés
```

### react-resizable-panels
```
package.json:   react-resizable-panels@2.1.7
node_modules:   react-resizable-panels@2.1.9
Impact:         🟡 MINEUR - Patch version
Sévérité:       BAS (si utilisé)
Symptôme:       Panneaux cassés
```

### Autres packages MATCHS OK
```
✓ react@18.3.1
✓ react-dom@18.3.1
✓ vaul@1.1.2
✓ embla-carousel-react@8.6.0
✓ input-otp@1.4.2
✓ lucide-react@0.487.0
✓ next-themes@0.4.6
✓ react-day-picker@8.10.1
✓ class-variance-authority@0.7.1
✓ clsx@2.1.1
✓ cmdk@1.1.1
```

---

## PROBLÈME VITE.CONFIG.TS

**Fichier:** Mobile/vite.config.ts

**Aliases problématiques (exemples):**
```typescript
alias: {
    'vaul@1.1.2': 'vaul',                           // ✓ OK
    'sonner@2.0.3': 'sonner',                       // ✘ installed 2.0.7
    'recharts@2.15.2': 'recharts',                  // ✘ installed 2.15.4
    'react-resizable-panels@2.1.7': 'react-resizable-panels', // ✘ 2.1.9
    'react-hook-form@7.55.0': 'react-hook-form',    // ✘ 7.66.0
    'react-day-picker@8.10.1': 'react-day-picker',  // ✓ OK
    'next-themes@0.4.6': 'next-themes',             // ✓ OK
    'lucide-react@0.487.0': 'lucide-react',         // ✓ OK
    'input-otp@1.4.2': 'input-otp',                 // ✓ OK
    '@radix-ui/react-tooltip@1.1.8': '@radix-ui/react-tooltip', // ✘ 1.2.8
    '@radix-ui/react-toggle@1.1.2': '@radix-ui/react-toggle',   // ✘ 1.1.10
    '@radix-ui/react-toggle-group@1.1.2': ...,      // ✘ 1.1.11
    '@radix-ui/react-tabs@1.1.3': ...,              // ✘ 1.1.13
    '@radix-ui/react-switch@1.1.3': ...,            // ✘ 1.2.6
    '@radix-ui/react-slot@1.1.2': ...,              // ✘ 1.2.4
    '@radix-ui/react-slider@1.2.3': ...,            // ✘ 1.3.6
    '@radix-ui/react-separator@1.1.2': ...,         // ✘ 1.1.8
    '@radix-ui/react-select@2.1.6': ...,            // ✘ 2.2.6
    '@radix-ui/react-scroll-area@1.2.3': ...,       // ✘ 1.2.10
    '@radix-ui/react-radio-group@1.2.3': ...,       // ✘ 1.3.8
    '@radix-ui/react-progress@1.1.2': ...,          // ✘ 1.1.8
    '@radix-ui/react-popover@1.1.6': ...,           // ✘ 1.1.15
    '@radix-ui/react-navigation-menu@1.2.5': ...,   // ✘ 1.2.14
    '@radix-ui/react-menubar@1.1.6': ...,           // ✘ 1.1.16
    '@radix-ui/react-label@2.1.2': ...,             // ✘ 2.1.8
    '@radix-ui/react-hover-card@1.1.6': ...,        // ✘ 1.1.15
    '@radix-ui/react-dropdown-menu@2.1.6': ...,     // ✘ 2.1.16
    '@radix-ui/react-dialog@1.1.6': ...,            // ✘ 1.1.15
    '@radix-ui/react-context-menu@2.2.6': ...,      // ✘ 2.2.16
    '@radix-ui/react-collapsible@1.1.3': ...,       // ✘ 1.1.12
    '@radix-ui/react-checkbox@1.1.4': ...,          // ✘ 1.3.3
    '@radix-ui/react-avatar@1.1.3': ...,            // ✘ 1.1.11
    '@radix-ui/react-aspect-ratio@1.1.2': ...,      // ✘ 1.1.8
    '@radix-ui/react-alert-dialog@1.1.6': ...,      // ✘ 1.1.15
    '@radix-ui/react-accordion@1.2.3': ...,         // ✘ 1.2.12
    'embla-carousel-react@8.6.0': ...,              // ✓ OK
    'cmdk@1.1.1': ...,                              // ✓ OK
    'class-variance-authority@0.7.1': ...,          // ✓ OK
    '@': path.resolve(__dirname, './src'),          // ✓ OK
}
```

**Nombre d'aliases CASSÉS: 30+**

---

## COMMENT ÇA AFFECTE LE RENDU

### Chaîne de cassure:

1. **HomePage charge**
   ```tsx
   import { StoriesCircle } from '../components/StoriesCircle';
   ```

2. **StoriesCircle importe motion**
   ```tsx
   import { motion } from 'motion/react';
   ```

3. **Vite cherche à résoudre `motion`**
   - Cherche l'alias `motion@11.15.0` → `motion` dans vite.config
   - Trouve l'alias!
   - Cherche maintenant `motion@11.15.0` en npm

4. **npm trouve motion version 11.15.0 dans package.json** ✓
   - Mais `node_modules` contient motion 12.23.24 ✘

5. **Vite charge le bundle (chaos)**
   - Vite pense que c'est motion v11
   - Mais c'est motion v12 dans le code!
   - Incompatibilité d'API
   - Crashe silencieusement

6. **StoriesCircle ne peut pas charger**
   - Motion n'a pas chargé correctement
   - Hooks échouent
   - Rien ne s'affiche

7. **HomePage n'a rien à afficher**
   - StoriesCircle = undefined/null
   - Page blanche

8. **La page entière échoue silencieusement**
   - Pas d'erreur visible
   - Juste... blank page
   - Utilisateur voit rien

Multipliez cela par 30+ packages cassés → **toute l'app est down**

---

## TIMESTAMP WARNINGS AU BUILD

```
[WARNING] Duplicate key "noImplicitAny" in object literal
tsconfig.json:27:4:
  27 │     "noImplicitAny": true,
     │     ~~~~~~~~~~~~~~~
The original key "noImplicitAny" is here:
  tsconfig.json:12:4:
  12 │     "noImplicitAny": false,
```

C'est un warning mineur mais symptôme d'un fichier de config désorganisé.

---

## CONCLUSIONS

1. **Les versions sont cassées** - C'est LE problème
2. **Les aliases aggravent les choses** - Ils créent une confusion
3. **Le code est OK** - Ce n'est pas un bug logique
4. **npm install a donné les mauvaises versions** - Le lock file est peut-être cassé

---

## SOLUTIONS RAPIDES

### Solution 1: npm ci (MEILLEURE)
```bash
cd c:\FasoTravel\Mobile
rm -r node_modules package-lock.json
npm ci
```

Cela réinstalle les EXACTES versions de package.json avec un lock file propre.

### Solution 2: npm install --force
```bash
cd c:\FasoTravel\Mobile
npm install --force
```

Cela réinstalle et met à jour.

### Solution 3: Update package.json
Mettre à jour package.json et vite.config.ts pour utiliser les versions réelles.

---

**Rapport des incompatibilités terminé.**
