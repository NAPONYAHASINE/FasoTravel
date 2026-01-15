# 🚀 Option A : Documentation Complète - TransportBF

## 📋 Table des Matières
1. Vue d'ensemble
2. Architecture globale
3. Contrats backend
4. Points d'intégration critiques
5. Sécurité
6. Priorisation
7. Tests requis
8. Checklist de déploiement

---

## 1️⃣ Vue d'ensemble

### Objectif
TransportBF est une plateforme de réservation de transport interurbain conçue pour le Burkina Faso. L'application combine :
- Réservation de billets avec sélection de sièges
- Paiement mobile et carte bancaire
- Stories style Instagram pour les compagnies
- Système de publicités
- Aide contextuelle
- Gestion multilingue (FR/EN/Mooré)

### Stack technique
- **Frontend**: React 18 + TypeScript + Tailwind
- **UI**: shadcn/ui + Framer Motion
- **Backend**: API REST + PostgreSQL
- **Paiement**: Orange Money + Moov Money + Cartes
- **Déploiement**: Vercel/Netlify (front) + VPS/Heroku (back)

---

## 2️⃣ Architecture globale

### Structure du frontend
```
/src
  /components       # Composants réutilisables
    /ui            # Primitives UI (shadcn)
    AdModal.tsx    # Système de pubs
    Navigation.tsx # Barre navigation
    ...
  /pages           # Pages principales
    HomePage.tsx
    SearchResultsPage.tsx
    ...
  /lib             # Utilitaires
    api.ts        # Client API
    config.ts     # Configuration
    hooks.ts      # Custom hooks
    ...
  /data            # Modèles + mock data
    models.ts
```

### Points d'architecture clés

1. **Configuration centralisée**
   - `/lib/config.ts` -> Toutes les constantes et URLs
   - Variables d'environnement via `.env`
   - Détection auto dev/prod

2. **Gestion d'état**
   - Hooks React pour state local
   - Custom hooks pour data fetching
   - Props drilling minimal
   - Caching des données

3. **Sécurité**
   - Headers CORS configurés
   - Validation des données
   - Rate limiting
   - SSL/HTTPS requis
   - Sanitization des inputs

4. **Performance**
   - Code splitting par route
   - Lazy loading des images
   - Debouncing des recherches
   - Optimisation des renders
   - Memoization des composants lourds

---

## 3️⃣ Contrats backend

### Endpoints critiques

#### 1. Authentification
\`\`\`typescript
// POST /api/auth/login
interface LoginRequest {
  phone?: string;
  email?: string;
  password: string;
}

interface LoginResponse {
  user: {
    name: string;
    email: string;
    phone: string;
  };
  token: string;
}

// POST /api/auth/register
interface RegisterRequest {
  name: string;
  phone: string;
  email?: string;
  password: string;
}
\`\`\`

#### 2. Recherche de trajets
\`\`\`typescript
// GET /api/trips
interface TripSearchParams {
  from_stop_id?: string;
  to_stop_id?: string;
  date?: string;
  operator_id?: string;
  min_seats?: number;
}

interface Trip {
  trip_id: string;
  operator_id: string;
  operator_name: string;
  operator_logo?: string;
  vehicle_type: string;
  departure_time: string;
  arrival_time: string;
  duration_minutes: number;
  base_price: number;
  from_stop_id: string;
  to_stop_id: string;
  from_stop_name: string;
  to_stop_name: string;
  segments: Segment[];
  amenities: string[];
  has_live_tracking: boolean;
  available_seats: number;
  total_seats: number;
}
\`\`\`

#### 3. Réservations
\`\`\`typescript
// POST /api/bookings/hold
interface CreateHoldBookingParams {
  trip_id: string;
  seat_numbers: string[];
  passenger_name: string;
  passenger_email?: string;
  passenger_phone: string;
}

// POST /api/bookings/confirm
interface ConfirmBookingParams {
  ticket_id: string;
  payment_method: 'ORANGE_MONEY' | 'MOOV_MONEY' | 'CARD';
  payment_details: {
    phone_number?: string;
    card_token?: string;
  };
}
\`\`\`

#### 4. Stories des opérateurs
\`\`\`typescript
// GET /operators/{operator_id}/stories
interface OperatorStory {
  id: string;
  operator_id: string;
  type: 'PROMOTIONS' | 'ACTUALITE' | 'ALERTE' | 'NEW_ROUTE' | 'ANNOUNCEMENT' | 'EVENT' | 'ACHIEVEMENT';
  media_type: 'image' | 'video' | 'gradient';
  media_url?: string;
  gradient?: string;
  title: string;
  subtitle?: string;
  description?: string;
  emoji?: string;
  cta_text?: string;
  cta_link?: string;
  duration_seconds?: number;
  created_at: string;
  expires_at: string;
  is_viewed: boolean;
}
\`\`\`

#### 5. Publicités
\`\`\`typescript
// GET /api/ads/active
interface Advertisement {
  id: string;
  title: string;
  description: string;
  media_type: 'image' | 'video' | 'gradient';
  media_url?: string;
  gradient?: string;
  emoji?: string;
  cta_text?: string;
  action_type: 'none' | 'internal' | 'external';
  internal_page?: string;
  external_url?: string;
  target_pages: string[];
  priority: number;
  start_date: string;
  end_date: string;
}
\`\`\`

---

## 4️⃣ Points d'intégration critiques

### 1. Système de paiement
- **Flow critique #1**
  1. Créer hold (TTL 10min)
  2. Rediriger vers PSP
  3. Webhook de confirmation
  4. Conversion HOLD -> PAID
  5. Envoi du billet

- **Sécurité requise**
  - HTTPS obligatoire
  - Idempotency key
  - Validation signature webhook
  - Rate limiting
  - Logs détaillés

### 2. Tracking en temps réel
- Position GPS des véhicules
- WebSocket pour updates
- Fallback polling
- Géofencing

### 3. Stories & Publicités
- Upload médias sécurisé
- CDN pour assets
- Analytics temps réel
- Modération contenu

---

## 5️⃣ Sécurité

### Points critiques

1. **Authentification**
   - JWT avec refresh tokens
   - Session management
   - 2FA pour admin
   - Blocage après X échecs

2. **Paiements**
   - PCI DSS si cartes
   - Tokenization
   - Anti-fraud
   - Audit logs

3. **API**
   - Rate limiting
   - CORS strict
   - Validation inputs
   - Sanitization outputs

4. **Data**
   - Encryption at rest
   - SSL en transit
   - Backup réguliers
   - RGPD compliance

---

## 6️⃣ Priorisation

### Phase 1 : Core (Semaine 1-2)
1. Auth + User management
2. Recherche trajets
3. Réservation basique
4. Paiement Orange/Moov

### Phase 2 : Features (Semaine 3-4)
1. Sélection sièges
2. Stories opérateurs
3. Notifications
4. Géoloc basique

### Phase 3 : Monetization (Semaine 5-6)
1. Système pubs
2. Analytics
3. Admin dashboard
4. Paiement cartes

### Phase 4 : Polish (Semaine 7-8)
1. Optimisations
2. PWA offline
3. Tests E2E
4. Bug fixes

---

## 7️⃣ Tests requis

### 1. Tests unitaires
- Auth flows
- Validation forms
- State management
- Utils/helpers

### 2. Tests intégration
- API endpoints
- Payment flow
- Story system
- Search/filters

### 3. Tests E2E
- Booking flow
- Payment process
- Navigation
- Responsive

### 4. Tests performance
- Load testing
- Stress testing
- Memory leaks
- Network usage

---

## 8️⃣ Checklist de déploiement

### Backend
- [ ] DB migrations ready
- [ ] API docs (Swagger)
- [ ] Error handling
- [ ] Monitoring setup
- [ ] Backup strategy
- [ ] SSL certificates
- [ ] Rate limits
- [ ] CORS config
- [ ] Logging system
- [ ] Security headers

### Frontend
- [ ] ENV vars set
- [ ] Mock data off
- [ ] Analytics ready
- [ ] Error tracking
- [ ] Cache strategy
- [ ] CDN setup
- [ ] Build optimized
- [ ] PWA assets
- [ ] SEO ready
- [ ] A11y checked