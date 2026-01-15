# 💡 Système d'Aide Contextuelle - TransportBF

## 🎯 Vue d'ensemble

Le **système d'aide contextuelle** (ContextualHelp) est un tutoriel interactif qui guide les nouveaux utilisateurs à travers les fonctionnalités de l'application. Il apparaît automatiquement lors de la première visite et peut être rappelé à tout moment.

### Caractéristiques principales

✅ **Apparition automatique** - S'affiche au premier chargement  
✅ **Mémorisation** - Ne se réaffiche pas si déjà vu (localStorage)  
✅ **Navigation séquentielle** - Plusieurs conseils avec progression  
✅ **Skippable** - Bouton "Passer" pour ignorer  
✅ **Réaffichable** - Bouton "Besoin d'aide ?" pour relancer  
✅ **Design moderne** - Modal avec backdrop blur et animations  

---

## 🏗️ Architecture

### Composant principal : `ContextualHelp`

**Localisation** : `/components/ContextualHelp.tsx`

**Principe de fonctionnement** :

```
1. Au chargement de la page
   ↓
2. Vérifier localStorage('help-dismissed')
   ↓
3. Si pas vu (null) → Afficher après 1 seconde
   ↓
4. Modal plein écran avec overlay
   ↓
5. Afficher conseils 1 par 1
   ↓
6. Navigation : "Passer" ou "Suivant"
   ↓
7. À la fin : Marquer comme vu dans localStorage
```

---

## 📖 Utilisation dans votre code

### 1. Importer le composant

```typescript
import { ContextualHelp, HelpButton } from '../components/ContextualHelp';
```

### 2. Définir vos conseils

Créer un tableau de conseils avec structure :

```typescript
const helpTips = [
  {
    id: 'tip-1',                    // ID unique (requis)
    title: 'Titre du conseil',      // Titre affiché (requis)
    message: 'Explication détaillée' // Message (requis)
  },
  {
    id: 'tip-2',
    title: 'Deuxième conseil',
    message: 'Plus d\'informations ici...'
  },
  // ... autant de conseils que nécessaire
];
```

### 3. Gérer la visibilité

```typescript
const [showHelp, setShowHelp] = useState(false);

useEffect(() => {
  // Afficher l'aide au premier chargement
  const hasSeenHelp = localStorage.getItem('home-help-seen');
  if (!hasSeenHelp) {
    setTimeout(() => setShowHelp(true), 500);
  }
}, []);
```

### 4. Intégrer dans votre page

```typescript
return (
  <div>
    {/* Votre contenu de page */}
    
    {/* Bouton pour réafficher l'aide */}
    <HelpButton 
      onClick={() => setShowHelp(true)} 
      label="Besoin d'aide ?" 
    />
    
    {/* Modal d'aide contextuelle */}
    {showHelp && (
      <ContextualHelp
        tips={helpTips}
        storageKey="home-help-seen"
        onComplete={() => setShowHelp(false)}
      />
    )}
  </div>
);
```

---

## 🎨 Props du composant

### `ContextualHelp`

| Prop | Type | Requis | Description |
|------|------|--------|-------------|
| `tips` | `HelpTip[]` | ✅ | Tableau de conseils à afficher |
| `storageKey` | `string` | ❌ | Clé localStorage (défaut: 'help-dismissed') |
| `onComplete` | `() => void` | ❌ | Callback appelé quand l'utilisateur termine |

### `HelpTip` (interface)

```typescript
interface HelpTip {
  id: string;          // Identifiant unique
  title: string;       // Titre du conseil
  message: string;     // Description détaillée
  position?: string;   // Réservé pour usage futur
}
```

### `HelpButton`

| Prop | Type | Requis | Description |
|------|------|--------|-------------|
| `onClick` | `() => void` | ✅ | Action au clic |
| `label` | `string` | ❌ | Texte du bouton (défaut: "Besoin d'aide ?") |

---

## 📱 Exemple complet : HomePage

```typescript
import { useState, useEffect } from 'react';
import { ContextualHelp, HelpButton } from '../components/ContextualHelp';

export function HomePage() {
  const [showHelp, setShowHelp] = useState(false);

  // Conseils personnalisés pour HomePage
  const helpTips = [
    {
      id: 'tip-1',
      title: 'Bienvenue sur TransportBF !',
      message: 'Réservez facilement vos trajets en bus. Choisissez votre ville de départ et d\'arrivée pour commencer.'
    },
    {
      id: 'tip-2',
      title: 'Routes populaires',
      message: 'Cliquez sur une route populaire ci-dessous pour remplir automatiquement votre recherche.'
    },
    {
      id: 'tip-3',
      title: 'Paiement sécurisé',
      message: 'Payez avec Orange Money, Moov Money ou par carte bancaire. Tous les paiements sont 100% sécurisés.'
    }
  ];

  useEffect(() => {
    // Auto-affichage au premier chargement
    const hasSeenHelp = localStorage.getItem('home-help-seen');
    if (!hasSeenHelp) {
      setTimeout(() => setShowHelp(true), 500);
    }
  }, []);

  return (
    <div className="min-h-screen p-6">
      {/* Header avec bouton d'aide */}
      <div className="flex justify-between items-center mb-6">
        <h1>Accueil</h1>
        <HelpButton onClick={() => setShowHelp(true)} />
      </div>

      {/* Contenu de la page */}
      <div>
        {/* ... votre contenu ... */}
      </div>

      {/* Modal d'aide */}
      {showHelp && (
        <ContextualHelp
          tips={helpTips}
          storageKey="home-help-seen"
          onComplete={() => setShowHelp(false)}
        />
      )}
    </div>
  );
}
```

---

## 🎯 Exemples d'utilisation par page

### 1. Page de recherche (HomePage)

```typescript
const helpTips = [
  {
    id: 'search-1',
    title: 'Recherche de trajets',
    message: 'Sélectionnez votre ville de départ et d\'arrivée. Vous pouvez choisir un aller simple ou un aller-retour.'
  },
  {
    id: 'search-2',
    title: 'Filtres avancés',
    message: 'Utilisez les filtres pour affiner votre recherche par compagnie, horaire ou équipements.'
  }
];
```

### 2. Page de sélection de sièges (SeatSelectionPage)

```typescript
const helpTips = [
  {
    id: 'seat-1',
    title: 'Sélection des sièges',
    message: 'Cliquez sur un siège vert pour le sélectionner. Les sièges rouges sont déjà réservés.'
  },
  {
    id: 'seat-2',
    title: 'Temps limité',
    message: 'Vous avez 10 minutes pour finaliser votre réservation avant expiration.'
  }
];
```

### 3. Page de paiement (PaymentPage)

```typescript
const helpTips = [
  {
    id: 'payment-1',
    title: 'Moyens de paiement',
    message: 'Choisissez votre mode de paiement : Orange Money, Moov Money ou carte bancaire.'
  },
  {
    id: 'payment-2',
    title: 'Sécurité',
    message: 'Vos données de paiement sont cryptées et sécurisées. Nous ne stockons jamais vos informations bancaires.'
  }
];
```

### 4. Page des billets (TicketsPage)

```typescript
const helpTips = [
  {
    id: 'tickets-1',
    title: 'Mes billets',
    message: 'Retrouvez ici tous vos billets actifs, embarqués, annulés ou expirés.'
  },
  {
    id: 'tickets-2',
    title: 'QR Code',
    message: 'Présentez le QR Code de votre billet au chauffeur lors de l\'embarquement.'
  },
  {
    id: 'tickets-3',
    title: 'Transfert et annulation',
    message: 'Vous pouvez transférer un billet ou l\'annuler jusqu\'à 1h avant le départ.'
  }
];
```

### 5. Page des compagnies (OperatorsPage)

```typescript
const helpTips = [
  {
    id: 'operators-1',
    title: 'Compagnies de transport',
    message: 'Découvrez toutes les compagnies disponibles avec leurs notes et équipements.'
  },
  {
    id: 'operators-2',
    title: 'Stories',
    message: 'Cliquez sur le logo avec cercle coloré pour voir les promotions et nouveautés de la compagnie.'
  }
];
```

---

## 🎨 Design du modal

### Apparence visuelle

```
┌─────────────────────────────────────┐
│  [X]                                │
│                                     │
│   🟢                                │
│  Icon                               │
│                                     │
│  Titre du conseil                   │
│  Message d'explication détaillé     │
│  sur plusieurs lignes...            │
│                                     │
│     • • • ━━━ •                     │
│   (Progress dots)                   │
│                                     │
│  ┌─────────┐  ┌──────────────┐     │
│  │ Passer  │  │   Suivant    │     │
│  └─────────┘  └──────────────┘     │
│                                     │
│     Conseil 1 sur 3                 │
└─────────────────────────────────────┘
```

### Éléments du design

1. **Overlay** : Fond noir semi-transparent avec blur
2. **Modal** : Carte blanche centrée, arrondie, ombres
3. **Icône** : Cercle vert avec icône HelpCircle
4. **Titre** : Texte noir, taille XL
5. **Message** : Texte gris, paragraphe
6. **Progress dots** : Points pour indiquer l'avancement
7. **Boutons** :
   - "Passer" : Outline gris
   - "Suivant"/"Compris !" : Vert avec gradient
8. **Compteur** : Petit texte gris centré

---

## 🔧 Personnalisation

### 1. Changer les couleurs

Modifier dans `/components/ContextualHelp.tsx` :

```typescript
// Couleur de l'icône (actuellement vert)
<div className="w-14 h-14 bg-green-100 rounded-full">
  <HelpCircle className="w-7 h-7 text-green-600" />
</div>

// Couleur du bouton principal
<Button className="bg-gradient-to-r from-green-600 to-green-700">
```

**Pour couleurs BF (rouge/ambre/vert)** :

```typescript
<div className="w-14 h-14 bg-gradient-to-r from-red-100 via-amber-100 to-green-100 rounded-full">
  <HelpCircle className="w-7 h-7 text-red-600" />
</div>

<Button className="bg-gradient-to-r from-red-600 via-amber-500 to-green-600">
```

### 2. Changer le délai d'apparition

```typescript
// Actuellement 1000ms (1 seconde)
setTimeout(() => setIsVisible(true), 1000);

// Pour 2 secondes
setTimeout(() => setIsVisible(true), 2000);

// Pour affichage immédiat
setIsVisible(true);
```

### 3. Ajouter des animations

Le composant utilise déjà des classes Tailwind pour animations :

```typescript
className="animate-in fade-in slide-in-from-bottom-4 duration-300"
```

**Variantes possibles** :
- `slide-in-from-top-4` - Glisse depuis le haut
- `slide-in-from-left-4` - Glisse depuis la gauche
- `slide-in-from-right-4` - Glisse depuis la droite
- `zoom-in` - Effet de zoom
- `duration-500` - Animation plus lente

### 4. Changer la position

Actuellement centré avec `flex items-center justify-center`. Pour positionner ailleurs :

```typescript
// En haut
<div className="fixed inset-0 flex items-start justify-center pt-20">

// En bas
<div className="fixed inset-0 flex items-end justify-center pb-20">

// En bas à droite
<div className="fixed bottom-4 right-4">
```

---

## 💾 Gestion du localStorage

### Clés utilisées

Chaque page/section a sa propre clé :

```typescript
'home-help-seen'      // HomePage
'search-help-seen'    // SearchResultsPage
'seat-help-seen'      // SeatSelectionPage
'payment-help-seen'   // PaymentPage
'tickets-help-seen'   // TicketsPage
```

### Réinitialiser l'aide

Pour qu'un utilisateur revoie les conseils :

**Option 1** : Dans ProfilePage, ajouter un bouton

```typescript
const resetHelp = () => {
  localStorage.removeItem('home-help-seen');
  localStorage.removeItem('search-help-seen');
  localStorage.removeItem('seat-help-seen');
  localStorage.removeItem('payment-help-seen');
  localStorage.removeItem('tickets-help-seen');
  toast.success('Conseils réinitialisés !');
};

<Button onClick={resetHelp}>
  Réinitialiser les conseils
</Button>
```

**Option 2** : Console développeur

```javascript
localStorage.clear(); // Efface tout
// ou
localStorage.removeItem('home-help-seen'); // Juste HomePage
```

---

## 🌍 Internationalisation (i18n)

Pour supporter plusieurs langues :

```typescript
import { t } from '../lib/i18n';

const helpTips = [
  {
    id: 'tip-1',
    title: t('help.welcome.title', currentLang),
    message: t('help.welcome.message', currentLang)
  }
];
```

Ajouter dans `/lib/i18n.ts` :

```typescript
const translations = {
  'help.welcome.title': {
    fr: 'Bienvenue sur TransportBF !',
    en: 'Welcome to TransportBF!',
    mo: 'Bõn-wẽnd TransportBF kẽer!'
  },
  'help.welcome.message': {
    fr: 'Réservez facilement vos trajets en bus.',
    en: 'Easily book your bus trips.',
    mo: 'Bɩ tũud bàas a yɩɩl zĩig.'
  }
};
```

---

## 📊 Analytics et tracking

Pour mesurer l'engagement avec les conseils :

```typescript
const handleNext = () => {
  // Track analytics
  if (typeof gtag !== 'undefined') {
    gtag('event', 'help_tip_viewed', {
      tip_id: currentTip.id,
      tip_index: currentTipIndex + 1,
      page: 'home'
    });
  }

  if (currentTipIndex < tips.length - 1) {
    setCurrentTipIndex(currentTipIndex + 1);
  } else {
    handleDismiss();
  }
};

const handleDismiss = () => {
  // Track dismissal
  if (typeof gtag !== 'undefined') {
    gtag('event', 'help_dismissed', {
      dismissed_at: currentTipIndex + 1,
      total_tips: tips.length,
      page: 'home'
    });
  }

  localStorage.setItem(storageKey, 'true');
  setIsVisible(false);
  onComplete?.();
};
```

---

## 🧪 Tests recommandés

### Test 1 : Premier chargement

```
1. Ouvrir l'app en navigation privée
2. Se connecter
3. Vérifier que les conseils apparaissent après 1 seconde
4. Cliquer "Suivant" pour chaque conseil
5. Vérifier que localStorage contient la clé
6. Recharger la page
7. Vérifier que les conseils ne réapparaissent pas
```

### Test 2 : Bouton d'aide

```
1. Après avoir vu les conseils
2. Cliquer sur "Besoin d'aide ?"
3. Vérifier que les conseils se réaffichent
4. Cliquer "Passer"
5. Vérifier que le modal se ferme
```

### Test 3 : Navigation

```
1. Afficher les conseils (3 au total)
2. Cliquer 2 fois "Suivant"
3. Vérifier qu'on est au conseil 3/3
4. Vérifier que le bouton dit "Compris !"
5. Cliquer "Compris !"
6. Vérifier que le modal se ferme
```

---

## 🎯 Bonnes pratiques

### ✅ À faire

1. **Limiter à 3-5 conseils maximum** par page
   - Trop de conseils fatigue l'utilisateur
   - Aller à l'essentiel

2. **Messages courts et clairs**
   - Max 2-3 lignes par conseil
   - Langage simple et direct

3. **Afficher au bon moment**
   - Délai de 500ms-1s après le chargement
   - Laisser le temps à l'utilisateur de s'orienter

4. **Permettre de passer**
   - Bouton "Passer" toujours visible
   - Ne pas bloquer l'utilisateur

5. **Icônes et visuels**
   - Utiliser l'icône HelpCircle (reconnaissable)
   - Couleurs douces (vert rassurant)

### ❌ À éviter

1. **Trop de conseils** (> 5)
   - Devient fatiguant
   - Utilisateur va tout passer

2. **Texte trop long**
   - Paragraphes denses
   - Jargon technique

3. **Affichage trop rapide**
   - Surprend l'utilisateur
   - Semble agressif

4. **Bloquer l'accès**
   - Forcer à lire tous les conseils
   - Pas de bouton "Passer"

5. **Toujours réafficher**
   - Ne pas stocker dans localStorage
   - Agace l'utilisateur régulier

---

## 🔄 Workflow complet

```
Utilisateur crée un compte
         ↓
   Arrive sur HomePage
         ↓
useEffect vérifie localStorage('home-help-seen')
         ↓
     Null ? (premier chargement)
         ↓ OUI
   Délai 500ms
         ↓
  Affichage modal ContextualHelp
         ↓
Affiche conseil 1/3 avec progress dots
         ↓
    User clique "Suivant"
         ↓
Affiche conseil 2/3
         ↓
    User clique "Suivant"
         ↓
Affiche conseil 3/3 (bouton "Compris !")
         ↓
    User clique "Compris !"
         ↓
  localStorage.setItem('home-help-seen', 'true')
         ↓
   Modal se ferme
         ↓
   onComplete() appelé
         ↓
   setShowHelp(false)
         ↓
User peut cliquer "Besoin d'aide ?" pour relancer
```

---

## 📚 Résumé des fichiers

| Fichier | Rôle |
|---------|------|
| `/components/ContextualHelp.tsx` | Composant modal d'aide |
| `/pages/HomePage.tsx` | Exemple d'utilisation |
| `/lib/i18n.ts` | Traductions (si multilingue) |

---

## 🚀 Prochaines améliorations possibles

### 1. Tooltips inline

Au lieu d'un modal, afficher des bulles d'aide à côté des éléments :

```typescript
<Tooltip content="Sélectionnez votre ville de départ">
  <Input placeholder="De..." />
</Tooltip>
```

### 2. Tour guidé interactif

Highlight des éléments avec pointeur :

```
┌─────────────────────────┐
│                         │
│   ← Cliquez ici pour    │
│      commencer          │
│  [Bouton Rechercher]    │
│                         │
└─────────────────────────┘
```

### 3. Vidéo tutoriel

Intégrer une vidéo courte (30s) :

```typescript
const helpTips = [
  {
    id: 'video-1',
    title: 'Comment réserver',
    message: 'Regardez cette courte vidéo',
    videoUrl: 'https://...'
  }
];
```

### 4. Quiz de compréhension

Tester la compréhension avec questions :

```typescript
{
  id: 'quiz-1',
  title: 'Question',
  message: 'À quel moment pouvez-vous annuler un billet ?',
  options: ['Jamais', '1h avant', '24h avant'],
  correctAnswer: 1
}
```

---

**Dernière mise à jour** : 4 novembre 2025  
**Version** : 1.0.0  
**Auteur** : TransportBF Team
