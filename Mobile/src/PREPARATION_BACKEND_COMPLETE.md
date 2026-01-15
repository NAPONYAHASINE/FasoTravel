# 🚀 Préparation Backend Complète - TransportBF

## ✅ Ce qui a été fait

### 1. **AuthPage - Boutons de connexion améliorés**
- ✅ Les 2 boutons (Se connecter / S'inscrire) sont maintenant côte à côte **horizontalement**
- ✅ Taille réduite et optimisée pour mobile
- ✅ max-width: 384px (max-w-xs) pour éviter qu'ils soient trop larges
- ✅ Meilleur espacement et animations

**Fichier modifié:** `/pages/AuthPage.tsx`

---

### 2. **Moyens de paiement dynamiques (Backend Ready)**

#### Hook créé: `usePaymentMethods()`
**Localisation:** `/lib/hooks.ts`

**Ce qu'il fait:**
- Récupère la liste des moyens de paiement depuis le backend
- Retourne: `{ methods, isLoading, error }`
- Chaque méthode contient:
  ```typescript
  {
    id: string;              // 'orange_money', 'moov_money', 'credit_card'
    name: string;            // 'Orange Money'
    type: 'mobile_money' | 'card' | 'cash';
    provider: string;        // 'orange', 'moov', 'visa'
    logo: string;            // Emoji ou URL
    enabled: boolean;        // Activé ou non
    min_amount?: number;     // Montant minimum
    max_amount?: number;     // Montant maximum
    fees_percentage?: number; // Frais en %
  }
  ```

**Backend endpoint requis:**
```
GET /api/payment-methods
Response: PaymentMethod[]
```

**Implémentation dans PaymentPage:**
- ✅ La liste des moyens de paiement est maintenant chargée dynamiquement
- ✅ Affiche un skeleton loader pendant le chargement
- ✅ Affiche les frais en pourcentage si disponibles
- ✅ Icônes et couleurs adaptées au provider (Orange = orange, Moov = bleu, Carte = vert)

**Fichier modifié:** `/pages/PaymentPage.tsx`

---

### 3. **Logos et images de véhicules pour compagnies (Backend Ready)**

#### Types modifiés: `Operator`
**Localisation:** `/lib/api.ts` et `/data/models.ts`

**Nouveaux champs ajoutés:**
```typescript
interface Operator {
  id: string;
  name: string;
  logo: string;              // Emoji par défaut (pour fallback)
  logo_url?: string;         // ✅ NOUVEAU: URL du vrai logo depuis backend
  vehicle_image_url?: string; // ✅ NOUVEAU: URL de l'image du car depuis backend
  rating: number;
  total_trips: number;
  description?: string;
  amenities?: string[];
  phone?: string;
  email?: string;
  is_active: boolean;
}
```

**Utilisation dans OperatorsPage:**
- ✅ Si `logo_url` existe → affiche l'image du logo
- ✅ Sinon → affiche l'emoji par défaut (fallback)
- 🔜 À faire: Afficher `vehicle_image_url` dans la zone au-dessus des couleurs rouge/doré/vert

**Fichier modifié:** `/pages/OperatorsPage.tsx`

**Backend endpoint requis:**
```
GET /api/operators
Response: Operator[] (avec logo_url et vehicle_image_url)
```

---

### 4. **Villes (Stations) depuis backend (Déjà prêt)**

#### Hook existant: `useStations()`
**Localisation:** `/lib/hooks.ts`

**Ce qu'il fait:**
- ✅ Récupère toutes les stations/gares depuis le backend
- ✅ Utilisé dans HomePage pour les autocomplete
- ✅ Utilisé dans SearchPage pour afficher les destinations

**Backend endpoint requis:**
```
GET /api/stations
Response: Station[]
```

**Déjà implémenté dans:**
- `/pages/HomePage.tsx`
- `/pages/SearchResultsPage.tsx`

---

### 5. **Stories et catégories (Admin Ready)**

#### Hooks créés pour les administrateurs:

**a) `useStoryCategories()`**
- Récupère toutes les catégories de stories
- Utilisé par les admins pour voir les catégories disponibles
- Endpoint: `GET /api/story-categories`

**b) `useCreateStoryCategory()`**
- Permet aux admins de créer de nouvelles catégories
- Endpoint: `POST /api/story-categories`
- Paramètres: `{ name, slug, emoji, description }`

**c) `usePublishStory()`**
- Permet aux admins de publier une nouvelle story
- Endpoint: `POST /api/stories`
- Paramètres:
  ```typescript
  {
    title: string;
    description: string;
    emoji: string;
    category_id: string;
    gradient_from: string;
    gradient_to: string;
    expires_at?: string;
  }
  ```

**Catégories par défaut:**
- 🎁 Promotions (PROMO)
- ✨ Nouveautés (NEW)
- 🏖️ Destinations (DESTINATION)
- 💡 Conseils (TIPS)
- 🤝 Partenaires (PARTNERS)
- 📢 Annonces (ANNOUNCEMENT)

**Les admins peuvent:**
1. Créer de nouvelles catégories personnalisées
2. Publier des stories dans les catégories existantes ou nouvelles
3. Toutes les stories apparaissent automatiquement dans le composant `StoriesCircle`

**Fichiers modifiés:** `/lib/hooks.ts`

---

### 6. **Stories des compagnies Instagram-style (Backend Ready)**

#### Système complet de stories pour les compagnies de transport

**Nouveaux types ajoutés:**
```typescript
interface OperatorStory {
  id: string;
  operator_id: string;
  type: 'PROMO' | 'NEW_ROUTE' | 'ANNOUNCEMENT' | 'EVENT' | 'ACHIEVEMENT';
  media_type: 'image' | 'video' | 'gradient';
  media_url?: string;        // ✅ BACKEND: URL de l'image/vidéo
  gradient?: string;          // Fallback si pas de media_url
  title: string;
  subtitle?: string;
  description?: string;
  emoji?: string;
  cta_text?: string;          // Call to action
  cta_link?: string;
  duration_seconds?: number;  // Durée d'affichage (défaut 5s)
  created_at: string;
  expires_at: string;
  is_viewed: boolean;         // ✅ BACKEND: Tracked per user
}
```

**Champs ajoutés à l'interface Operator:**
```typescript
interface Operator {
  // ... champs existants
  has_unread_stories?: boolean; // ✅ BACKEND: True si stories non vues par l'utilisateur
  stories_count?: number;       // ✅ BACKEND: Nombre total de stories actives
}
```

#### Hooks créés:

**a) `useOperatorStories(operatorId: string)`**
- Récupère toutes les stories actives d'une compagnie
- Filtre automatiquement les stories expirées
- Endpoint: `GET /operators/{operator_id}/stories`
- Response: `OperatorStory[]`

**b) Fonction API: `markStoryAsViewed(operatorId, storyId)`**
- Marque une story comme vue par l'utilisateur connecté
- Endpoint: `POST /operators/{operator_id}/stories/{story_id}/view`
- Met à jour `is_viewed` et recalcule `has_unread_stories`

#### Composants UI:

**`OperatorStoriesViewer`** - Modal plein écran type Instagram
- 📱 Navigation tactile (tap gauche/droite)
- ⏱️ Auto-progression 5 secondes par story
- 📊 Progress bars en haut
- 🏷️ Badge de catégorie (PROMO, NOUVEAUTÉ, etc.)
- ❌ Fermeture par swipe-down ou bouton X
- 🎬 Support images, vidéos, et gradients
- 🔗 Boutons CTA cliquables

**Intégration:**
- ✅ Logo avec cercle coloré dans `OperatorsPage` (liste)
- ✅ Logo avec cercle coloré dans `OperatorDetailPage` (détails)
- ✅ Cercle rouge/ambre/vert si stories non vues
- ✅ Cercle gris si toutes les stories vues
- ✅ Badge avec compteur de stories
- ✅ Effet hover scale sur logos cliquables

#### Backend Requirements:

**1. Endpoints nécessaires:**

```http
# Récupérer toutes les stories actives d'un opérateur
GET /operators/{operator_id}/stories
Response: OperatorStory[]
Note: Retourner seulement les stories où expires_at > now()

# Marquer une story comme vue (requiert authentification)
POST /operators/{operator_id}/stories/{story_id}/view
Headers: Authorization: Bearer {token}
Response: 200 OK

# Récupérer les opérateurs (avec compteurs de stories)
GET /operators
Response: Operator[] (incluant has_unread_stories et stories_count par user)
```

**2. Logique backend nécessaire:**

- **Table `operator_stories`:**
  ```sql
  CREATE TABLE operator_stories (
    id VARCHAR PRIMARY KEY,
    operator_id VARCHAR REFERENCES operators(id),
    type VARCHAR,
    media_type VARCHAR,
    media_url VARCHAR,
    gradient VARCHAR,
    title VARCHAR,
    subtitle VARCHAR,
    description TEXT,
    emoji VARCHAR,
    cta_text VARCHAR,
    cta_link VARCHAR,
    duration_seconds INT DEFAULT 5,
    created_at TIMESTAMP,
    expires_at TIMESTAMP,
    INDEX idx_operator_expires (operator_id, expires_at)
  );
  ```

- **Table `story_views` (tracking des vues par utilisateur):**
  ```sql
  CREATE TABLE story_views (
    user_id VARCHAR,
    story_id VARCHAR REFERENCES operator_stories(id),
    viewed_at TIMESTAMP,
    PRIMARY KEY (user_id, story_id),
    INDEX idx_user_story (user_id, story_id)
  );
  ```

- **Calcul de `has_unread_stories` et `stories_count`:**
  ```sql
  -- Pour chaque opérateur, calculer s'il a des stories non vues
  -- par l'utilisateur connecté
  SELECT 
    o.*,
    COUNT(DISTINCT os.id) as stories_count,
    CASE 
      WHEN COUNT(DISTINCT os.id) > COUNT(DISTINCT sv.story_id) 
      THEN true 
      ELSE false 
    END as has_unread_stories
  FROM operators o
  LEFT JOIN operator_stories os 
    ON os.operator_id = o.id 
    AND os.expires_at > NOW()
  LEFT JOIN story_views sv 
    ON sv.story_id = os.id 
    AND sv.user_id = {current_user_id}
  GROUP BY o.id;
  ```

**3. Fonctionnalités admin (à créer):**

- Dashboard pour créer des stories par compagnie
- Upload d'images/vidéos pour les stories
- Définir la durée d'expiration
- Prévisualisation avant publication
- Statistiques de vues par story

**Fichiers implémentés:**
- `/components/OperatorStoriesViewer.tsx` - Visualiseur de stories
- `/pages/OperatorsPage.tsx` - Liste avec stories
- `/pages/OperatorDetailPage.tsx` - Détails avec stories
- `/lib/hooks.ts` - Hook `useOperatorStories()`
- `/lib/api.ts` - Fonctions `getOperatorStories()` et `markStoryAsViewed()`
- `/data/models.ts` - Types et données mock

---

## 🔄 Résumé des données Backend vs Mock

| Élément | Hook | Endpoint Backend | Status |
|---------|------|------------------|--------|
| Moyens de paiement | `usePaymentMethods()` | `GET /api/payment-methods` | ✅ Ready (mock actif) |
| Logos compagnies | `useOperators()` | `GET /api/operators` | ✅ Ready (ajout logo_url) |
| Images véhicules | `useOperators()` | `GET /api/operators` | ✅ Ready (ajout vehicle_image_url) |
| Villes/Stations | `useStations()` | `GET /api/stations` | ✅ Ready (déjà fait) |
| Stories générales | `useStories()` | `GET /api/stories/active` | ✅ Ready (déjà fait) |
| Stories compagnies | `useOperatorStories()` | `GET /operators/{id}/stories` | ✅ Ready (mock actif) |
| Marquer story vue | `markStoryAsViewed()` | `POST /operators/{id}/stories/{story_id}/view` | ✅ Ready (mock actif) |
| Catégories stories | `useStoryCategories()` | `GET /api/story-categories` | ✅ Ready (mock actif) |
| Créer catégorie | `useCreateStoryCategory()` | `POST /api/story-categories` | ✅ Ready (mock actif) |
| Publier story | `usePublishStory()` | `POST /api/stories` | ✅ Ready (mock actif) |
| QR Code billet | Dans `TicketDetailPage` | Via `ticket.qr_code_url` | 🔜 À vérifier |
| Génération PDF | Dans `TicketDetailPage` | Via `ticket.pdf_url` | 🔜 À vérifier |

---

## 🎯 Prochaines étapes

### À faire pour finaliser l'intégration backend:

1. **Afficher l'image du véhicule dans OperatorsPage**
   - Ajouter une section qui affiche `operator.vehicle_image_url`
   - Positionner au-dessus de la zone rouge/doré/vert

2. **Vérifier TicketCard et génération QR Code**
   - S'assurer que `ticket.qr_code_url` existe dans l'API
   - Afficher le QR code dynamique dans TicketDetailPage

3. **Implémenter le backend des stories des compagnies**
   - Créer les tables `operator_stories` et `story_views`
   - Implémenter les endpoints GET et POST
   - Ajouter la logique de calcul des stories non vues
   - Créer le dashboard admin pour gérer les stories

4. **Tester toutes les pages avec données backend**
   - Une fois le backend prêt, remplacer `isDevelopment = true` par `false` dans `/lib/api.ts`
   - Configurer `VITE_API_URL` dans les variables d'environnement

---

## 📝 Notes importantes

- **Mode DEV:** Actuellement, tous les hooks utilisent des données mockées (fallback)
- **Mode PROD:** Il suffit de mettre `isDevelopment = false` dans `/lib/api.ts` pour basculer
- **Tous les composants sont prêts** à recevoir les vraies données du backend
- **Les types TypeScript sont définis** pour chaque endpoint

---

---

## 🔍 Checklist Backend - Stories des compagnies

Pour que le système de stories fonctionne en production, le backend doit implémenter:

### Base de données:
- [ ] Table `operator_stories` avec tous les champs
- [ ] Table `story_views` pour le tracking utilisateur
- [ ] Index sur `(operator_id, expires_at)` pour performance
- [ ] Index sur `(user_id, story_id)` pour performance

### Endpoints API:
- [ ] `GET /operators/{operator_id}/stories` - Liste des stories actives
- [ ] `POST /operators/{operator_id}/stories/{story_id}/view` - Marquer comme vue
- [ ] `GET /operators` - Inclure `has_unread_stories` et `stories_count`

### Logique métier:
- [ ] Filtrer automatiquement les stories expirées
- [ ] Calculer `has_unread_stories` par utilisateur
- [ ] Calculer `stories_count` par opérateur
- [ ] Empêcher le double comptage des vues
- [ ] Gérer l'authentification pour le tracking des vues

### Admin (optionnel mais recommandé):
- [ ] Interface pour créer des stories par compagnie
- [ ] Upload d'images/vidéos avec stockage cloud
- [ ] Prévisualisation des stories avant publication
- [ ] Statistiques de vues et engagement
- [ ] Gestion de l'expiration automatique

### Tests:
- [ ] Tester la pagination si beaucoup de stories
- [ ] Tester les performances avec 1000+ utilisateurs
- [ ] Tester le nettoyage automatique des stories expirées
- [ ] Tester le tracking des vues simultanées

---

**Dernière mise à jour:** 4 novembre 2025
