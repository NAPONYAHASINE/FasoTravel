# 📱 API Backend - Stories des Compagnies

## Vue d'ensemble

Le système de stories des compagnies permet aux opérateurs de transport de publier du contenu temporaire (promos, annonces, nouveautés) visible par les utilisateurs dans un format Instagram-style.

---

## 🗄️ Schéma de base de données

### Table: `operator_stories`

```sql
CREATE TABLE operator_stories (
  id VARCHAR(255) PRIMARY KEY,
  operator_id VARCHAR(255) NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  
  -- Type et format
  type VARCHAR(50) NOT NULL, -- 'PROMO', 'NEW_ROUTE', 'ANNOUNCEMENT', 'EVENT', 'ACHIEVEMENT'
  media_type VARCHAR(20) NOT NULL, -- 'image', 'video', 'gradient'
  
  -- Contenu média
  media_url VARCHAR(500), -- URL vers l'image/vidéo stockée (S3, Cloudinary, etc.)
  gradient VARCHAR(100), -- Ex: 'from-red-600 via-amber-500 to-green-600' (Tailwind classes)
  
  -- Contenu texte
  title VARCHAR(100) NOT NULL,
  subtitle VARCHAR(150),
  description TEXT,
  emoji VARCHAR(10),
  
  -- Call-to-action
  cta_text VARCHAR(50), -- Ex: "Réserver maintenant"
  cta_link VARCHAR(500), -- URL ou deep link
  
  -- Paramètres
  duration_seconds INT DEFAULT 5, -- Durée d'affichage
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  
  -- Index pour performance
  INDEX idx_operator_expires (operator_id, expires_at),
  INDEX idx_expires (expires_at)
);
```

### Table: `story_views`

```sql
CREATE TABLE story_views (
  user_id VARCHAR(255) NOT NULL,
  story_id VARCHAR(255) NOT NULL REFERENCES operator_stories(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (user_id, story_id),
  INDEX idx_user (user_id),
  INDEX idx_story (story_id)
);
```

---

## 🔌 Endpoints API

### 1. Récupérer les stories d'un opérateur

**Endpoint:** `GET /operators/{operator_id}/stories`

**Description:** Retourne toutes les stories actives (non expirées) d'une compagnie, avec le statut de vue de l'utilisateur connecté.

**Headers:**
```http
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Query Parameters:**
- `user_id` (optionnel) - ID de l'utilisateur pour calculer `is_viewed`

**Response 200 OK:**
```json
[
  {
    "id": "AC_STORY_1",
    "operator_id": "AIR_CANADA",
    "type": "PROMO",
    "media_type": "gradient",
    "media_url": null,
    "gradient": "from-red-600 via-amber-500 to-green-600",
    "title": "-20% sur Ouaga-Bobo",
    "subtitle": "Valable jusqu'au 15 novembre",
    "description": "Réservez maintenant et profitez de notre promotion exceptionnelle sur tous les trajets Ouagadougou-Bobo-Dioulasso !",
    "emoji": "🎉",
    "cta_text": "Réserver maintenant",
    "cta_link": "transportbf://search?route=OUAGA-BOBO",
    "duration_seconds": 5,
    "created_at": "2025-11-04T10:00:00Z",
    "expires_at": "2025-11-15T23:59:59Z",
    "is_viewed": false
  },
  {
    "id": "AC_STORY_2",
    "operator_id": "AIR_CANADA",
    "type": "NEW_ROUTE",
    "media_type": "image",
    "media_url": "https://cdn.transportbf.com/stories/air-canada-dori-route.jpg",
    "gradient": null,
    "title": "Nouveau : Ouaga-Dori",
    "subtitle": "Départs tous les lundis et jeudis",
    "description": "Découvrez notre nouvelle ligne directe vers Dori avec des bus climatisés et WiFi gratuit.",
    "emoji": "🚌",
    "cta_text": "Voir les horaires",
    "cta_link": "transportbf://trips?route=OUAGA-DORI",
    "duration_seconds": 5,
    "created_at": "2025-11-03T15:00:00Z",
    "expires_at": "2025-11-20T23:59:59Z",
    "is_viewed": true
  }
]
```

**SQL Query (PostgreSQL):**
```sql
SELECT 
  os.*,
  CASE 
    WHEN sv.viewed_at IS NOT NULL THEN true 
    ELSE false 
  END as is_viewed
FROM operator_stories os
LEFT JOIN story_views sv 
  ON sv.story_id = os.id 
  AND sv.user_id = $1  -- user_id from auth token
WHERE os.operator_id = $2  -- operator_id from URL
  AND os.expires_at > NOW()
ORDER BY os.created_at DESC;
```

**Erreurs possibles:**
- `404 Not Found` - Opérateur introuvable
- `401 Unauthorized` - Token invalide ou manquant

---

### 2. Marquer une story comme vue

**Endpoint:** `POST /operators/{operator_id}/stories/{story_id}/view`

**Description:** Enregistre qu'un utilisateur a vu une story. Doit être appelé quand la story a été affichée pendant sa durée complète.

**Headers:**
```http
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body:** Aucun (optionnel: `{}`)

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Story marked as viewed"
}
```

**SQL Query (PostgreSQL avec ON CONFLICT):**
```sql
INSERT INTO story_views (user_id, story_id, viewed_at)
VALUES ($1, $2, NOW())
ON CONFLICT (user_id, story_id) 
DO NOTHING;  -- Évite les doublons si déjà vue
```

**Erreurs possibles:**
- `404 Not Found` - Story ou opérateur introuvable
- `401 Unauthorized` - Token invalide ou manquant
- `410 Gone` - Story expirée

---

### 3. Récupérer tous les opérateurs (avec compteurs de stories)

**Endpoint:** `GET /operators`

**Description:** Liste tous les opérateurs avec le nombre de stories actives et si l'utilisateur a des stories non vues.

**Headers:**
```http
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Query Parameters:**
- `user_id` (optionnel) - ID de l'utilisateur pour calculer `has_unread_stories`

**Response 200 OK:**
```json
[
  {
    "id": "AIR_CANADA",
    "name": "Air Canada Bus",
    "logo": "✈️",
    "logo_url": "https://cdn.transportbf.com/logos/air-canada.png",
    "rating": 4.8,
    "total_trips": 120,
    "description": "Leader du transport premium au Burkina Faso",
    "amenities": ["WiFi", "AC", "USB", "Toilet", "Snacks"],
    "phone": "+226 70 12 34 56",
    "email": "contact@aircanadabus.bf",
    "stories_count": 3,
    "has_unread_stories": true
  },
  {
    "id": "SCOOT",
    "name": "Scoot Express",
    "logo": "🚌",
    "logo_url": "https://cdn.transportbf.com/logos/scoot.png",
    "rating": 4.5,
    "total_trips": 95,
    "description": "Transport rapide et économique",
    "amenities": ["AC", "USB"],
    "phone": "+226 70 23 45 67",
    "email": "info@scootexpress.bf",
    "stories_count": 2,
    "has_unread_stories": false
  }
]
```

**SQL Query (PostgreSQL):**
```sql
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
  AND os.expires_at > NOW()  -- Seulement les stories actives
LEFT JOIN story_views sv 
  ON sv.story_id = os.id 
  AND sv.user_id = $1  -- user_id from auth token
WHERE o.is_active = true
GROUP BY o.id
ORDER BY o.name;
```

---

## 🔐 Authentification

Tous les endpoints nécessitent un token JWT valide dans le header `Authorization`.

**Format du token:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Payload JWT requis:**
```json
{
  "user_id": "USER_12345",
  "email": "user@example.com",
  "exp": 1699200000
}
```

---

## 📊 Exemples d'utilisation (Frontend)

### Récupérer et afficher les stories

```typescript
// Hook React personnalisé
function useOperatorStories(operatorId: string) {
  const [stories, setStories] = useState<OperatorStory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStories() {
      const response = await fetch(`/operators/${operatorId}/stories`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      const data = await response.json();
      setStories(data);
      setLoading(false);
    }
    
    fetchStories();
  }, [operatorId]);

  return { stories, loading };
}
```

### Marquer une story comme vue

```typescript
async function markStoryAsViewed(operatorId: string, storyId: string) {
  await fetch(`/operators/${operatorId}/stories/${storyId}/view`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
      'Content-Type': 'application/json'
    }
  });
}
```

---

## ⚡ Optimisations recommandées

### 1. Cache Redis pour les compteurs

Mettre en cache les compteurs de stories pour éviter les requêtes lourdes:

```redis
# Key: operator:{operator_id}:stories_count:{user_id}
SET operator:AIR_CANADA:stories_count:USER_123 "3" EX 300  # 5 min TTL
SET operator:AIR_CANADA:has_unread:USER_123 "true" EX 300
```

### 2. Nettoyage automatique des stories expirées

Créer un cron job qui s'exécute toutes les heures:

```sql
DELETE FROM operator_stories 
WHERE expires_at < NOW() - INTERVAL '7 days';  -- Garder 7 jours d'historique
```

### 3. Pré-génération des thumbnails

Pour les images/vidéos, générer des thumbnails optimisés:
- 720x1280 (9:16 ratio) pour l'affichage plein écran
- WebP pour compression optimale
- CDN avec cache agressif (1 mois)

### 4. Pagination

Si un opérateur a beaucoup de stories:

```http
GET /operators/{operator_id}/stories?limit=10&offset=0
```

---

## 🧪 Tests recommandés

### Test unitaires

```javascript
describe('GET /operators/:id/stories', () => {
  it('should return only non-expired stories', async () => {
    // Créer une story expirée et une active
    // Vérifier que seule l'active est retournée
  });

  it('should mark is_viewed correctly', async () => {
    // Marquer une story comme vue
    // Vérifier que is_viewed = true au prochain GET
  });

  it('should not return stories without auth', async () => {
    // Appeler sans token
    // Vérifier 401 Unauthorized
  });
});
```

### Tests de charge

- 1000 utilisateurs simultanés regardant des stories
- Vérifier que le temps de réponse < 200ms
- Vérifier que le CPU reste < 70%

---

## 🚨 Gestion des erreurs

### Story expirée pendant la lecture

Si un utilisateur commence à voir des stories et qu'une expire pendant:

```json
{
  "error": "STORY_EXPIRED",
  "message": "Cette story n'est plus disponible",
  "story_id": "AC_STORY_1"
}
```

Le frontend doit passer automatiquement à la story suivante.

### Opérateur sans stories

Retourner un tableau vide (pas d'erreur):

```json
[]
```

---

## 📈 Analytics recommandées

Tracker les métriques suivantes:

- **Vues par story** - Combien d'utilisateurs ont vu chaque story
- **Taux de complétion** - % d'utilisateurs qui voient la story complète
- **Clicks CTA** - Combien cliquent sur les boutons d'action
- **Temps moyen de vue** - Durée moyenne passée sur chaque story
- **Taux de skip** - % d'utilisateurs qui passent rapidement

```sql
-- Exemple: Top 10 des stories les plus vues
SELECT 
  os.title,
  o.name as operator_name,
  COUNT(sv.user_id) as views
FROM operator_stories os
JOIN operators o ON o.id = os.operator_id
LEFT JOIN story_views sv ON sv.story_id = os.id
WHERE os.created_at > NOW() - INTERVAL '30 days'
GROUP BY os.id, os.title, o.name
ORDER BY views DESC
LIMIT 10;
```

---

## 🎨 Dashboard Admin (recommandé)

Interface pour que les opérateurs gèrent leurs stories:

### Endpoints admin nécessaires:

```http
POST /admin/operators/{operator_id}/stories      # Créer une story
PUT /admin/operators/{operator_id}/stories/{id}  # Modifier
DELETE /admin/operators/{operator_id}/stories/{id} # Supprimer
GET /admin/operators/{operator_id}/stories/stats  # Statistiques
```

### Fonctionnalités:
- ✅ Upload d'images/vidéos avec prévisualisation
- ✅ Éditeur WYSIWYG pour le texte
- ✅ Sélecteur de gradient Tailwind
- ✅ Planification de publication
- ✅ Aperçu en temps réel (style Instagram)
- ✅ Graphiques de vues et engagement

---

**Dernière mise à jour:** 4 novembre 2025
**Version API:** 1.0
**Auteur:** TransportBF Team
