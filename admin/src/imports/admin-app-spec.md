

  

Searched for files matching `**/ADMIN*`, 2 matches

Searched for regex `admin.*application|application.*admin` (`**/*.md`), 6 results

Read [](file:///c%3A/FasoTravel/ADMIN_APPLICATION_SPECIFICATION.md#1-1), lines 1 to 80

Searched for regex `admin.*ads|ads.*admin` (`**/Mobile/src/lib/config.ts`), 6 results

Searched for regex `publicité|ads|annonce` (`**/ADMIN_APPLICATION_SPECIFICATION.md`), 3 results

Read [](file:///c%3A/FasoTravel/ADMIN_APPLICATION_SPECIFICATION.md#95-95), lines 95 to 120

Read [](file:///c%3A/FasoTravel/ADMIN_APPLICATION_SPECIFICATION.md#225-225), lines 225 to 260

D'accord, je comprends. L'application Admin est un **projet séparé** qui n'existe pas encore dans ton workspace. Voici ce dont tu as besoin :

---

## Backend Ready : OUI

Le frontend Mobile a déjà tout préparé côté API. Les endpoints admin pour les pubs sont définis dans config.ts :

| Endpoint | Méthode | Usage |
|---|---|---|
| `/api/admin/ads` | GET | Lister toutes les pubs |
| `/api/admin/ads` | POST | Créer une pub |
| `/api/admin/ads/:id` | PUT | Modifier une pub |
| `/api/admin/ads/:id` | DELETE | Supprimer une pub |
| `/api/admin/ads/analytics/overview` | GET | Stats globales |
| `/api/admin/ads/:id/analytics` | GET | Stats d'une pub |

Et côté utilisateur Mobile (déjà implémenté) :

| Endpoint | Méthode | Usage |
|---|---|---|
| `/api/ads/active` | GET | Récupère pubs actives (filtré par page) |
| `/api/ads/:id/impression` | POST | Track une vue |
| `/api/ads/:id/click` | POST | Track un clic |

---

## Instructions pour l'App Admin — Page AdsPage.tsx

Quand tu crées l'app Admin, voici ce que la page de gestion des pubs doit contenir :

### 1. Liste des publicités (tableau)
- Colonnes : Titre, Type média, Pages ciblées, Priorité, Impressions, Clics, CTR%, Statut (actif/inactif), Date fin
- Boutons : Créer, Modifier, Supprimer, Voir analytics

### 2. Formulaire création/édition
Le formulaire doit correspondre **exactement** à l'interface `Advertisement` du Mobile :

```typescript
// Les champs du formulaire admin :
{
  title: string;              // Ex: "🎉 Promotion Ouaga-Bobo"
  description: string;        // Texte de la pub
  
  media_type: 'image' | 'video' | 'gradient';
  media_url?: string;         // URL si image/vidéo
  gradient?: string;          // Ex: "linear-gradient(135deg, #EF2B2D 0%, #FCD116 50%, #009E49 100%)"
  emoji?: string;             // Emoji affiché sur le gradient
  
  cta_text: string;           // Texte du bouton ("Voir les offres")
  action_type: 'internal' | 'external' | 'none';
  action_url?: string;        // Si external
  internal_page?: string;     // Si internal: 'home'|'search-results'|'tickets'|'operators'|'nearby'|'profile'
  internal_data?: object;     // Données à passer à la page
  
  target_pages: string[];     // Multi-select parmi: home, search-results, tickets, operators, nearby
  target_new_users: boolean;  // Toggle
  priority: number;           // Slider 1-10
  
  start_date: string;         // Date picker
  end_date: string;           // Date picker
  max_impressions?: number;   // Optionnel
  max_clicks?: number;        // Optionnel
  
  is_active: boolean;         // Toggle
}
```

### 3. Dashboard Analytics
- Impressions totales, clics totaux, CTR moyen
- Graphique impressions/clics par jour
- Top 5 pubs par performance
- Revenu estimé (si modèle publicitaire)

### 4. Backend à implémenter

```
Table: advertisements
├── id (UUID, PK)
├── title (VARCHAR)
├── description (TEXT)
├── media_type (ENUM: image, video, gradient)
├── media_url (VARCHAR, nullable)
├── gradient (VARCHAR, nullable)
├── emoji (VARCHAR, nullable)
├── cta_text (VARCHAR)
├── action_type (ENUM: internal, external, none)
├── action_url (VARCHAR, nullable)
├── internal_page (VARCHAR, nullable)
├── internal_data (JSONB, nullable)
├── target_pages (JSONB - array de strings)
├── target_new_users (BOOLEAN, default false)
├── priority (INTEGER, 1-10)
├── start_date (TIMESTAMP)
├── end_date (TIMESTAMP)
├── max_impressions (INTEGER, nullable)
├── max_clicks (INTEGER, nullable)
├── impressions_count (INTEGER, default 0)
├── clicks_count (INTEGER, default 0)
├── is_active (BOOLEAN, default true)
├── created_by (UUID, FK → users)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

Table: ad_impressions (tracking détaillé)
├── id (UUID, PK)
├── ad_id (UUID, FK → advertisements)
├── user_id (VARCHAR, nullable)
├── page (VARCHAR)
├── device_type (VARCHAR)
└── created_at (TIMESTAMP)

Table: ad_clicks (tracking détaillé)
├── id (UUID, PK)
├── ad_id (UUID, FK → advertisements)
├── user_id (VARCHAR, nullable)
├── page (VARCHAR)
├── action_type (VARCHAR)
├── device_type (VARCHAR)
└── created_at (TIMESTAMP)
```

Quand tu seras prêt à créer l'app Admin, dis-le et je la mettrai en place avec la page `AdsPage.tsx` intégrée.