# 📚 GUIDE DES HOOKS ET UTILS PARTAGÉS

## 🎯 Objectif

Ce dossier `/shared` contient tous les **hooks** et **utils** communs utilisables dans l'**Application Admin** et l'**Application Société**.

**Règle d'or : ZÉRO DUPLICATION**

Toute logique réutilisable doit être placée ici pour éviter la duplication de code entre les deux applications.

---

## 📁 Structure

```
/shared/
├── hooks/               # Hooks React réutilisables
│   ├── index.ts        # Export centralisé
│   ├── useLocalStorage.ts
│   ├── useDebounce.ts
│   ├── useMediaQuery.ts
│   ├── useNotifications.ts
│   ├── useExport.ts
│   └── useConfirm.ts
│
├── utils/              # Fonctions utilitaires
│   ├── index.ts        # Export centralisé
│   ├── arrayHelpers.ts
│   ├── objectHelpers.ts
│   ├── dateHelpers.ts
│   ├── stringHelpers.ts
│   ├── formatters.ts
│   └── validators.ts
│
├── services/           # Services API
│   ├── apiClient.ts
│   ├── constants.ts
│   └── index.ts
│
└── types/              # Types TypeScript partagés
    ├── index.ts
    ├── enums.ts
    └── standardized.ts
```

---

## 🪝 HOOKS DISPONIBLES

### 1. Hooks Génériques

#### `useLocalStorage<T>(key: string, initialValue: T)`

Gère le localStorage avec synchronisation entre onglets.

```tsx
import { useLocalStorage } from '@/shared/hooks';

const [theme, setTheme] = useLocalStorage('theme', 'light');
```

**Cas d'usage :**
- Préférences utilisateur (thème, langue, etc.)
- Sauvegarder l'état de filtres
- Cache local de données

---

#### `useDebounce<T>(value: T, delay?: number)`

Debounce une valeur pour limiter les appels API.

```tsx
import { useDebounce } from '@/shared/hooks';

const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebounce(searchTerm, 500);

useEffect(() => {
  // Appeler l'API avec debouncedSearch
}, [debouncedSearch]);
```

**Cas d'usage :**
- Champs de recherche
- Filtres en temps réel
- Auto-save

---

#### `useMediaQuery(query: string)`

Détecte les media queries pour le responsive design.

```tsx
import { useIsMobile, useIsDesktop, useBreakpoint } from '@/shared/hooks';

const isMobile = useIsMobile();
const isDesktop = useIsDesktop();
const isLargeScreen = useBreakpoint('xl');
```

**Breakpoints disponibles :**
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

---

### 2. Hooks Métier

#### `useNotifications()`

Gestion centralisée des notifications (toasts).

```tsx
import { useNotifications } from '@/shared/hooks';

const notify = useNotifications();

// Notifications simples
notify.success('Opération réussie');
notify.error('Une erreur est survenue');
notify.warning('Attention !');
notify.info('Information');

// Avec options
notify.success('Véhicule créé', {
  description: 'Le véhicule a été ajouté à la flotte',
  duration: 5000,
  action: {
    label: 'Voir',
    onClick: () => navigate('/vehicles/123'),
  },
});

// Avec promesse (loading automatique)
notify.promise(
  api.createVehicle(data),
  {
    loading: 'Création du véhicule...',
    success: 'Véhicule créé avec succès',
    error: 'Erreur lors de la création',
  }
);

// Presets pour actions communes
notify.presets.created('Véhicule');
notify.presets.updated('Station');
notify.presets.deleted('Utilisateur');
notify.presets.networkError();
```

---

#### `useExport()`

Export de données en CSV, JSON ou Excel.

```tsx
import { useExport } from '@/shared/hooks';

const { exportToCSV, exportToJSON, exportToExcel } = useExport();

// Export CSV simple
const handleExport = () => {
  exportToCSV(vehicles, {
    filename: 'vehicules.csv',
  });
};

// Export avec transformation
const handleExport = () => {
  exportToExcel(vehicles, {
    filename: 'vehicules.csv',
    headers: ['Immatriculation', 'Marque', 'Modèle', 'Statut'],
    transform: (vehicle) => ({
      Immatriculation: vehicle.registration,
      Marque: vehicle.brand,
      Modèle: vehicle.model,
      Statut: vehicle.status,
    }),
  });
};
```

---

#### `useConfirm()`

Dialogues de confirmation asynchrones.

```tsx
import { useConfirm } from '@/shared/hooks';

const { confirm, presets } = useConfirm();

// Confirmation simple
const handleDelete = async () => {
  const confirmed = await confirm({
    title: 'Supprimer le véhicule',
    message: 'Êtes-vous sûr ?',
    variant: 'danger',
  });
  
  if (confirmed) {
    await deleteVehicle(id);
  }
};

// Avec preset
const handleDelete = async () => {
  if (await presets.delete('ce véhicule')) {
    await deleteVehicle(id);
  }
};

// Autres presets disponibles
presets.discard(); // Annuler modifications
presets.archive('ce véhicule');
presets.activate('cette station');
presets.deactivate('cet opérateur');
```

---

## 🛠️ UTILS DISPONIBLES

### 1. Array Helpers

```tsx
import { 
  groupBy, 
  sortBy, 
  unique, 
  chunk, 
  paginate,
  average,
  sum,
} from '@/shared/utils';

// Grouper par statut
const grouped = groupBy(vehicles, 'status');

// Trier par plusieurs clés
const sorted = sortBy(vehicles, 'brand', 'model');

// Obtenir valeurs uniques
const uniqueBrands = unique(vehicles.map(v => v.brand));

// Diviser en chunks de 10
const chunks = chunk(vehicles, 10);

// Paginer
const page1 = paginate(vehicles, 1, 20);

// Calculer moyenne
const avgPrice = average(vehicles.map(v => v.price));
```

**Fonctions disponibles :**
- `groupBy` - Grouper par clé
- `sortBy` - Trier par clés multiples
- `unique` - Valeurs uniques
- `uniqueBy` - Objets uniques par clé
- `chunk` - Diviser en chunks
- `shuffle` - Mélanger
- `countBy` - Compter occurrences
- `sum` - Somme
- `average` - Moyenne
- `minMax` - Min et max
- `paginate` - Paginer
- `compact` - Filtrer valeurs falsy

---

### 2. Object Helpers

```tsx
import { 
  pick, 
  omit, 
  deepMerge, 
  deepClone,
  get,
  set,
  isEqual,
} from '@/shared/utils';

// Sélectionner certaines clés
const publicData = pick(user, ['id', 'name', 'email']);

// Exclure certaines clés
const withoutPassword = omit(user, ['password', 'token']);

// Merger profondément
const updated = deepMerge(currentSettings, newSettings);

// Cloner profondément
const clone = deepClone(vehicle);

// Accès nested
const city = get(user, 'address.city', 'Ouagadougou');

// Définir nested
set(user, 'address.city', 'Bobo-Dioulasso');

// Comparer
const areEqual = isEqual(obj1, obj2);
```

**Fonctions disponibles :**
- `isEmpty` - Objet vide
- `pick` - Sélectionner clés
- `omit` - Exclure clés
- `deepMerge` - Merge profond
- `deepClone` - Clone profond
- `get` - Accès nested
- `set` - Définir nested
- `isEqual` - Comparaison profonde
- `cleanObject` - Supprimer null/undefined
- `mapKeys` - Mapper les clés
- `mapValues` - Mapper les valeurs

---

### 3. Date Helpers

```tsx
import { 
  formatDate,
  formatDateTime,
  getRelativeTime,
  addDays,
  startOfMonth,
  diffInDays,
  formatDuration,
} from '@/shared/utils';

// Formater dates
formatDate(new Date(), 'short'); // "05/02/2026"
formatDate(new Date(), 'long');  // "5 février 2026"
formatDateTime(new Date());      // "05/02/2026 14:30"

// Date relative
getRelativeTime(vehicle.createdAt); // "Il y a 2 jours"

// Manipulations
const tomorrow = addDays(new Date(), 1);
const monthStart = startOfMonth(new Date());
const diff = diffInDays(date1, date2);

// Durée
formatDuration(125); // "2h05min"
```

**Fonctions disponibles :**
- `formatDate` - Formater date
- `formatDateTime` - Date + heure
- `getRelativeTime` - Date relative
- `isToday`, `isThisWeek`, `isThisMonth`
- `addDays`, `subtractDays`
- `startOfDay`, `endOfDay`
- `startOfWeek`, `startOfMonth`, `endOfMonth`
- `diffInDays` - Différence en jours
- `getDateRange` - Range de dates
- `isPast`, `isFuture`
- `formatDuration` - Formater durée

---

### 4. String Helpers

```tsx
import { 
  capitalize,
  slugify,
  formatPhoneBF,
  formatCurrency,
  truncate,
  getInitials,
} from '@/shared/utils';

// Capitaliser
capitalize('bonjour'); // "Bonjour"
capitalizeWords('bonjour monde'); // "Bonjour Monde"

// Slug
slugify('Société de Transport Étoile'); // "societe-de-transport-etoile"

// Téléphone burkinabé
formatPhoneBF('70123456'); // "70 12 34 56"
isPhoneBF('+226 70123456'); // true

// Monnaie
formatCurrency(15000); // "15 000 FCFA"

// Tronquer
truncate('Un texte très long...', 20); // "Un texte très lo..."

// Initiales
getInitials('Jean Kaboré'); // "JK"
```

**Fonctions disponibles :**
- `capitalize`, `capitalizeWords`
- `toKebabCase`, `toCamelCase`, `toSnakeCase`
- `slugify` - Slug URL
- `truncate` - Tronquer
- `wordCount` - Compter mots
- `isNumeric` - Vérifier nombre
- `isEmail` - Vérifier email
- `isPhoneBF` - Vérifier téléphone BF
- `formatPhoneBF` - Formater téléphone
- `formatCurrency` - Formater FCFA
- `mask` - Masquer données
- `getInitials` - Initiales
- `generateId` - ID aléatoire
- `escapeHtml` - Échapper HTML

---

## 🎨 Bonnes Pratiques

### 1. Import Centralisé

Toujours importer depuis les fichiers index :

```tsx
// ✅ BON
import { useDebounce, formatDate, groupBy } from '@/shared/hooks';
import { formatDate, isPhoneBF } from '@/shared/utils';

// ❌ MAUVAIS
import { useDebounce } from '@/shared/hooks/useDebounce';
import { formatDate } from '@/shared/utils/dateHelpers';
```

---

### 2. Typage TypeScript

Utiliser les types exportés :

```tsx
import { useNotifications, NotificationOptions } from '@/shared/hooks';

const options: NotificationOptions = {
  title: 'Succès',
  duration: 5000,
};
```

---

### 3. Réutilisation

Avant de créer une nouvelle fonction, vérifier si elle existe déjà dans `/shared` !

---

### 4. Documentation

Chaque nouvelle fonction doit être documentée avec :
- Description
- Paramètres
- Exemple d'utilisation
- Type de retour

---

## 🚀 Utilisation dans les Apps

### Application Admin (racine)

```tsx
// /App.tsx ou /components/dashboard/*.tsx
import { useNotifications, useExport } from '@/shared/hooks';
import { formatDate, groupBy } from '@/shared/utils';
```

### Application Société (/societe)

```tsx
// /societe/src/pages/*.tsx
import { useNotifications, useExport } from '../../../shared/hooks';
import { formatDate, groupBy } from '../../../shared/utils';
```

Ou configurer un alias dans `tsconfig.json` :

```json
{
  "compilerOptions": {
    "paths": {
      "@shared/*": ["../shared/*"]
    }
  }
}
```

Puis :

```tsx
import { useNotifications } from '@shared/hooks';
import { formatDate } from '@shared/utils';
```

---

## 📝 Ajouter un Nouveau Hook/Util

1. **Créer le fichier** dans le bon dossier (`/shared/hooks/` ou `/shared/utils/`)
2. **Documenter** avec JSDoc et exemples
3. **Exporter** dans le fichier `index.ts` correspondant
4. **Tester** dans les deux applications (Admin et Société)
5. **Mettre à jour** ce README

---

## 🎯 Objectifs Atteints

✅ **ZÉRO DUPLICATION** - Toute logique commune est centralisée  
✅ **Réutilisabilité** - Hooks et utils utilisables dans Admin et Société  
✅ **Typage Fort** - TypeScript pour la sécurité  
✅ **Documentation** - Chaque fonction est documentée  
✅ **Maintenabilité** - Code organisé et facile à maintenir  

---

## 📚 Ressources

- [React Hooks Documentation](https://react.dev/reference/react)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Sonner (Toasts)](https://sonner.emilkowal.ski/)

---

**Dernière mise à jour : 5 février 2026**
