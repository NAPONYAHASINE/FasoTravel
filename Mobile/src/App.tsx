/**
 * TransportBF - Application de réservation de transport interurbain
 * 
 * ARCHITECTURE:
 * - Frontend React + TailwindCSS
 * - Multi-pages avec navigation state-based
 * - Responsive mobile + desktop
 * - i18n support (FR/EN/MO)
 * - Mock data pour testing (voir /data/models.ts)
 * 
 * DEV HANDOFF:
 * - Voir /data/models.ts pour tous les modèles de données
 * - Endpoints mockés dans chaque composant/page (voir DEV NOTES)
 * - Events analytics à tracker (voir annotations)
 * - Règles métiers critiques documentées partout
 * 
 * PAGES IMPLÉMENTÉES:
 * 1. HomePage - Recherche de trajets
 * 2. SearchResultsPage - Résultats de recherche
 * 3. TripDetailPage - Détail d'un trajet
 * 4. SeatSelectionPage - Sélection de siège + infos passager
 * 5. PaymentPage - Paiement (Orange Money, Moov, Carte)
 * 6. TicketsPage - Liste des billets (tabs: Actifs/Embarqués/Annulés/Expirés)
 * 7. TicketDetailPage - Détail billet avec QR code
 * 8. NearbyPage - Gares et véhicules à proximité
 * 9. ProfilePage - Profil et paramètres
 * 
 * COMPOSANTS RÉUTILISABLES:
 * - TripCard - Carte trajet avec disponibilité segments
 * - TicketCard - Carte billet avec actions
 * - SeatMap - Plan sièges interactif
 * - TTLTimer - Compte à rebours pour HOLD
 * - Navigation - Bottom nav (mobile) + Header (desktop)
 * 
 * FEATURES CLÉS:
 * ✅ Recherche aller simple / aller-retour
 * ✅ Disponibilité par segment
 * ✅ Réservation avec HOLD (TTL 10 min)
 * ✅ Paiement multi-providers
 * ✅ QR code + code alphanumérique
 * ✅ Transfert de billet (single-use token)
 * ✅ Annulation (≤1h avant départ)
 * ✅ Géolocalisation (consent + purge 7j)
 * ✅ Multi-langue (FR/EN/MO)
 * ✅ Responsive mobile + desktop
 * 
 * TODO BACKEND:
 * - Implémenter tous les endpoints (voir DEV NOTES dans chaque fichier)
 * - Webhooks paiement
 * - Géofencing pour suivi live
 * - PWA offline pour guichets
 * - Analytics events tracking
 */
import { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { LandingPage } from './pages/LandingPage';
import { HomePage, SearchParams } from './pages/HomePage';
import { SearchResultsPage } from './pages/SearchResultsPage';
import { TripDetailPage } from './pages/TripDetailPage';
import { SeatSelectionPage } from './pages/SeatSelectionPage';
import { PaymentPage } from './pages/PaymentPage';
import { TicketsPage } from './pages/TicketsPage';
import { TicketDetailPage } from './pages/TicketDetailPage';
import { NearbyPage } from './pages/NearbyPage';
import { ProfilePage } from './pages/ProfilePage';
import { EditProfilePage } from './pages/EditProfilePage';
import { TermsConditionsPage } from './pages/TermsConditionsPage';
import { PaymentSuccessPage } from './pages/PaymentSuccessPage';
import { AuthPage } from './pages/AuthPage';
import { SupportPage } from './pages/SupportPage';
import { ChatPage } from './pages/ChatPage';
import { OperatorsPage } from './pages/OperatorsPage';
import { OperatorDetailPage } from './pages/OperatorDetailPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { RatingReviewPage } from './pages/RatingReviewPage';
import { Toaster } from './components/ui/sonner';
import { AdModal } from './components/AdModal';

export type Page = 
  | 'landing'
  | 'auth'
  | 'home' 
  | 'search-results' 
  | 'trip-detail' 
  | 'seat-selection' 
  | 'payment' 
  | 'payment-success'
  | 'tickets' 
  | 'ticket-detail' 
  | 'nearby'
  | 'stations-nearby'
  | 'support'
  | 'operators'
  | 'operator-detail'
  | 'notifications'
  | 'profile'
  | 'edit-profile'
  | 'rating-review'
  | 'terms-conditions'
  | 'chat';

interface User {
  id?: string;
  name: string;
  email?: string;
  phone: string;
  isGuest: boolean;
  created_at?: string;
}

interface AppState {
  currentPage: Page;
  user: User | null;
  showAuth: boolean;
  authReturnTo?: Page;  // Changed: should be Page type, not string
  searchParams?: SearchParams;
  selectedTripId?: string;
  selectedTicketId?: string;
  selectedOperatorId?: string;
  reservationData?: any;
  trackingTripId?: string; // For tracking live vehicle location from ticket detail
  profileData?: { name: string; email: string; phone: string }; // Updated profile data
  tripData?: { trip_id: string; operator_id: string; operator_name: string; from_stop_name: string; to_stop_name: string; departure_time: string; arrival_time: string; ticket_id: string }; // Trip data for rating page
  history: Page[];
}

export default function App() {
  // Dark mode state
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  const [appState, setAppState] = useState<AppState>({
    currentPage: 'home', // Start with home page
    user: null, // User must authenticate
    showAuth: false,
    history: []
  });

  // Apply dark mode class to html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const handleToggleDarkMode = (enabled: boolean) => {
    setDarkMode(enabled);
  };

  const navigateTo = (page: Page, data?: any) => {
    // Pages publiques (accessible sans authentification)
    const publicPages: Page[] = ['landing', 'auth', 'terms-conditions', 'home', 'nearby', 'search-results', 'operators', 'operator-detail'];
    
    // Pages protégées (nécessitent authentification)
    const protectedPages: Page[] = ['trip-detail', 'seat-selection', 'payment', 'tickets', 'support', 'profile', 'edit-profile', 'rating-review'];
    
    // Si c'est une page protégée et l'utilisateur n'est pas connecté, rediriger vers auth
    if (protectedPages.includes(page) && !appState.user) {
      setAppState(prev => ({
        ...prev,
        currentPage: 'auth',
        authReturnTo: page, // Sauvegarde la page cible
        history: [...prev.history, prev.currentPage],
        // Sauvegarde aussi les données pour certaines pages
        ...(page === 'trip-detail' && data ? { selectedTripId: data } : {}),
        ...(page === 'seat-selection' && data ? { 
          selectedTripId: typeof data === 'string' ? data : data.tripId,
          reservationData: typeof data === 'object' ? data : undefined
        } : {}),
      }));
      return;
    }
    
    // Si c'est une page non-publique ET non-protégée ET l'utilisateur n'est pas connecté, rediriger vers auth
    if (!publicPages.includes(page) && !protectedPages.includes(page) && !appState.user) {
      setAppState(prev => ({
        ...prev,
        currentPage: 'auth',
        history: [...prev.history, prev.currentPage]
      }));
      return;
    }
    
    setAppState(prev => ({
      ...prev,
      currentPage: page,
      history: [...prev.history, prev.currentPage],
      ...(page === 'search-results' && data ? { searchParams: data } : {}),
      ...(page === 'trip-detail' && data ? { selectedTripId: data } : {}),
      ...(page === 'seat-selection' && data ? { 
        selectedTripId: typeof data === 'string' ? data : data.tripId,
        reservationData: typeof data === 'object' ? data : undefined
      } : {}),
      ...(page === 'payment' && data ? { reservationData: data } : {}),
      ...(page === 'payment-success' && data ? { reservationData: data } : {}),
      ...(page === 'ticket-detail' && data ? { selectedTicketId: data } : {}),
      ...(page === 'operator-detail' && data ? { selectedOperatorId: data } : {}),
      ...(page === 'nearby' && data ? { trackingTripId: data } : {}), // Pass tripId for tracking
      ...(page === 'profile' && data && data.name ? { profileData: data } : {}), // Save updated profile data
      ...(page === 'rating-review' && data ? { tripData: data } : {}), // Pass trip data for rating page
    }));
  };

  const handleAuth = (user: User) => {
    setAppState(prev => {
      // Si on revient d'une page protégée, revenir à cette page
      const returnPage = prev.authReturnTo || 'home';
      return {
        ...prev,
        user,
        currentPage: returnPage,
        showAuth: false,
        authReturnTo: undefined
      };
    });
  };

  const handleLogout = () => {
    // Clear user and return to landing
    setAppState({
      currentPage: 'landing',
      user: null,
      showAuth: false,
      history: []
    });
  };

  const goBack = () => {
    if (appState.history.length > 0) {
      const newHistory = [...appState.history];
      const previousPage = newHistory.pop()!;
      setAppState(prev => ({
        ...prev,
        currentPage: previousPage,
        history: newHistory
      }));
    } else {
      // Default fallback - if authenticated go home, else landing
      setAppState(prev => ({
        ...prev,
        currentPage: prev.user ? 'home' : 'landing',
        history: []
      }));
    }
  };

  const handleSearch = (params: SearchParams) => {
    navigateTo('search-results', params);
  };

  const renderPage = () => {
    switch (appState.currentPage) {
      case 'landing':
        return (
          <LandingPage
            onNavigate={navigateTo}
          />
        );

      case 'auth':
        return (
          <AuthPage
            onAuth={handleAuth}
            onBack={() => navigateTo('landing')}
            onNavigate={navigateTo}
          />
        );

      case 'home':
        return (
          <HomePage
            userName={appState.user?.name}
            onSearch={handleSearch}
            onNavigate={navigateTo}
          />
        );

      case 'search-results':
        return appState.searchParams ? (
          <SearchResultsPage
            searchParams={appState.searchParams}
            onNavigate={navigateTo}
            onBack={goBack}
          />
        ) : (
          <HomePage userName={appState.user?.name} onSearch={handleSearch} />
        );

      case 'trip-detail':
        return appState.selectedTripId ? (
          <TripDetailPage
            tripId={appState.selectedTripId}
            isRoundTrip={appState.searchParams?.type === 'ALLER_RETOUR'}
            returnDate={appState.searchParams?.returnDate}
            passengers={appState.searchParams?.passengers || 1}
            onNavigate={navigateTo}
            onBack={goBack}
          />
        ) : (
          <HomePage userName={appState.user?.name} onSearch={handleSearch} />
        );

      case 'seat-selection':
        return appState.selectedTripId ? (
          <SeatSelectionPage
            tripId={appState.selectedTripId}
            passengers={appState.reservationData?.passengers || appState.searchParams?.passengers || 1}
            userName={appState.user?.name}
            userPhone={appState.user?.phone}
            isRoundTrip={appState.reservationData?.isRoundTrip || appState.searchParams?.type === 'ALLER_RETOUR'}
            returnDate={appState.reservationData?.returnDate || appState.searchParams?.returnDate}
            outboundTripData={appState.reservationData?.outboundTripData}
            onNavigate={navigateTo}
            onBack={goBack}
          />
        ) : (
          <HomePage userName={appState.user?.name} onSearch={handleSearch} />
        );

      case 'payment':
        return appState.reservationData ? (
          <PaymentPage
            reservationData={appState.reservationData}
            onNavigate={navigateTo}
            onBack={goBack}
          />
        ) : (
          <HomePage userName={appState.user?.name} onSearch={handleSearch} />
        );

      case 'payment-success':
        return appState.reservationData ? (
          <PaymentSuccessPage
            reservationData={appState.reservationData}
            onNavigate={navigateTo}
          />
        ) : (
          <HomePage userName={appState.user?.name} onSearch={handleSearch} />
        );

      case 'tickets':
        return (
          <TicketsPage
            onNavigate={navigateTo}
          />
        );

      case 'ticket-detail':
        return appState.selectedTicketId ? (
          <TicketDetailPage
            ticketId={appState.selectedTicketId}
            onNavigate={navigateTo}
            onBack={goBack}
          />
        ) : (
          <TicketsPage onNavigate={navigateTo} />
        );

      case 'nearby':
      case 'stations-nearby':
        return (
          <NearbyPage
            trackingTripId={appState.trackingTripId}
            onNavigate={navigateTo}
          />
        );

      case 'support':
        return (
          <SupportPage
            onBack={goBack}
            user={appState.user}
            onNavigate={navigateTo}
          />
        );

      case 'chat':
        return (
          <ChatPage
            onBack={goBack}
            user={appState.user}
          />
        );

      case 'operators':
        return (
          <OperatorsPage
            onNavigate={navigateTo}
            onBack={goBack}
          />
        );

      case 'operator-detail':
        return appState.selectedOperatorId ? (
          <OperatorDetailPage
            operatorId={appState.selectedOperatorId}
            onNavigate={navigateTo}
            onBack={goBack}
          />
        ) : (
          <OperatorsPage onNavigate={navigateTo} onBack={goBack} />
        );

      case 'notifications':
        return (
          <NotificationsPage
            onBack={goBack}
          />
        );

      case 'profile':
        return (
          <ProfilePage
            onNavigate={navigateTo}
            onBack={goBack}
            onLogout={handleLogout}
            darkMode={darkMode}
            onToggleDarkMode={handleToggleDarkMode}
            updatedUserData={appState.profileData}
          />
        );

      case 'edit-profile':
        return (
          <EditProfilePage
            onNavigate={navigateTo}
            onBack={goBack}
            initialName={appState.profileData?.name}
            initialEmail={appState.profileData?.email}
            initialPhone={appState.profileData?.phone}
          />
        );

      case 'terms-conditions':
        return (
          <TermsConditionsPage
            onNavigate={navigateTo}
            onBack={goBack}
          />
        );

      case 'rating-review':
        return (
          <RatingReviewPage
            onNavigate={navigateTo}
            tripData={appState.tripData}
          />
        );

      default:
        return (
          <HomePage
            userName={appState.user?.name}
            onSearch={handleSearch}
          />
        );
    }
  };

  // Don't show navigation on landing, auth, payment, chat pages
  const hideNavigation = ['landing', 'auth', 'payment', 'payment-success', 'chat'].includes(appState.currentPage);

  // Pages where ads should be displayed
  const pagesWithAds: Page[] = ['home', 'search-results', 'tickets', 'operators', 'nearby'];
  const shouldShowAds = pagesWithAds.includes(appState.currentPage) && appState.user;

  // Check if user is new (registered < 7 days ago)
  const isNewUser = appState.user?.created_at 
    ? (Date.now() - new Date(appState.user.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000
    : false;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      {renderPage()}
      
      {!hideNavigation && (
        <Navigation
          currentPage={appState.currentPage}
          onNavigate={navigateTo}
          userName={appState.user?.name}
        />
      )}

      {/* Auth Modal */}
      {appState.showAuth && (
        <AuthPage
          onAuth={handleAuth}
          onBack={() => setAppState(prev => ({ ...prev, showAuth: false }))}
        />
      )}

      {/* Advertisement System */}
      {shouldShowAds && (
        <AdModal
          currentPage={appState.currentPage}
          onNavigate={navigateTo}
          userId={appState.user?.id}
          isNewUser={isNewUser}
        />
      )}

      <Toaster />
    </div>
  );
}
