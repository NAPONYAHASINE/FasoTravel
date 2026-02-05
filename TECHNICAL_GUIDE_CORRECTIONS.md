# GUIDE TECHNIQUE: CORRECTIONS EXACTES À APPLIQUER
**FasoTravel Mobile App**  
**Mode: Prêt pour Exécution**

---

## CORRECTION #1: npm ci (PREMIÈRE - CRITIQUE)

### Commande:
```powershell
cd c:\FasoTravel\Mobile
```

### Étape 1.1: Supprimer les installs cassées
```powershell
Remove-Item -Path node_modules -Recurse -Force
Remove-Item -Path package-lock.json -Force
```

**Vérification:** 
```powershell
Test-Path node_modules     # Doit retourner False
Test-Path package-lock.json # Doit retourner False
```

### Étape 1.2: Réinstaller avec npm ci
```powershell
npm ci
```

**Temps attendu:** 2-3 minutes

**Attendu en fin:**
```
added 1234 packages in 2m 45s
```

### Étape 1.3: Vérifier que tout est bon
```powershell
npm ls --depth=0
```

**Attendu:** Zéro lignes avec "invalid"

**Si vous voyez des "invalid":** C'est pas normal, npm ci doit tout corriger.

---

## CORRECTION #2: Nettoyer vite.config.ts (DEUXIÈME - IMPORTANT)

### Fichier:
**Path:** `c:\FasoTravel\Mobile\vite.config.ts`  
**Lignes à modifier:** 10-54 (environ)

### AVANT (actuellement):
```typescript
export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      'vaul@1.1.2': 'vaul',
      'sonner@2.0.3': 'sonner',
      'recharts@2.15.2': 'recharts',
      'react-resizable-panels@2.1.7': 'react-resizable-panels',
      'react-hook-form@7.55.0': 'react-hook-form',
      'react-day-picker@8.10.1': 'react-day-picker',
      'next-themes@0.4.6': 'next-themes',
      'lucide-react@0.487.0': 'lucide-react',
      'input-otp@1.4.2': 'input-otp',
      'figma:asset/bcca83482c8b3b02fad6bfe11da57e59506831e5.png': path.resolve(__dirname, './src/assets/bcca83482c8b3b02fad6bfe11da57e59506831e5.png'),
      'figma:asset/b9ee1e83da37e8d99fdb6bc684feefadda356498.png': path.resolve(__dirname, './src/assets/b9ee1e83da37e8d99fdb6bc684feefadda356498.png'),
      'embla-carousel-react@8.6.0': 'embla-carousel-react',
      'cmdk@1.1.1': 'cmdk',
      'class-variance-authority@0.7.1': 'class-variance-authority',
      '@radix-ui/react-tooltip@1.1.8': '@radix-ui/react-tooltip',
      '@radix-ui/react-toggle@1.1.2': '@radix-ui/react-toggle',
      '@radix-ui/react-toggle-group@1.1.2': '@radix-ui/react-toggle-group',
      '@radix-ui/react-tabs@1.1.3': '@radix-ui/react-tabs',
      '@radix-ui/react-switch@1.1.3': '@radix-ui/react-switch',
      '@radix-ui/react-slot@1.1.2': '@radix-ui/react-slot',
      '@radix-ui/react-slider@1.2.3': '@radix-ui/react-slider',
      '@radix-ui/react-separator@1.1.2': '@radix-ui/react-separator',
      '@radix-ui/react-select@2.1.6': '@radix-ui/react-select',
      '@radix-ui/react-scroll-area@1.2.3': '@radix-ui/react-scroll-area',
      '@radix-ui/react-radio-group@1.2.3': '@radix-ui/react-radio-group',
      '@radix-ui/react-progress@1.1.2': '@radix-ui/react-progress',
      '@radix-ui/react-popover@1.1.6': '@radix-ui/react-popover',
      '@radix-ui/react-navigation-menu@1.2.5': '@radix-ui/react-navigation-menu',
      '@radix-ui/react-menubar@1.1.6': '@radix-ui/react-menubar',
      '@radix-ui/react-label@2.1.2': '@radix-ui/react-label',
      '@radix-ui/react-hover-card@1.1.6': '@radix-ui/react-hover-card',
      '@radix-ui/react-dropdown-menu@2.1.6': '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-dialog@1.1.6': '@radix-ui/react-dialog',
      '@radix-ui/react-context-menu@2.2.6': '@radix-ui/react-context-menu',
      '@radix-ui/react-collapsible@1.1.3': '@radix-ui/react-collapsible',
      '@radix-ui/react-checkbox@1.1.4': '@radix-ui/react-checkbox',
      '@radix-ui/react-avatar@1.1.3': '@radix-ui/react-avatar',
      '@radix-ui/react-aspect-ratio@1.1.2': '@radix-ui/react-aspect-ratio',
      '@radix-ui/react-alert-dialog@1.1.6': '@radix-ui/react-alert-dialog',
      '@radix-ui/react-accordion@1.2.3': '@radix-ui/react-accordion',
      '@': path.resolve(__dirname, './src'),
    },
  },
  // ... rest
}
```

### APRÈS (ce que cela doit devenir):
```typescript
export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // ... rest
}
```

### Comment faire (VS Code):
1. Ouvrir `vite.config.ts`
2. Sélectionner les lignes 10-54 (toutes les lignes d'alias)
3. **Supprimer TOUT sauf l'alias '@':**
   - Supprimer: `'vaul@1.1.2': 'vaul',`
   - Supprimer: `'sonner@2.0.3': 'sonner',`
   - Supprimer: `'recharts@2.15.2': 'recharts',`
   - ... tous les autres aliases
   - **GARDER:** `'@': path.resolve(__dirname, './src'),`

4. Sauvegarder (Ctrl+S)

**Temps:** 1 minute

---

## CORRECTION #3: Fixer tsconfig.json (TROISIÈME - COMPLÉMENTAIRE)

### Fichier:
**Path:** `c:\FasoTravel\Mobile\tsconfig.json`  
**Lignes affectées:** 12 ET 27 (DUPLICATION)

### AVANT (actuellement):
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "forceConsistentCasingInFileNames": true,
    "noImplicitAny": false,      ← LINE 12 (PREMIÈRE OCCURRENCE)

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitAny": true,        ← LINE 27 (DEUXIÈME OCCURRENCE - CONTRADICTION)
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  },
  ...
}
```

### APRÈS (ce que cela doit devenir):
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "forceConsistentCasingInFileNames": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitAny": true,        ← SEULE OCCURRENCE
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  },
  ...
}
```

### Changement exact:
**SUPPRIMER la ligne 12:**
```json
"noImplicitAny": false,
```

**RAISON:** Contradiction - avoir `"noImplicitAny": false` ET `"noImplicitAny": true` c'est illogique. TypeScript utilise la dernière valeur, ce qui crée un warning.

**Temps:** 30 secondes

---

## CORRECTION #4: Build & Test (VÉRIFICATION)

### Étape 4.1: Build
```powershell
cd c:\FasoTravel\Mobile
npm run build
```

**Attendu:**
```
vite v6.3.5 building for production...
transforming...
2081 modules transformed.
rendering chunks...
built in X.XXs
```

**Pas d'erreur!**

### Étape 4.2: Dev server
```powershell
npm run dev
```

**Attendu:**
```
VITE v6.3.5  ready in XXX ms

➜  Local:   http://localhost:3000/
➜  press h to show help
```

### Étape 4.3: Tester Navigation (10 minutes)

**Test #1: Notifications**
1. App charge
2. Cliquer sur 🔔 (notification bell)
3. ✓ NotificationsPage doit s'afficher (PAS BLANCHE)
4. Voir les notifications: "Départ dans 2 heures", etc.
5. Cliquer back ou X
6. ✓ HomePage doit s'afficher avec StoriesCircle

**Test #2: Profile**
1. Cliquer sur 👤 (profile icon) dans Navigation
2. ✓ ProfilePage doit s'afficher
3. Voir Switches qui fonctionnent (Language, Geo Consent, Push Consent)
4. Voir le bouton "Modifier le profil"
5. Cliquer "Modifier le profil"
6. ✓ EditProfilePage doit s'afficher
7. Form avec Input fields et Save button
8. Cliquer Save
9. ✓ ProfilePage doit s'afficher à nouveau
10. Cliquer back
11. ✓ HomePage doit s'afficher

**Test #3: Search Flow**
1. HomePage
2. Remplir recherche (from, to, date)
3. Cliquer Search
4. ✓ SearchResultsPage doit s'afficher
5. Voir les trajets disponibles
6. Cliquer sur un trajet
7. ✓ TripDetailPage doit s'afficher
8. Cliquer back
9. ✓ SearchResultsPage doit s'afficher

**Test #4: Animations**
1. HomePage devrait avoir StoriesCircle avec cercles animés
2. HomePage devrait avoir boutons avec hover effects
3. Transitions entre pages devraient être fluides
4. Aucune page blanche

### Étape 4.4: Console check
```
Ouvrir F12 (DevTools)
  → Console tab
    → Chercher des erreurs (en rouge)
    → Doit être VERT (0 errors)
```

---

## RÉSUMÉ: ORDRE D'EXÉCUTION

```
1. npm ci (2-3 min)
   └─ Réinstalle les bonnes versions

2. Nettoyer vite.config.ts (1 min)
   └─ Supprime les 50+ aliases problématiques

3. Fixer tsconfig.json (30 sec)
   └─ Enlève la duplication

4. npm run build (1 min)
   └─ Vérifie que tout compile

5. npm run dev (1 min)
   └─ Lance le server

6. Tests manuels (10 min)
   └─ Notifications, Profile, Edit, Search
   └─ Vérifier animations, transitions

TEMPS TOTAL: ~20 minutes
```

---

## POINTS DE CONTRÔLE (STOP SI...)

❌ **STOP après npm ci si:**
- npm ls --depth=0 affiche encore des "invalid"
- npm ls --depth=0 affiche 'motion' version autre que 11.15.0

❌ **STOP après vite.config.ts si:**
- Le fichier ne sauvegarde pas
- Le format JSON/TypeScript est cassé

❌ **STOP après tsconfig.json si:**
- TypeScript lance une erreur
- Il reste des `"noImplicitAny"` en double

❌ **STOP après npm run build si:**
- Build fails
- Erreurs TypeScript apparaissent

❌ **STOP après npm run dev si:**
- Server ne démarre pas
- Port 3000 déjà utilisé (changer avec --port 3001)

---

## ROLLBACK PLAN (Si quelque chose va mal)

### Si npm ci a échoué:
```powershell
git checkout package-lock.json
# Puis relancer npm ci
```

### Si vite.config.ts cassé:
```powershell
git checkout vite.config.ts
# Puis refaire manuelle la suppression
```

### Si tsconfig.json cassé:
```powershell
git checkout tsconfig.json
# Puis refaire la suppression de ligne 12
```

### Générale:
```powershell
git status               # Voir les modifications
git diff vite.config.ts # Voir les changements exacts
git checkout .          # Rollback tout
```

---

## NOTES IMPORTANTES

1. **Vous pouvez faire ça sans internet** (npm ci télécharge rien de nouveau)
2. **Aucun code ne change** (juste les versions et config)
3. **Les modifications sont minimalistes** (pas de refactoring)
4. **Le risque est très bas** (c'est juste corriger des versions)
5. **Les résultats doivent être immédiats** (dès que npm ci finit, ça devrait marcher)

---

**Guide technique terminé. Prêt pour exécution dès que vous autorisez.**
