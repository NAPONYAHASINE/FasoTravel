# 🏗️ Architecture Code Complète - TransportBF

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture générale](#architecture-générale)
3. [Point d'entrée : App.tsx](#point-dentrée--apptsx)
4. [Data Layer](#data-layer)
5. [Pages & Routing](#pages--routing)
6. [Composants réutilisables](#composants-réutilisables)
7. [Hooks personnalisés](#hooks-personnalisés)
8. [Système d'internationalisation](#système-dinternationalisation)
9. [Styles & Design System](#styles--design-system)
10. [Flux de données](#flux-de-données)
11. [Fonctionnalités clés](#fonctionnalités-clés)

---

## 🎯 Vue d'ensemble

**TransportBF** est une Progressive Web App (PWA) de réservation de transport interurbain pour le Burkina Faso, construite avec :

- **Framework** : React 18 + TypeScript
- **Styling** : Tailwind CSS v4 + Design System personnalisé
- **UI Library** : ShadCN UI (composants headless)
- **State Management** : React State + localStorage
- **i18n** : Système custom (FR/EN/Mooré)
- **Backend** : API REST (actuellement en mode mock)
- **Responsive** : Mobile-first, adaptable desktop

---

## 🏗️ Architecture générale

```
TransportBF/
│
├── App.tsx                    # Point d'entrée, routing state-based
│
├── pages/                     # 15 pages de l'application
│   ├── LandingPage.tsx        # Page d'accueil publique
│   ├── AuthPage.tsx           # Authentification
│   ├── HomePage.tsx           # Recherche de trajets
│   ├── SearchResultsPage.tsx # Résultats de recherche
│   ├── TripDetailPage.tsx    # Détails d'un trajet
│   ├── SeatSelectionPage.tsx # Sélection de sièges
│   ├── PaymentPage.tsx        # Paiement
│   ├── PaymentSuccessPage.tsx# Confirmation paiement
│   ├── TicketsPage.tsx        # Liste des billets
│   ├── TicketDetailPage.tsx  # Détail d'un billet
│   ├── OperatorsPage.tsx     # Liste des compagnies
│   ├── OperatorDetailPage.tsx# Détail compagnie
│   ├── NearbyPage.tsx         # Gares à proximité
│   ├── NotificationsPage.tsx # Notifications
│   ├── SupportPage.tsx        # Support client
│   └── ProfilePage.tsx        # Profil utilisateur
│
├── components/                # Composants réutilisables
│   ├── Navigation.tsx         # Bottom nav + header
│   ├── TripCard.tsx           # Carte trajet
│   ├── TicketCard.tsx         # Carte billet
│   ├── SeatMap.tsx            # Plan de sièges interactif
│   ├── TTLTimer.tsx           # Timer pour réservation HOLD
│   ├── StoriesCircle.tsx      # Stories Instagram-style
│   ├── OperatorStoriesViewer.tsx # Modal stories compagnies
│   ├── GeolocationPrompt.tsx # Demande de consentement géoloc
│   ├── BookingStepIndicator.tsx # Indicateur d'étapes
│   └── ui/                    # 40+ composants ShadCN
│
├── lib/                       # Logique métier
│   ├── api.ts                 # Service API centralisé
│   ├── hooks.ts               # Hooks personnalisés
│   ├── i18n.ts                # Internationalisation
│   ├── interactions.ts        # Interactions tactiles
│   └── useGeolocation.ts      # Hook géolocalisation
│
├── data/                      # Modèles & données
│   └── models.ts              # Types + données mock
│
├── styles/                    # Styles globaux
│   └── globals.css            # Tailwind + tokens design
│
└── migrations/                # Scripts SQL backend
    └── 001_create_operator_stories.sql
```

---

## 🚪 Point d'entrée : App.tsx

### Principe de fonctionnement

`App.tsx` est le **composant racine** de l'application. Il gère :

1. **Le routing** (basé sur state, pas sur URL)
2. **L'état global** de l'application
3. **L'authentification** utilisateur
4. **Le dark mode**
5. **La navigation**

### État global (AppState)

```typescript
interface AppState {
  currentPage: Page;          // Page actuelle affichée
  user: User | null;          // Utilisateur connecté
  showAuth: boolean;          // Afficher modal auth
  authReturnTo?: string;      // Redirection après auth
  searchParams?: SearchParams;// Paramètres de recherche
  selectedTripId?: string;    // Trajet sélectionné
  selectedTicketId?: string;  // Billet sélectionné
  selectedOperatorId?: string;// Compagnie sélectionnée
  reservationData?: any;      // Données de réservation
  history: Page[];            // Historique de navigation
}
```

### Routing state-based

Contrairement à React Router, le routing ici est **basé sur le state** :

```typescript
type Page = 
  | 'landing'         // Page d'accueil
  | 'auth'            // Authentification
  | 'home'            // Recherche
  | 'search-results'  // Résultats
  | 'trip-detail'     // Détails trajet
  | 'seat-selection'  // Sélection sièges
  | 'payment'         // Paiement
  | 'payment-success' // Confirmation
  | 'tickets'         // Mes billets
  | 'ticket-detail'   // Détail billet
  | 'nearby'          // Gares proches
  | 'operators'       // Compagnies
  | 'operator-detail' // Détail compagnie
  | 'notifications'   // Notifications
  | 'support'         // Support
  | 'profile';        // Profil
```

**Avantages** :
- ✅ Pas de dépendance externe
- ✅ Historique de navigation natif
- ✅ Gestion fine des transitions
- ✅ État partagé entre pages

**Navigation** :

```typescript
// Fonction de navigation
const navigateTo = (page: Page, data?: any) => {
  // Vérification auth obligatoire (sauf landing/auth)
  if (!publicPages.includes(page) && !appState.user) {
    // Redirection vers auth
    setAppState(prev => ({ ...prev, currentPage: 'auth' }));
    return;
  }
  
  // Navigation + mise à jour state
  setAppState(prev => ({
    ...prev,
    currentPage: page,
    history: [...prev.history, prev.currentPage],
    // Données spécifiques selon la page
  }));
};
```

### Protection des routes

**Toutes les pages nécessitent une authentification** sauf :
- `landing` - Page d'accueil publique
- `auth` - Page de connexion

Si un utilisateur non connecté tente d'accéder à une page protégée, il est redirigé vers `auth`.

### Rendu des pages

```typescript
const renderPage = () => {
  switch (appState.currentPage) {
    case 'home':
      return <HomePage userName={user?.name} onSearch={handleSearch} />;
    case 'search-results':
      return <SearchResultsPage searchParams={searchParams} />;
    // ... autres pages
  }
};
```

### Dark Mode

Le dark mode est géré au niveau App et persisté dans `localStorage` :

```typescript
const [darkMode, setDarkMode] = useState(() => {
  const saved = localStorage.getItem('darkMode');
  return saved ? JSON.parse(saved) : false;
});

// Applique la classe 'dark' sur <html>
useEffect(() => {
  if (darkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}, [darkMode]);
```

---

## 📊 Data Layer

### 1. `/data/models.ts` - Modèles de données

Ce fichier centralise **tous les types TypeScript** et les **données mock**.

#### Types principaux

```typescript
// Statuts
type TicketStatus = 'AVAILABLE' | 'HOLD' | 'PAID' | 'EMBARKED' | 'CANCELLED';
type SeatStatus = 'available' | 'hold' | 'paid' | 'offline_reserved' | 'selected';
type TripType = 'ALLER_SIMPLE' | 'ALLER_RETOUR';

// Station/Gare
interface Station {
  id: string;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
  address?: string;
}

// Segment d'un trajet
interface Segment {
  segment_id: string;
  from_stop_id: string;
  to_stop_id: string;
  from_stop_name: string;
  to_stop_name: string;
  departure_time: string;
  arrival_time: string;
  distance_km: number;
  available_seats: number;  // ⚠️ Disponibilité PAR SEGMENT
  total_seats: number;
}

// Trajet
interface Trip {
  trip_id: string;
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
  segments: Segment[];      // ⚠️ Gestion multi-segments
  amenities: string[];
  has_live_tracking: boolean;
}

// Billet
interface Ticket {
  ticket_id: string;
  bundle_id?: string;       // Pour regrouper aller-retour
  trip_id: string;
  operator_name: string;
  from_stop_name: string;
  to_stop_name: string;
  departure_time: string;
  arrival_time: string;
  passenger_name: string;
  seat_number?: string;
  status: TicketStatus;
  qr_code: string;          // QR code pour validation
  alphanumeric_code: string;// Code alphanumérique de secours
  price: number;
  created_at: string;
  holder_downloaded: boolean;
  transfer_token?: string;   // Token unique pour transfert
  can_cancel: boolean;       // Annulable si >= 1h avant départ
  can_transfer: boolean;     // Transférable si non utilisé
}

// Compagnie
interface Operator {
  id: string;
  name: string;
  logo: string;
  logo_url?: string;         // URL du vrai logo
  vehicle_image_url?: string;// URL de l'image du bus
  rating: number;
  total_trips: number;
  description?: string;
  amenities?: string[];
  phone?: string;
  email?: string;
  is_active: boolean;
  has_unread_stories?: boolean; // Pour stories Instagram-style
  stories_count?: number;
}

// Story de compagnie
interface OperatorStory {
  id: string;
  operator_id: string;
  type: 'PROMO' | 'NEW_ROUTE' | 'ANNOUNCEMENT' | 'EVENT' | 'ACHIEVEMENT';
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
  is_viewed: boolean;        // Vu par l'utilisateur connecté
}
```

#### Données mock

Le fichier contient des données d'exemple pour :
- ✅ 10+ stations (Ouaga, Bobo, Koudougou, etc.)
- ✅ 20+ trajets avec segments
- ✅ 15+ billets avec différents statuts
- ✅ 5+ compagnies (Air Canada, Scoot, etc.)
- ✅ 10+ stories de compagnies

**Ces données permettent de développer sans backend.**

### 2. `/lib/api.ts` - Service API

Ce fichier centralise **toutes les communications backend**.

#### Architecture du service

```typescript
// Configuration
const isDevelopment = import.meta.env?.MODE === 'development' || true;
const BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:3000/api';

// Chaque fonction API a 2 modes :
// 1. DEV MODE : Retourne des données mock
// 2. PROD MODE : Fait une vraie requête HTTP
```

#### Fonctions API principales

**Stories**
```typescript
// GET /api/stories/active
export async function getActiveStories(): Promise<Story[]> {
  if (isDevelopment) {
    return MOCK_STORIES; // Mode dev
  }
  const response = await fetch(`${BASE_URL}/stories/active`);
  return response.json(); // Mode prod
}
```

**Stations**
```typescript
// GET /api/stations
export async function getStations(): Promise<Station[]> {
  if (isDevelopment) {
    return STATIONS_MOCK;
  }
  const response = await fetch(`${BASE_URL}/stations`);
  return response.json();
}

// GET /api/stations/nearby?lat=&lon=&radius=
export async function getNearbyStations(
  lat: number, 
  lon: number, 
  radius: number = 10
): Promise<NearbyStation[]> {
  if (isDevelopment) {
    // Calcul de distance en mode dev
    return calculateNearbyStations(lat, lon, radius);
  }
  const response = await fetch(
    `${BASE_URL}/stations/nearby?lat=${lat}&lon=${lon}&radius=${radius}`
  );
  return response.json();
}
```

**Trajets**
```typescript
// GET /api/trips?from=&to=&date=&passengers=
export async function searchTrips(params: SearchParams): Promise<Trip[]> {
  if (isDevelopment) {
    return filterMockTrips(params);
  }
  const query = new URLSearchParams(params);
  const response = await fetch(`${BASE_URL}/trips?${query}`);
  return response.json();
}

// GET /api/trips/:id
export async function getTripDetails(tripId: string): Promise<Trip> {
  if (isDevelopment) {
    return TRIPS_MOCK.find(t => t.trip_id === tripId);
  }
  const response = await fetch(`${BASE_URL}/trips/${tripId}`);
  return response.json();
}
```

**Réservations**
```typescript
// POST /api/bookings/hold
// Crée une réservation HOLD avec TTL de 10 minutes
export async function createHoldReservation(data: {
  trip_id: string;
  passenger_name: string;
  seat_numbers: string[];
}): Promise<{ reservation_id: string; expires_at: string }> {
  if (isDevelopment) {
    return {
      reservation_id: `HOLD_${Date.now()}`,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
    };
  }
  const response = await fetch(`${BASE_URL}/bookings/hold`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
}

// POST /api/bookings/confirm
// Confirme et paie la réservation
export async function confirmReservation(data: {
  reservation_id: string;
  payment_method: string;
  payment_token: string;
}): Promise<Ticket> {
  if (isDevelopment) {
    return MOCK_TICKET;
  }
  const response = await fetch(`${BASE_URL}/bookings/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
}
```

**Billets**
```typescript
// GET /api/tickets
export async function getMyTickets(): Promise<Ticket[]> {
  if (isDevelopment) {
    return TICKETS_MOCK;
  }
  const response = await fetch(`${BASE_URL}/tickets`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  });
  return response.json();
}

// POST /api/tickets/:id/transfer
export async function transferTicket(
  ticketId: string, 
  recipientEmail: string
): Promise<{ transfer_token: string }> {
  if (isDevelopment) {
    return { transfer_token: `XFER_${Date.now()}` };
  }
  const response = await fetch(`${BASE_URL}/tickets/${ticketId}/transfer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipient_email: recipientEmail })
  });
  return response.json();
}

// DELETE /api/tickets/:id
export async function cancelTicket(ticketId: string): Promise<void> {
  if (isDevelopment) {
    console.log(`Cancel ticket ${ticketId}`);
    return;
  }
  await fetch(`${BASE_URL}/tickets/${ticketId}`, {
    method: 'DELETE'
  });
}
```

**Compagnies**
```typescript
// GET /api/operators
export async function getOperators(): Promise<Operator[]> {
  if (isDevelopment) {
    return OPERATORS_MOCK;
  }
  const response = await fetch(`${BASE_URL}/operators`);
  return response.json();
}

// GET /operators/:id/stories
export async function getOperatorStories(operatorId: string): Promise<OperatorStory[]> {
  if (isDevelopment) {
    return OPERATOR_STORIES_MOCK[operatorId] || [];
  }
  const response = await fetch(`${BASE_URL}/operators/${operatorId}/stories`);
  return response.json();
}

// POST /operators/:id/stories/:storyId/view
export async function markStoryAsViewed(operatorId: string, storyId: string): Promise<void> {
  if (isDevelopment) {
    console.log(`Story ${storyId} marked as viewed`);
    return;
  }
  await fetch(`${BASE_URL}/operators/${operatorId}/stories/${storyId}/view`, {
    method: 'POST'
  });
}
```

#### Basculer vers le backend réel

Pour passer en mode production :

1. Modifier `/lib/api.ts` ligne 29 :
```typescript
// AVANT (dev)
const isDevelopment = import.meta.env?.MODE === 'development' || true;

// APRÈS (prod)
const isDevelopment = import.meta.env?.MODE === 'development';
```

2. Créer un fichier `.env` :
```env
VITE_MODE=production
VITE_API_URL=https://api.transportbf.com
```

3. Rebuild :
```bash
npm run build
```

---

## 📱 Pages & Routing

### 1. LandingPage.tsx

**Rôle** : Page d'accueil publique (marketing)

**Fonctionnalités** :
- Présentation de l'application
- Bouton "Commencer" → redirige vers AuthPage
- Design moderne avec animations
- Affichage des features clés
- Call-to-action principal

**Props** :
```typescript
interface Props {
  onNavigate: (page: Page) => void;
}
```

### 2. AuthPage.tsx

**Rôle** : Authentification (connexion / inscription)

**Fonctionnalités** :
- 2 boutons côte à côte : "Se connecter" et "S'inscrire"
- Formulaire simplifié (nom, téléphone, email optionnel)
- Mode invité possible
- Design avec couleurs BF (rouge/ambre/vert)
- Validation des champs

**Props** :
```typescript
interface Props {
  onAuth: (user: User) => void;
  onBack: () => void;
}
```

**Callback après auth** :
```typescript
const handleAuth = (user: User) => {
  // Utilisateur connecté, redirection vers home
  setAppState({ currentPage: 'home', user });
};
```

### 3. HomePage.tsx

**Rôle** : Page de recherche de trajets (après auth)

**Fonctionnalités** :
- 🔍 Recherche aller simple / aller-retour
- 📍 Sélection origine/destination (autocomplete)
- 📅 Sélecteur de dates
- 👥 Nombre de passagers (1-10)
- 📖 Stories circulaires (Instagram-style)
- 🚌 Raccourcis vers compagnies
- 🎯 Routes populaires

**État local** :
```typescript
interface SearchParams {
  type: 'ALLER_SIMPLE' | 'ALLER_RETOUR';
  from: string;
  to: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
}
```

**Flow** :
```
HomePage
  → Sélection critères
  → Clic "Rechercher"
  → navigateTo('search-results', searchParams)
```

### 4. SearchResultsPage.tsx

**Rôle** : Affiche les résultats de recherche

**Fonctionnalités** :
- Liste des trajets disponibles
- Tri par prix, durée, départ
- Filtres (compagnie, horaire, équipements)
- Affichage de la disponibilité par segment
- Carte interactive de l'itinéraire
- Animation de chargement

**Props** :
```typescript
interface Props {
  searchParams: SearchParams;
  onNavigate: (page: Page, data?: any) => void;
  onBack: () => void;
}
```

**Composant utilisé** : `TripCard`

**Flow** :
```
SearchResultsPage
  → Clic sur un trajet
  → navigateTo('trip-detail', tripId)
```

### 5. TripDetailPage.tsx

**Rôle** : Détails complets d'un trajet

**Fonctionnalités** :
- Infos complètes du trajet
- Liste des segments avec disponibilité
- Carte de l'itinéraire
- Équipements (WiFi, AC, USB, etc.)
- Suivi live si disponible
- Bouton "Réserver"

**Props** :
```typescript
interface Props {
  tripId: string;
  isRoundTrip: boolean;
  returnDate?: string;
  passengers: number;
  onNavigate: (page: Page, data?: any) => void;
  onBack: () => void;
}
```

**Composant utilisé** : `RouteMap`, `BookingStepIndicator`

**Flow aller simple** :
```
TripDetailPage
  → Clic "Réserver"
  → navigateTo('seat-selection', { tripId })
```

**Flow aller-retour** :
```
TripDetailPage (aller)
  → Clic "Valider ce trajet"
  → Recherche automatique retour
  → Affiche résultats retour
  → TripDetailPage (retour)
  → Clic "Valider les 2 trajets"
  → navigateTo('seat-selection', { outboundTripData, returnTripData })
```

### 6. SeatSelectionPage.tsx

**Rôle** : Sélection des sièges + infos passagers

**Fonctionnalités** :
- Plan de sièges interactif (4 colonnes par défaut)
- Sièges colorés selon statut :
  - 🟢 Disponible
  - 🟡 En attente (HOLD)
  - 🔴 Réservé
  - ⚫ Réservé offline
- Sélection multiple si plusieurs passagers
- Formulaire passager (nom, téléphone)
- Timer TTL 10 minutes
- Indicateur d'étapes (aller / retour / paiement)

**Props** :
```typescript
interface Props {
  tripId: string;
  passengers: number;
  userName?: string;
  userPhone?: string;
  isRoundTrip: boolean;
  returnDate?: string;
  outboundTripData?: any; // Si on sélectionne retour
  onNavigate: (page: Page, data?: any) => void;
  onBack: () => void;
}
```

**Composant utilisé** : `SeatMap`, `TTLTimer`, `BookingStepIndicator`

**Logique de sélection** :
```typescript
const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

const handleSeatClick = (seatNumber: string) => {
  if (selectedSeats.includes(seatNumber)) {
    // Déselection
    setSelectedSeats(prev => prev.filter(s => s !== seatNumber));
  } else if (selectedSeats.length < passengers) {
    // Sélection si pas encore atteint le nombre de passagers
    setSelectedSeats(prev => [...prev, seatNumber]);
  }
};
```

**Flow aller simple** :
```
SeatSelectionPage
  → Sélection sièges + infos passager
  → Clic "Continuer vers le paiement"
  → POST /api/bookings/hold (crée réservation HOLD)
  → navigateTo('payment', { reservationData })
```

**Flow aller-retour** :
```
SeatSelectionPage (aller)
  → Sélection sièges aller
  → Clic "Valider billet aller"
  → navigateTo('seat-selection', { returnTripData })
  
SeatSelectionPage (retour)
  → Sélection sièges retour
  → Clic "Continuer vers le paiement"
  → POST /api/bookings/hold (2 réservations HOLD)
  → navigateTo('payment', { outboundReservation, returnReservation })
```

### 7. PaymentPage.tsx

**Rôle** : Paiement de la réservation

**Fonctionnalités** :
- Choix du moyen de paiement :
  - 📱 Orange Money
  - 📱 Moov Money
  - 💳 Carte bancaire
- Affichage des frais
- Timer TTL pour finaliser
- Formulaire spécifique selon le provider
- Récapitulatif de la commande

**Props** :
```typescript
interface Props {
  reservationData: {
    reservation_id: string;
    trip_id: string;
    passenger_name: string;
    seat_numbers: string[];
    total_price: number;
    expires_at: string;
    // Si aller-retour
    return_reservation_id?: string;
    return_trip_id?: string;
  };
  onNavigate: (page: Page, data?: any) => void;
  onBack: () => void;
}
```

**Hook utilisé** : `usePaymentMethods()`

**Flow** :
```
PaymentPage
  → Sélection moyen de paiement
  → Saisie infos paiement
  → Clic "Payer"
  → POST /api/bookings/confirm
  → Webhook paiement (Orange/Moov)
  → Confirmation backend
  → navigateTo('payment-success', { ticketId })
```

### 8. PaymentSuccessPage.tsx

**Rôle** : Confirmation de paiement réussie

**Fonctionnalités** :
- Animation de succès
- Récapitulatif du/des billet(s)
- Bouton "Voir mes billets"
- Bouton "Télécharger PDF"
- Instructions de voyage

**Flow** :
```
PaymentSuccessPage
  → Clic "Voir mes billets"
  → navigateTo('tickets')
```

### 9. TicketsPage.tsx

**Rôle** : Liste de tous les billets

**Fonctionnalités** :
- Tabs filtres :
  - ✅ Actifs (PAID)
  - 🚌 Embarqués (EMBARKED)
  - ❌ Annulés (CANCELLED)
  - ⏱️ Expirés (date passée)
- Recherche par destination
- Tri par date
- Regroupement aller-retour (bundle_id)

**Composant utilisé** : `TicketCard`

**Flow** :
```
TicketsPage
  → Clic sur un billet
  → navigateTo('ticket-detail', ticketId)
```

### 10. TicketDetailPage.tsx

**Rôle** : Détails d'un billet

**Fonctionnalités** :
- QR Code scannable
- Code alphanumérique de secours
- Infos complètes du trajet
- Actions :
  - 🔄 Transférer (si transférable)
  - ❌ Annuler (si ≥ 1h avant départ)
  - 📥 Télécharger PDF
  - 📧 Envoyer par email
  - 📱 Partager
- Statut en temps réel
- Suivi live si disponible

**Props** :
```typescript
interface Props {
  ticketId: string;
  onNavigate: (page: Page, data?: any) => void;
  onBack: () => void;
}
```

**Actions possibles** :
```typescript
// Transfert
const handleTransfer = async (recipientEmail: string) => {
  const { transfer_token } = await transferTicket(ticketId, recipientEmail);
  // Email envoyé au destinataire avec le token
  toast.success('Billet transféré !');
};

// Annulation
const handleCancel = async () => {
  // Vérifier si >= 1h avant départ
  if (!ticket.can_cancel) {
    toast.error('Annulation impossible < 1h avant départ');
    return;
  }
  await cancelTicket(ticketId);
  toast.success('Billet annulé. Remboursement en cours.');
  navigateTo('tickets');
};
```

### 11. OperatorsPage.tsx

**Rôle** : Liste des compagnies de transport

**Fonctionnalités** :
- Liste des compagnies avec :
  - Logo circulaire
  - Cercle rouge/ambre/vert si stories non vues
  - Badge compteur de stories
  - Note et nombre de trajets
  - Équipements
- Filtres par note, équipements
- Stories Instagram-style par compagnie

**Composant utilisé** : `OperatorStoriesViewer`

**Flow** :
```
OperatorsPage
  → Clic sur logo avec cercle coloré
  → Modal stories s'ouvre
  → Swipe horizontal pour naviguer
  → Auto-progression 5 secondes
  → POST /operators/:id/stories/:storyId/view
  → Cercle devient gris quand tout vu
```

### 12. OperatorDetailPage.tsx

**Rôle** : Détails d'une compagnie

**Fonctionnalités** :
- Logo avec stories
- Infos complètes
- Trajets proposés
- Avis clients
- Contact (téléphone, email)
- Galerie photos

### 13. NearbyPage.tsx

**Rôle** : Gares et véhicules à proximité

**Fonctionnalités** :
- Demande de consentement géolocalisation
- Calcul des gares proches (rayon 50km)
- Affichage de la distance
- Prochains départs par gare
- Carte interactive
- Suivi live des véhicules en transit

**Hook utilisé** : `useGeolocation()`

**Consentement géolocalisation** :
```typescript
const { location, error, requestLocation } = useGeolocation();

// Stockage du consentement
const consent = localStorage.getItem('geolocation_consent');

// Purge après 7 jours (RGPD)
const consentDate = localStorage.getItem('geolocation_consent_date');
const now = Date.now();
if (now - Number(consentDate) > 7 * 24 * 60 * 60 * 1000) {
  localStorage.removeItem('geolocation_consent');
  localStorage.removeItem('geolocation_consent_date');
}
```

**Flow** :
```
NearbyPage
  → Affiche GeolocationPrompt
  → User clique "Autoriser"
  → requestLocation()
  → GET /api/stations/nearby?lat=12.37&lon=-1.52&radius=50
  → Affiche liste des gares proches
```

### 14. NotificationsPage.tsx

**Rôle** : Centre de notifications

**Fonctionnalités** :
- Notifications en temps réel
- Types :
  - 🎫 Billet acheté
  - 🚌 Départ imminent
  - ⏰ Retard
  - ✅ Embarquement validé
  - 🔄 Transfert reçu
- Tri par date
- Marquer comme lu
- Suppression

### 15. ProfilePage.tsx

**Rôle** : Profil utilisateur et paramètres

**Fonctionnalités** :
- Infos personnelles
- Historique de voyages
- Paramètres :
  - 🌙 Dark mode
  - 🌍 Langue (FR/EN/MO)
  - 🔔 Notifications
  - 📍 Géolocalisation
- Déconnexion

---

## 🧩 Composants réutilisables

### 1. Navigation.tsx

**Rôle** : Barre de navigation bottom (mobile) + header (desktop)

**Fonctionnalités** :
- 5 onglets :
  - 🏠 Accueil
  - 🎫 Mes billets
  - 📍 À proximité
  - 🔔 Notifications
  - 👤 Profil
- Badge compteur sur notifications
- Indicateur actif
- Responsive

### 2. TripCard.tsx

**Rôle** : Carte d'affichage d'un trajet

**Affichage** :
- Compagnie + logo
- Horaires départ/arrivée
- Durée
- Prix
- Disponibilité **par segment**
- Équipements
- Bouton "Voir détails"

**Props** :
```typescript
interface Props {
  trip: Trip;
  onClick: () => void;
}
```

### 3. TicketCard.tsx

**Rôle** : Carte d'affichage d'un billet

**Affichage** :
- Origine → Destination
- Date et heure
- N° de siège
- Statut (badge coloré)
- QR code miniature
- Actions rapides

**Props** :
```typescript
interface Props {
  ticket: Ticket;
  onClick: () => void;
}
```

### 4. SeatMap.tsx

**Rôle** : Plan de sièges interactif

**Fonctionnalités** :
- Grille 4 colonnes (2-2 ou 2-1-1)
- Couleurs selon statut
- Sélection/désélection au clic
- Limite selon nombre de passagers
- Affichage siège conducteur
- Légende des couleurs

**Props** :
```typescript
interface Props {
  seats: Seat[];
  selectedSeats: string[];
  maxSeats: number;
  onSeatClick: (seatNumber: string) => void;
}

interface Seat {
  number: string;
  status: SeatStatus;
  row: number;
  column: number;
}
```

### 5. TTLTimer.tsx

**Rôle** : Compte à rebours pour réservation HOLD

**Affichage** :
- Timer animé (MM:SS)
- Barre de progression
- Alerte quand < 2 min
- Expiration → redirection auto

**Props** :
```typescript
interface Props {
  expiresAt: string; // ISO date
  onExpire: () => void;
}
```

**Logique** :
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    const now = Date.now();
    const expires = new Date(expiresAt).getTime();
    const remaining = expires - now;
    
    if (remaining <= 0) {
      onExpire();
      clearInterval(interval);
    } else {
      setTimeLeft(remaining);
    }
  }, 1000);
  
  return () => clearInterval(interval);
}, [expiresAt]);
```

### 6. StoriesCircle.tsx

**Rôle** : Cercles de stories Instagram-style (générales)

**Affichage** :
- Scroll horizontal
- Cercles avec emoji + gradient
- Badge "Nouveau" si non vu
- Modal de lecture au clic

### 7. OperatorStoriesViewer.tsx

**Rôle** : Modal plein écran pour stories des compagnies

**Fonctionnalités** :
- Plein écran avec overlay
- Progress bars en haut (1 par story)
- Auto-progression 5 secondes
- Navigation :
  - Tap gauche → story précédente
  - Tap droite → story suivante
  - Swipe down → fermer
- Tracking des vues
- Support médias (images, gradients, vidéos)
- Badge catégorie (PROMO, NOUVEAUTÉ, etc.)
- Bouton CTA cliquable

**Props** :
```typescript
interface Props {
  operatorId: string;
  operatorName: string;
  stories: OperatorStory[];
  initialIndex?: number;
  onClose: () => void;
}
```

**Logique d'auto-progression** :
```typescript
useEffect(() => {
  const timer = setInterval(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onClose(); // Fin des stories
    }
  }, stories[currentIndex].duration_seconds * 1000);
  
  return () => clearInterval(timer);
}, [currentIndex]);
```

### 8. GeolocationPrompt.tsx

**Rôle** : Modal de demande de consentement géolocalisation

**Affichage** :
- Explication claire de l'usage
- Boutons "Autoriser" / "Refuser"
- Icônes et animations
- Mention RGPD (purge 7j)

### 9. BookingStepIndicator.tsx

**Rôle** : Indicateur visuel des étapes de réservation

**Affichage** :
- 2 ou 3 étapes selon aller simple/retour
- Aller simple :
  1. ✅ Sélection siège
  2. 💳 Paiement
- Aller-retour :
  1. ✅ Billet aller
  2. ✅ Billet retour
  3. 💳 Paiement
- Étape active en couleur
- Étapes complétées en vert

### 10. RouteMap.tsx

**Rôle** : Carte interactive de l'itinéraire

**Affichage** :
- Ligne entre origine et destination
- Marqueurs des arrêts intermédiaires
- Zoom/pan
- Distance et durée

### 11. SwipeableCard.tsx

**Rôle** : Carte avec gestes swipe (pour actions rapides)

**Actions** :
- Swipe gauche → Supprimer
- Swipe droite → Archiver
- Indicateurs visuels

### 12. AnimatedButton.tsx

**Rôle** : Bouton avec animations

**Variantes** :
- Primary (rouge BF)
- Secondary (doré BF)
- Success (vert BF)
- Loading
- Disabled

### 13. LoadingStates.tsx

**Rôle** : États de chargement

**Variantes** :
- Skeleton loader (cards)
- Spinner
- Progress bar
- Shimmer effect

---

## 🪝 Hooks personnalisés

### `/lib/hooks.ts`

#### 1. useStories()

```typescript
export function useStories() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchStories() {
      const data = await getActiveStories();
      setStories(data);
      setLoading(false);
    }
    fetchStories();
  }, []);
  
  return { stories, loading };
}
```

#### 2. useOperatorStories(operatorId)

```typescript
export function useOperatorStories(operatorId: string) {
  const [stories, setStories] = useState<OperatorStory[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchStories() {
      const data = await getOperatorStories(operatorId);
      setStories(data);
      setLoading(false);
    }
    fetchStories();
  }, [operatorId]);
  
  const markAsViewed = async (storyId: string) => {
    await markStoryAsViewed(operatorId, storyId);
    // Recharger pour mettre à jour is_viewed
    const updated = await getOperatorStories(operatorId);
    setStories(updated);
  };
  
  return { stories, loading, markAsViewed };
}
```

#### 3. useStations()

```typescript
export function useStations() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchStations() {
      const data = await getStations();
      setStations(data);
      setLoading(false);
    }
    fetchStations();
  }, []);
  
  return { stations, loading };
}
```

#### 4. usePaymentMethods()

```typescript
export function usePaymentMethods() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchMethods() {
      const data = await getPaymentMethods();
      setMethods(data);
      setLoading(false);
    }
    fetchMethods();
  }, []);
  
  return { methods, loading };
}
```

### `/lib/useGeolocation.ts`

#### useGeolocation()

```typescript
export function useGeolocation() {
  const [location, setLocation] = useState<GeolocationCoordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const requestLocation = () => {
    setLoading(true);
    
    if (!navigator.geolocation) {
      setError('Géolocalisation non supportée');
      setLoading(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(position.coords);
        setLoading(false);
        
        // Stocker consentement
        localStorage.setItem('geolocation_consent', 'true');
        localStorage.setItem('geolocation_consent_date', Date.now().toString());
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
  };
  
  return { location, error, loading, requestLocation };
}
```

---

## 🌍 Système d'internationalisation

### `/lib/i18n.ts`

**3 langues supportées** :
- 🇫🇷 Français (défaut)
- 🇬🇧 English
- 🇧🇫 Mooré (langue locale)

**Structure** :

```typescript
export type Language = 'fr' | 'en' | 'mo';

interface Translations {
  [key: string]: {
    fr: string;
    en: string;
    mo: string;
  };
}

const translations: Translations = {
  'home.search': {
    fr: 'Rechercher un trajet',
    en: 'Search for a trip',
    mo: 'Kɩbãa bàas'
  },
  'ticket.qr_code': {
    fr: 'Code QR',
    en: 'QR Code',
    mo: 'QR kõdo'
  },
  // ... 200+ traductions
};

export function t(key: string, lang: Language = 'fr'): string {
  return translations[key]?.[lang] || key;
}
```

**Usage** :

```typescript
import { t } from '../lib/i18n';

// Dans un composant
const currentLang = localStorage.getItem('language') || 'fr';

<button>{t('button.search', currentLang)}</button>
```

**Changement de langue** :

```typescript
const handleLanguageChange = (lang: Language) => {
  localStorage.setItem('language', lang);
  // Force re-render
  window.location.reload();
};
```

---

## 🎨 Styles & Design System

### `/styles/globals.css`

**Structure** :

1. **Imports Tailwind**
```css
@import "tailwindcss";
```

2. **Tokens de design** (couleurs BF)
```css
:root {
  /* Couleurs du drapeau burkinabé */
  --color-bf-red: #EF2B2D;
  --color-bf-amber: #FCD116;
  --color-bf-green: #009E49;
  
  /* Grays */
  --color-gray-50: #F9FAFB;
  --color-gray-900: #111827;
  
  /* Gradients */
  --gradient-bf: linear-gradient(135deg, var(--color-bf-red), var(--color-bf-amber), var(--color-bf-green));
}
```

3. **Typographie** (hiérarchie définie)
```css
h1 {
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1.2;
}

h2 {
  font-size: 2rem;
  font-weight: 600;
  line-height: 1.3;
}

/* ... h3, h4, h5, h6 */

p {
  font-size: 1rem;
  line-height: 1.6;
}
```

4. **Classes utilitaires personnalisées**
```css
.btn-primary {
  @apply bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors;
}

.card {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-md p-6;
}

.gradient-bf {
  background: var(--gradient-bf);
}
```

5. **Dark mode**
```css
.dark {
  --color-bg: #111827;
  --color-text: #F9FAFB;
}
```

**Classes Tailwind custom** :

```typescript
// Dans un composant
<div className="bg-gradient-to-r from-[#EF2B2D] via-[#FCD116] to-[#009E49]">
  Couleurs du Burkina Faso
</div>
```

---

## 🔄 Flux de données

### Architecture de l'état

```
App.tsx (État global)
  ↓
  ├─ currentPage (routing)
  ├─ user (auth)
  ├─ searchParams (recherche)
  ├─ selectedTripId (trajet sélectionné)
  ├─ selectedTicketId (billet sélectionné)
  ├─ reservationData (réservation en cours)
  └─ history (navigation)
  
Pages (État local)
  ↓
  └─ useEffect → API calls → setState
  
Composants (Props drilling)
  ↓
  └─ Reçoivent données via props
```

### Flow complet de réservation

```
1. HomePage
   ↓ (searchParams)
   
2. SearchResultsPage
   → API: GET /api/trips?from=&to=&date=
   ↓ (tripId)
   
3. TripDetailPage
   → API: GET /api/trips/:id
   ↓ (tripId + passengers)
   
4. SeatSelectionPage
   → Sélection sièges (état local)
   → API: POST /api/bookings/hold
   ↓ (reservationData)
   
5. PaymentPage
   → Sélection paiement (état local)
   → API: POST /api/bookings/confirm
   → Webhook Orange Money / Moov Money
   ↓ (ticketId)
   
6. PaymentSuccessPage
   → API: GET /api/tickets/:id
   ↓
   
7. TicketsPage
   → API: GET /api/tickets
```

### Gestion du cache

Actuellement pas de cache sophistiqué, mais **localStorage** utilisé pour :
- Dark mode
- Langue
- Consentement géolocalisation
- Token auth (futur)

**Future optimisation** : React Query ou SWR

---

## ⚙️ Fonctionnalités clés

### 1. Système HOLD (TTL 10 minutes)

**Problème** : Éviter que plusieurs users réservent le même siège simultanément

**Solution** : Réservation temporaire avec expiration

**Flow** :
```
1. User sélectionne un siège
2. POST /api/bookings/hold
3. Backend marque le siège en HOLD pendant 10 min
4. Timer affiché à l'utilisateur
5. Si paiement OK avant expiration :
   → Siège devient PAID
6. Si expiration :
   → Siège redevient AVAILABLE
   → User redirigé vers recherche
```

**Code** :
```typescript
// Backend (pseudo-code)
function createHoldReservation(data) {
  const reservation = {
    id: generateId(),
    status: 'HOLD',
    expires_at: new Date(Date.now() + 10 * 60 * 1000), // +10 min
    ...data
  };
  
  // Cron job pour nettoyer les HOLD expirés
  scheduleCron(() => {
    deleteExpiredHolds();
  }, '* * * * *'); // Chaque minute
  
  return reservation;
}
```

### 2. Disponibilité par segment

**Problème** : Un trajet peut avoir plusieurs arrêts intermédiaires

**Solution** : Calculer la disponibilité pour chaque segment

**Exemple** :
```
Trajet : Ouaga → Koudougou → Bobo
         [A]      [B]         [C]

Segments :
- Ouaga → Koudougou (A→B) : 15 sièges disponibles
- Koudougou → Bobo (B→C) : 20 sièges disponibles

Si user cherche Ouaga → Bobo :
  → Disponibilité = min(15, 20) = 15 sièges
```

**Code** :
```typescript
function calculateAvailability(trip: Trip, from: string, to: string): number {
  const relevantSegments = trip.segments.filter(seg =>
    seg.from_stop_id >= from && seg.to_stop_id <= to
  );
  
  // Le minimum détermine la disponibilité globale
  return Math.min(...relevantSegments.map(s => s.available_seats));
}
```

### 3. Transfert de billet

**Problème** : User veut transférer son billet à quelqu'un

**Solution** : Token unique single-use

**Flow** :
```
1. User clique "Transférer"
2. Saisit email du destinataire
3. POST /api/tickets/:id/transfer
4. Backend génère token unique :
   → token = hash(ticket_id + timestamp + secret)
5. Email envoyé au destinataire :
   "Vous avez reçu un billet : https://transportbf.com/claim?token=XYZ"
6. Destinataire clique lien
7. Ticket transféré dans son compte
8. Token devient invalide (single-use)
```

**Code** :
```typescript
// Backend
function transferTicket(ticketId: string, recipientEmail: string) {
  const token = generateToken(ticketId);
  
  // Stocker token
  storeToken(token, ticketId, recipientEmail, {
    expires_at: Date.now() + 24 * 60 * 60 * 1000, // 24h
    used: false
  });
  
  // Envoyer email
  sendEmail(recipientEmail, {
    subject: 'Vous avez reçu un billet',
    body: `Cliquez ici : ${APP_URL}/claim?token=${token}`
  });
  
  return { transfer_token: token };
}

function claimTicket(token: string, userId: string) {
  const tokenData = getToken(token);
  
  if (!tokenData || tokenData.used) {
    throw new Error('Token invalide ou déjà utilisé');
  }
  
  // Transférer le billet
  updateTicket(tokenData.ticket_id, {
    user_id: userId,
    holder_downloaded: false
  });
  
  // Marquer token comme utilisé
  markTokenAsUsed(token);
  
  return { success: true };
}
```

### 4. Annulation (règle 1h)

**Problème** : User veut annuler, mais pas trop tard

**Solution** : Annulation autorisée si ≥ 1h avant départ

**Code** :
```typescript
function canCancelTicket(ticket: Ticket): boolean {
  const now = Date.now();
  const departure = new Date(ticket.departure_time).getTime();
  const oneHourInMs = 60 * 60 * 1000;
  
  return (departure - now) >= oneHourInMs;
}

// Dans le composant
const handleCancel = async () => {
  if (!ticket.can_cancel) {
    toast.error('Annulation impossible moins de 1h avant le départ');
    return;
  }
  
  // Confirmation
  if (!confirm('Êtes-vous sûr de vouloir annuler ?')) {
    return;
  }
  
  await cancelTicket(ticket.ticket_id);
  toast.success('Billet annulé. Remboursement en cours.');
  
  // Refresh
  navigateTo('tickets');
};
```

### 5. Géolocalisation avec consentement

**Problème** : RGPD impose consentement explicite

**Solution** : Modal de demande + purge après 7 jours

**Code** :
```typescript
// Vérifier consentement
const consent = localStorage.getItem('geolocation_consent');
const consentDate = localStorage.getItem('geolocation_consent_date');

if (consent && consentDate) {
  const now = Date.now();
  const elapsed = now - Number(consentDate);
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  
  if (elapsed > sevenDays) {
    // Purge automatique
    localStorage.removeItem('geolocation_consent');
    localStorage.removeItem('geolocation_consent_date');
  }
}

// Demander consentement
const handleConsent = () => {
  localStorage.setItem('geolocation_consent', 'true');
  localStorage.setItem('geolocation_consent_date', Date.now().toString());
  requestLocation();
};
```

### 6. Stories Instagram-style

**Problème** : Compagnies veulent promouvoir leurs offres

**Solution** : Stories éphémères avec tracking

**Features** :
- ✅ Auto-progression 5 secondes
- ✅ Navigation tactile (tap gauche/droite)
- ✅ Progress bars en haut
- ✅ Tracking des vues par utilisateur
- ✅ Expiration automatique
- ✅ Support images/vidéos/gradients
- ✅ Call-to-action cliquables

**Code** (voir `OperatorStoriesViewer.tsx`)

### 7. Paiements multi-providers

**Problème** : Plusieurs moyens de paiement au BF

**Solution** : Intégration modulaire

**Providers supportés** :
- 📱 Orange Money (API)
- 📱 Moov Money (API)
- 💳 Cartes bancaires (Stripe/Wave)

**Flow Orange Money** :
```
1. User sélectionne Orange Money
2. Saisit numéro de téléphone
3. Frontend → POST /api/payments/initiate
4. Backend → API Orange Money
5. Orange Money envoie push au user
6. User valide sur son téléphone
7. Webhook → Backend
8. Backend → Confirme réservation
9. Frontend → Payment success
```

---

## 🚀 Déploiement

### Build de production

```bash
# Installer dépendances
npm install

# Build
npm run build

# Preview
npm run preview
```

### Variables d'environnement

Créer `.env` :
```env
VITE_MODE=production
VITE_API_URL=https://api.transportbf.com
VITE_GOOGLE_MAPS_API_KEY=xxx
VITE_SENTRY_DSN=xxx
```

### Hébergement

**Frontend** : Vercel / Netlify
**Backend** : Nestjs + PostgreSQL (Heroku, Railway, Render)

---

## 📚 Résumé des technologies

| Technologie | Usage |
|-------------|-------|
| **React 18** | Framework UI |
| **TypeScript** | Typage statique |
| **Tailwind CSS v4** | Styling |
| **ShadCN UI** | Composants UI |
| **Lucide React** | Icônes |
| **Sonner** | Toasts |
| **Recharts** | Graphiques (si analytics) |
| **Motion (Framer Motion)** | Animations |
| **QRCode.react** | Génération QR codes |

---

## 📖 Documentation complète

Fichiers de référence :
- `/ARCHITECTURE_CODE_COMPLETE.md` (ce fichier)
- `/PREPARATION_BACKEND_COMPLETE.md` - Backend endpoints
- `/BACKEND_API_STORIES.md` - API des stories
- `/BACKEND_CHECKLIST.md` - Checklist implémentation
- `/GUIDE_DEPLOYMENT.md` - Guide déploiement
- `/STORIES_IMPLEMENTATION_SUMMARY.md` - Résumé stories
- `/guidelines/Guidelines.md` - Standards de code

---

**Dernière mise à jour** : 4 novembre 2025  
**Version** : 1.0.0  
**Auteur** : TransportBF Team
