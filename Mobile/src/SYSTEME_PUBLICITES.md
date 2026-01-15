# 💰 Système de Publicités - TransportBF

## 🎯 Vue d'ensemble

Le **système de publicités interstitielles** permet aux administrateurs de créer et diffuser des annonces ciblées dans l'application pour **générer des revenus** et **promouvoir des offres**.

### Caractéristiques principales

✅ **Ciblage intelligent** - Par page, utilisateur, temps  
✅ **Formats multiples** - Image, vidéo, gradient + emoji  
✅ **Actions flexibles** - Navigation interne ou lien externe  
✅ **Tracking complet** - Impressions, clics, conversions  
✅ **Fréquence limitée** - Évite le spam (5 min minimum entre 2 pubs)  
✅ **Priorisation** - System de priorité 1-10  
✅ **Dashboard admin** - Création et gestion des annonces  

---

## 🏗️ Architecture

### Composant principal : `AdModal`

**Localisation** : `/components/AdModal.tsx`

**Principe de fonctionnement** :

```
1. Page charge
   ↓
2. Vérifier fréquence (pas de pub < 5 min)
   ↓
3. GET /api/ads/active?page=home&user_id=123&is_new=true
   ↓
4. Backend filtre annonces ciblées
   ↓
5. Sélection par priorité + aléatoire pondéré
   ↓
6. Délai 2 secondes
   ↓
7. Affichage modal
   ↓
8. POST /api/ads/:id/impression (tracking)
   ↓
9. User clique "Passer" ou CTA
   ↓
10. Si CTA : POST /api/ads/:id/click
    ↓
11. Navigation interne OU ouverture URL externe
```

---

## 📊 Modèle de données

### Interface `Advertisement`

```typescript
interface Advertisement {
  id: string;
  title: string;
  description: string;
  
  // Media
  media_type: 'image' | 'video' | 'gradient';
  media_url?: string;         // URL de l'image/vidéo
  gradient?: string;          // CSS gradient
  emoji?: string;             // Emoji décoratif
  
  // Actions
  cta_text?: string;          // "Voir l'offre", "Réserver", etc.
  action_type: 'internal' | 'external' | 'none';
  action_url?: string;        // URL externe
  internal_page?: string;     // Page de l'app
  internal_data?: any;        // Données à passer
  
  // Ciblage
  target_pages?: string[];    // ['home', 'tickets']
  target_new_users?: boolean; // Nouveaux utilisateurs seulement
  priority: number;           // 1-10 (10 = max)
  
  // Programmation
  start_date: string;         // ISO date
  end_date: string;           // ISO date
  max_impressions?: number;   // Limite d'affichages
  max_clicks?: number;        // Limite de clics
  
  // Statistiques
  impressions_count: number;
  clicks_count: number;
  ctr?: number;               // Click-through rate (%)
  
  // Admin
  created_by: string;
  is_active: boolean;
}
```

---

## 🎨 Formats de publicité

### 1. Image + Texte

```typescript
{
  id: 'ad-image-1',
  title: 'Promotion Ouaga-Bobo -30%',
  description: 'Profitez de réductions exceptionnelles sur vos trajets !',
  media_type: 'image',
  media_url: 'https://example.com/promo-bus.jpg',
  cta_text: 'Réserver maintenant',
  action_type: 'internal',
  internal_page: 'search-results',
  internal_data: { from: 'ouaga-1', to: 'bobo-1' }
}
```

**Aperçu** :
```
┌──────────────────────────┐
│ [Photo du bus]           │
│                          │
│ Publicité                │
├──────────────────────────┤
│ Promotion Ouaga-Bobo     │
│ -30%                     │
│                          │
│ Profitez de réductions   │
│ exceptionnelles...       │
│                          │
│ [Passer] [Réserver]      │
└──────────────────────────┘
```

### 2. Gradient + Emoji

```typescript
{
  id: 'ad-gradient-1',
  title: '🎉 Nouvelle destination',
  description: 'Découvrez nos trajets vers Koudougou !',
  media_type: 'gradient',
  gradient: 'linear-gradient(135deg, #EF2B2D 0%, #FCD116 50%, #009E49 100%)',
  emoji: '🚌',
  cta_text: 'Découvrir',
  action_type: 'internal',
  internal_page: 'operators'
}
```

**Aperçu** :
```
┌──────────────────────────┐
│                          │
│         🚌               │
│   [Gradient BF]          │
│                          │
│ Publicité                │
├──────────────────────────┤
│ 🎉 Nouvelle destination  │
│                          │
│ Découvrez nos trajets... │
│                          │
│ [Passer] [Découvrir]     │
└──────────────────────────┘
```

### 3. Lien externe

```typescript
{
  id: 'ad-external-1',
  title: 'Assurance voyage',
  description: 'Protégez vos trajets avec notre partenaire AssurBF',
  media_type: 'gradient',
  gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  emoji: '🛡️',
  cta_text: 'En savoir plus',
  action_type: 'external',
  action_url: 'https://assurbf.com/transport'
}
```

---

## 🎯 Ciblage des annonces

### 1. Par page

Afficher certaines pubs seulement sur certaines pages :

```typescript
{
  target_pages: ['home', 'search-results'],
  // Cette pub ne s'affichera que sur HomePage et SearchResultsPage
}
```

### 2. Par profil utilisateur

```typescript
{
  target_new_users: true,
  // Uniquement pour utilisateurs inscrits < 7 jours
}
```

### 3. Par période

```typescript
{
  start_date: '2025-12-01',
  end_date: '2025-12-31',
  // Campagne de Noël
}
```

### 4. Par priorité

```typescript
{
  priority: 10,
  // Pub la plus importante (affichée en premier)
}
```

### 5. Limites d'affichage

```typescript
{
  max_impressions: 10000,  // Max 10k vues
  max_clicks: 500,         // Max 500 clics
}
```

---

## 📱 Intégration dans les pages

### Dans App.tsx

```typescript
import { AdModal } from './components/AdModal';

export default function App() {
  const [appState, setAppState] = useState<AppState>({
    currentPage: 'home',
    user: null
  });

  // Déterminer si utilisateur est nouveau
  const isNewUser = appState.user 
    ? isUserNew(appState.user.created_at) 
    : false;

  return (
    <div>
      {renderPage()}
      
      {/* Navigation */}
      {!hideNavigation && <Navigation />}
      
      {/* Système de publicités */}
      {appState.user && (
        <AdModal
          currentPage={appState.currentPage}
          onNavigate={navigateTo}
          userId={appState.user.id}
          isNewUser={isNewUser}
        />
      )}
      
      <Toaster />
    </div>
  );
}

function isUserNew(createdAt: string): boolean {
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  return (now - created) < sevenDays;
}
```

### Configuration par page

Vous pouvez contrôler sur quelles pages afficher les pubs :

```typescript
// Dans App.tsx
const pagesWithAds: Page[] = [
  'home',
  'search-results',
  'tickets',
  'operators'
];

const shouldShowAds = pagesWithAds.includes(appState.currentPage);

{shouldShowAds && appState.user && (
  <AdModal
    currentPage={appState.currentPage}
    onNavigate={navigateTo}
    userId={appState.user.id}
    isNewUser={isNewUser}
  />
)}
```

---

## 🔧 Configuration de la fréquence

Dans `/components/AdModal.tsx` :

```typescript
// Fréquence actuelle : 5 minutes
const adFrequency = 5 * 60 * 1000;

// Pour changer :
const adFrequency = 10 * 60 * 1000;  // 10 minutes
const adFrequency = 3 * 60 * 1000;   // 3 minutes
const adFrequency = 15 * 60 * 1000;  // 15 minutes
```

**Recommandations** :
- **3-5 min** : Haute monétisation (risque d'agacement)
- **5-10 min** : Équilibré (recommandé)
- **10-15 min** : Discret (faible monétisation)

---

## 🎬 Actions possibles

### 1. Navigation interne

Rediriger vers une page de l'app avec données :

```typescript
{
  action_type: 'internal',
  internal_page: 'search-results',
  internal_data: {
    from: 'ouaga-1',
    to: 'bobo-1',
    type: 'ALLER_SIMPLE',
    date: '2025-12-25'
  }
}
```

Pages disponibles :
- `home`
- `search-results`
- `operators`
- `operator-detail`
- `tickets`
- `nearby`
- `profile`
- `support`

### 2. Lien externe

Ouvrir un site web dans un nouvel onglet :

```typescript
{
  action_type: 'external',
  action_url: 'https://partenaire.com/promo'
}
```

### 3. Sans action

Juste informatif (user peut seulement fermer) :

```typescript
{
  action_type: 'none'
}
```

---

## 📊 Tracking et Analytics

### Événements trackés

1. **Impression** - Pub affichée
```typescript
POST /api/ads/:id/impression
{
  user_id: "user-123",
  page: "home",
  timestamp: "2025-11-04T10:30:00Z"
}
```

2. **Clic** - User clique sur CTA
```typescript
POST /api/ads/:id/click
{
  user_id: "user-123",
  page: "home",
  action_type: "internal",
  timestamp: "2025-11-04T10:30:15Z"
}
```

3. **Conversion** (optionnel) - Action réussie
```typescript
POST /api/ads/:id/conversion
{
  user_id: "user-123",
  conversion_type: "booking",
  revenue: 5000,
  timestamp: "2025-11-04T10:35:00Z"
}
```

### Métriques calculées

```sql
-- Click-through rate (CTR)
SELECT 
  id,
  title,
  impressions_count,
  clicks_count,
  ROUND((clicks_count::float / impressions_count) * 100, 2) as ctr_percent
FROM advertisements
WHERE impressions_count > 0
ORDER BY ctr_percent DESC;

-- Revenue par pub (si monétisé au clic)
SELECT 
  id,
  title,
  clicks_count * cost_per_click as total_revenue
FROM advertisements
ORDER BY total_revenue DESC;
```

---

## 🔐 API Backend

### Endpoints Admin

#### 1. Créer une annonce

```typescript
POST /api/admin/ads
Authorization: Bearer <admin_token>

{
  "title": "Promotion -30%",
  "description": "Profitez de réductions...",
  "media_type": "image",
  "media_url": "https://...",
  "cta_text": "Réserver",
  "action_type": "internal",
  "internal_page": "search-results",
  "target_pages": ["home"],
  "priority": 8,
  "start_date": "2025-12-01",
  "end_date": "2025-12-31"
}
```

#### 2. Lister toutes les annonces

```typescript
GET /api/admin/ads
Authorization: Bearer <admin_token>

Response:
[
  {
    id: "ad-1",
    title: "...",
    impressions_count: 1250,
    clicks_count: 89,
    ctr: 7.12,
    is_active: true
  }
]
```

#### 3. Mettre à jour une annonce

```typescript
PUT /api/admin/ads/:id
Authorization: Bearer <admin_token>

{
  "priority": 10,
  "is_active": false
}
```

#### 4. Supprimer une annonce

```typescript
DELETE /api/admin/ads/:id
Authorization: Bearer <admin_token>
```

### Endpoints Publics

#### 1. Récupérer annonces actives

```typescript
GET /api/ads/active?page=home&user_id=123&is_new=true

Response:
[
  {
    id: "ad-1",
    title: "...",
    // ... tous les champs sauf created_by
  }
]
```

**Logique côté backend** :

```javascript
app.get('/api/ads/active', async (req, res) => {
  const { page, user_id, is_new } = req.query;
  const now = new Date();
  
  // Récupérer annonces actives et valides
  let ads = await db.advertisements.findAll({
    where: {
      is_active: true,
      start_date: { $lte: now },
      end_date: { $gte: now },
      $or: [
        { max_impressions: null },
        { impressions_count: { $lt: db.col('max_impressions') } }
      ],
      $or: [
        { max_clicks: null },
        { clicks_count: { $lt: db.col('max_clicks') } }
      ]
    }
  });
  
  // Filtrer par page cible
  if (page) {
    ads = ads.filter(ad => 
      !ad.target_pages || 
      ad.target_pages.includes(page)
    );
  }
  
  // Filtrer par nouveaux utilisateurs
  if (is_new === 'true') {
    ads = ads.filter(ad => !ad.target_new_users || ad.target_new_users);
  } else {
    ads = ads.filter(ad => !ad.target_new_users);
  }
  
  res.json(ads);
});
```

#### 2. Tracker impression

```typescript
POST /api/ads/:id/impression

{
  "user_id": "user-123",
  "page": "home"
}
```

**Backend** :

```javascript
app.post('/api/ads/:id/impression', async (req, res) => {
  const { id } = req.params;
  const { user_id, page } = req.body;
  
  // Incrémenter compteur
  await db.advertisements.increment('impressions_count', { 
    where: { id } 
  });
  
  // Logger pour analytics
  await db.ad_impressions.create({
    ad_id: id,
    user_id,
    page,
    timestamp: new Date()
  });
  
  res.json({ success: true });
});
```

#### 3. Tracker clic

```typescript
POST /api/ads/:id/click

{
  "user_id": "user-123",
  "page": "home",
  "action_type": "internal"
}
```

**Backend** :

```javascript
app.post('/api/ads/:id/click', async (req, res) => {
  const { id } = req.params;
  const { user_id, page, action_type } = req.body;
  
  // Incrémenter compteur
  await db.advertisements.increment('clicks_count', { 
    where: { id } 
  });
  
  // Logger
  await db.ad_clicks.create({
    ad_id: id,
    user_id,
    page,
    action_type,
    timestamp: new Date()
  });
  
  res.json({ success: true });
});
```

---

## 🗄️ Schéma SQL

```sql
-- Table principale des annonces
CREATE TABLE advertisements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Contenu
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  
  -- Media
  media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('image', 'video', 'gradient')),
  media_url TEXT,
  gradient TEXT,
  emoji VARCHAR(10),
  
  -- Actions
  cta_text VARCHAR(100),
  action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('internal', 'external', 'none')),
  action_url TEXT,
  internal_page VARCHAR(50),
  internal_data JSONB,
  
  -- Ciblage
  target_pages TEXT[],
  target_new_users BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  
  -- Programmation
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  max_impressions INTEGER,
  max_clicks INTEGER,
  
  -- Statistiques
  impressions_count INTEGER DEFAULT 0,
  clicks_count INTEGER DEFAULT 0,
  
  -- Admin
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  
  -- Indexes
  CONSTRAINT valid_dates CHECK (end_date > start_date)
);

CREATE INDEX idx_ads_active ON advertisements(is_active, start_date, end_date);
CREATE INDEX idx_ads_priority ON advertisements(priority DESC);
CREATE INDEX idx_ads_target_pages ON advertisements USING GIN(target_pages);

-- Table des impressions (analytics)
CREATE TABLE ad_impressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES advertisements(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  page VARCHAR(50),
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_impressions_ad ON ad_impressions(ad_id, timestamp);
CREATE INDEX idx_impressions_user ON ad_impressions(user_id);

-- Table des clics (analytics)
CREATE TABLE ad_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES advertisements(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  page VARCHAR(50),
  action_type VARCHAR(20),
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_clicks_ad ON ad_clicks(ad_id, timestamp);
CREATE INDEX idx_clicks_user ON ad_clicks(user_id);

-- Vue pour analytics
CREATE VIEW ad_analytics AS
SELECT 
  a.id,
  a.title,
  a.priority,
  a.impressions_count,
  a.clicks_count,
  CASE 
    WHEN a.impressions_count > 0 
    THEN ROUND((a.clicks_count::float / a.impressions_count) * 100, 2)
    ELSE 0
  END as ctr_percent,
  a.is_active,
  a.start_date,
  a.end_date
FROM advertisements a
ORDER BY a.priority DESC, a.impressions_count DESC;
```

---

## 💰 Modèles de monétisation

### 1. Annonces sponsorisées (compagnies)

Les compagnies de transport paient pour promouvoir leurs offres :

```typescript
{
  title: "Air Canada - Promotion -30%",
  description: "Trajets Ouaga-Bobo à prix réduit tout le mois !",
  action_type: 'internal',
  internal_page: 'operator-detail',
  internal_data: { operatorId: 'air-canada' }
}
```

**Tarification** :
- CPM (coût pour 1000 impressions) : 500-2000 FCFA
- CPC (coût par clic) : 50-200 FCFA
- Forfait mensuel : 50 000 - 200 000 FCFA

### 2. Annonces de partenaires

Entreprises tierces (assurances, hôtels, etc.) :

```typescript
{
  title: "Hôtel BF - 20% de réduction",
  description: "Réservez votre hébergement à Bobo avec code TRANSPORT20",
  action_type: 'external',
  action_url: 'https://hotelbf.com?promo=TRANSPORT20'
}
```

**Tarification** :
- CPC : 100-500 FCFA
- CPA (coût par acquisition) : 5-10% de la vente

### 3. Annonces internes (propres offres)

TransportBF promeut ses propres features :

```typescript
{
  title: "Parrainage : 5000 FCFA offerts",
  description: "Invitez vos amis et gagnez des crédits !",
  action_type: 'internal',
  internal_page: 'profile'
}
```

**Gratuit** - Pour engagement utilisateurs

---

## 📈 Dashboard Admin

### Interface de gestion

Créer un dashboard admin pour gérer les pubs :

**Pages** :
1. **Liste des annonces** - Toutes les pubs avec stats
2. **Créer annonce** - Formulaire de création
3. **Modifier annonce** - Édition
4. **Analytics** - Graphiques et KPIs

**Fonctionnalités** :
- ✅ Créer/éditer/supprimer annonces
- ✅ Activer/désactiver
- ✅ Voir stats en temps réel
- ✅ Filtrer par période
- ✅ Export CSV des données

### Exemple de tableau

```
┌─────────────────────────────────────────────────────────────────┐
│ ID     │ Titre            │ Impressions │ Clics │ CTR   │ Statut │
├─────────────────────────────────────────────────────────────────┤
│ ad-1   │ Promo Ouaga-Bobo │ 2,450      │ 187   │ 7.6%  │ ✅ Actif│
│ ad-2   │ Nouveau tracking │ 1,230      │ 45    │ 3.7%  │ ✅ Actif│
│ ad-3   │ Parrainage       │ 890        │ 23    │ 2.6%  │ ⏸ Pause │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Bonnes pratiques

### ✅ À faire

1. **Limiter la fréquence** (5-10 min minimum)
2. **Ciblage pertinent** (bonne page, bon moment)
3. **CTA clair** ("Réserver", "Voir l'offre")
4. **Images de qualité** (optimisées, 800x600px min)
5. **Tracking précis** (impressions + clics)
6. **A/B testing** (tester différentes versions)

### ❌ À éviter

1. **Trop de pubs** (spam = désinstallation)
2. **Pubs non pertinentes** (agacement)
3. **Images lourdes** (ralentit l'app)
4. **Pas de bouton "Passer"** (frustration)
5. **Texte trop long** (TL;DR)
6. **Ciblage trop large** (faible CTR)

---

## 🧪 Tests

### Test 1 : Affichage basique

```
1. Ouvrir l'app
2. Attendre 2 secondes
3. Vérifier qu'une pub apparaît
4. Cliquer "Passer"
5. Vérifier que la pub se ferme
```

### Test 2 : Fréquence

```
1. Voir une pub et la fermer
2. Changer de page immédiatement
3. Vérifier qu'aucune nouvelle pub n'apparaît
4. Attendre 5 minutes
5. Changer de page
6. Vérifier qu'une nouvelle pub peut apparaître
```

### Test 3 : Navigation interne

```
1. Voir une pub avec CTA interne
2. Cliquer sur le CTA
3. Vérifier la redirection vers la bonne page
4. Vérifier que les bonnes données sont passées
```

### Test 4 : Lien externe

```
1. Voir une pub avec lien externe
2. Cliquer sur le CTA
3. Vérifier ouverture dans nouvel onglet
4. Vérifier que l'app reste ouverte
```

---

## 📊 Exemple de campagne

### Campagne "Fêtes de fin d'année"

```typescript
{
  id: 'camp-noel-2025',
  title: '🎄 Offre spéciale Noël',
  description: 'Voyagez en famille avec -40% sur tous les trajets du 20 au 31 décembre !',
  media_type: 'gradient',
  gradient: 'linear-gradient(135deg, #c94b4b 0%, #4b134f 100%)',
  emoji: '🎅',
  cta_text: 'Profiter de l\'offre',
  action_type: 'internal',
  internal_page: 'search-results',
  internal_data: {
    type: 'ALLER_SIMPLE'
  },
  target_pages: ['home', 'tickets'],
  target_new_users: false,
  priority: 10,
  start_date: '2025-12-01',
  end_date: '2025-12-31',
  max_impressions: 50000,
  max_clicks: 2000
}
```

**Objectifs** :
- 50 000 impressions
- 2 000 clics (CTR 4%)
- 500 réservations (conversion 25%)

---

## 🚀 Évolutions futures

### 1. Vidéos

Support de vidéos courtes (15-30s) :

```typescript
{
  media_type: 'video',
  media_url: 'https://cdn.transportbf.com/videos/promo.mp4'
}
```

### 2. Carrousel

Plusieurs images/messages dans une pub :

```typescript
{
  media_type: 'carousel',
  slides: [
    { image: 'slide1.jpg', text: 'Message 1' },
    { image: 'slide2.jpg', text: 'Message 2' }
  ]
}
```

### 3. Pubs natives

Intégrées dans le flux (pas de modal) :

```tsx
<TripCard trip={trip} />
<AdCard ad={ad} /> {/* Ressemble à un TripCard */}
<TripCard trip={trip} />
```

### 4. Géolocalisation

Ciblage par position :

```typescript
{
  target_locations: ['Ouagadougou', 'Bobo-Dioulasso']
}
```

### 5. Machine Learning

Optimisation automatique du ciblage basée sur l'historique.

---

**Dernière mise à jour** : 4 novembre 2025  
**Version** : 1.0.0  
**Auteur** : TransportBF Team
