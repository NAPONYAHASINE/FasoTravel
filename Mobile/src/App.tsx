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
import { App as CapApp } from '@capacitor/app';import { LandingPage } from './pages/LandingPage';
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
import { OTPVerificationPage } from './pages/OTPVerificationPage';
import { ReferralPage } from './pages/ReferralPage';
import { Toaster } from './components/ui/sonner';
import { AdModal } from './components/AdModal';

export type Page = 
  | 'landing'
  | 'auth'
  | 'otp-verification'
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
  | 'referral'
  | 'chat';

interface User {
  id?: string;
  name: string;
  email?: string;
  phone: string;
  isGuest: boolean;
  created_at?: string;
  loginIdentifier?: string;
}

export interface PaymentPreparationData {
  paymentMethod: string;
  payerPhone?: string;
  payerLabel?: string;
  cardHolderName?: string;
  cardNumber?: string;
  cardExpiry?: string;
  cardCvv?: string;
  appliedCoupon?: any; // Coupon applied on PaymentPage, preserved through OTP flow
  computedTotalToPay?: number; // Total calculated BEFORE OTP, preserved through round-trip
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
  selectedPaymentMethod?: string; // Payment method selected before OTP
  selectedPaymentPayload?: PaymentPreparationData;
  reservationData?: any;
  trackingTripId?: string; // For tracking live vehicle location from ticket detail
  profileData?: { name: string; email: string; phone: string }; // Updated profile data
  tripData?: { trip_id: string; operator_id: string; operator_name: string; from_stop_name: string; to_stop_name: string; departure_time: string; arrival_time: string; ticket_id: string }; // Trip data for rating page
  otpData?: { identifier: string; mode: 'auth' | 'payment'; returnPage: Page; paymentMethod?: string; paymentPayload?: PaymentPreparationData }; // OTP verification data
  pendingCoupon?: any; // Coupon pre-applied from ReferralPage "Utiliser"
  history: Page[];
}

export default function App() {
  // Dark mode state
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  const [pendingAuthData, setPendingAuthData] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true); // Check localStorage on mount

  const [appState, setAppState] = useState<AppState>({
    currentPage: 'landing',
    user: null,
    showAuth: false,
    history: []
  });

  // Initialize user from localStorage on mount
  // Always show landing (splash) first, then navigate after animation
  useEffect(() => {
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        const raw = JSON.parse(storedUser);
        // Le localStorage stocke le PassengerUser brut (firstName/lastName) 
        // mais l'app attend un champ `name`. On le construit si absent.
        const user = {
          ...raw,
          name: raw.name || [raw.firstName, raw.lastName].filter(Boolean).join(' ') || raw.email || '',
          phone: raw.phone || '',
        };
        setAppState(prev => ({
          ...prev,
          user,
          currentPage: 'landing' // Always show splash first
        }));
      } catch (error) {
        console.error('Failed to parse stored user', error);
        localStorage.removeItem('auth_user');
      }
    }
    setIsInitializing(false);
  }, []);

  // Apply dark mode class to html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Android hardware back button handler
  useEffect(() => {
    const listener = CapApp.addListener('backButton', () => {
      setAppState(prev => {
        if (prev.history.length > 0) {
          const newHistory = [...prev.history];
          const previousPage = newHistory.pop()!;
          return { ...prev, currentPage: previousPage, history: newHistory };
        } else if (prev.currentPage === 'home') {
          CapApp.minimizeApp();
          return prev;
        } else {
          return { ...prev, currentPage: prev.user ? 'home' : 'landing', history: [] };
        }
      });
    });
    return () => { listener.then(l => l.remove()); };
  }, []);

  const handleToggleDarkMode = (enabled: boolean) => {
    setDarkMode(enabled);
  };

  const syncUserProfile = (data: { name: string; email: string; phone: string }) => {
    setAppState(prev => {
      if (!prev.user) {
        return {
          ...prev,
          profileData: data,
        };
      }

      const updatedUser = {
        ...prev.user,
        name: data.name,
        email: data.email,
        phone: data.phone,
      };

      localStorage.setItem('auth_user', JSON.stringify(updatedUser));

      return {
        ...prev,
        user: updatedUser,
        profileData: data,
      };
    });
  };

  const navigateTo = (page: Page, data?: any) => {
    // Pages publiques (accessible sans authentification)
    const publicPages: Page[] = ['landing', 'auth', 'otp-verification', 'terms-conditions', 'home', 'nearby', 'search-results', 'operators', 'operator-detail'];
    
    // Pages protégées (nécessitent authentification)
    const protectedPages: Page[] = ['trip-detail', 'seat-selection', 'payment', 'tickets', 'support', 'profile', 'edit-profile', 'rating-review', 'referral'];
    
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

    if (page === 'profile' && data && data.name) {
      syncUserProfile(data);
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
      ...(page === 'payment' && data ? { 
        reservationData: data.paymentMethod ? prev.reservationData : data,
        selectedPaymentMethod: data.paymentMethod,
        selectedPaymentPayload: data.paymentPayload
      } : {}),
      ...(page === 'payment-success' && data ? { reservationData: data } : {}),
      ...(page === 'otp-verification' && data ? { otpData: data } : {}),
      ...(page === 'ticket-detail' && data ? { selectedTicketId: data } : {}),
      ...(page === 'operator-detail' && data ? { selectedOperatorId: data } : {}),
      ...(page === 'nearby' && data ? { trackingTripId: data } : {}), // Pass tripId for tracking
      ...(page === 'profile' && data && data.name ? { profileData: data } : {}), // Save updated profile data
      ...(page === 'rating-review' && data ? { tripData: data } : {}), // Pass trip data for rating page
      // Persist pendingCoupon from referral page
      ...(page === 'home' && data?.pendingCoupon ? { pendingCoupon: data.pendingCoupon } : {}),
      // Clear pendingCoupon on payment success
      ...(page === 'payment-success' ? { pendingCoupon: undefined } : {}),
    }));
  };

  const handleAuth = (user: User) => {
    // Store auth data temporarily and navigate to OTP verification
    setPendingAuthData(user);
    setAppState(prev => ({
      ...prev,
      currentPage: 'otp-verification',
      otpData: {
        identifier: user.loginIdentifier || user.phone || user.email || '',
        mode: 'auth',
        returnPage: 'home'
      },
      history: [...prev.history, prev.currentPage]
    }));
  };

  const handleOtpVerified = () => {
    // After OTP verification, set user and go to home
    if (pendingAuthData) {
      setAppState(prev => {
        const returnPage = prev.authReturnTo || 'home';
        return {
          ...prev,
          user: pendingAuthData,
          currentPage: returnPage,
          showAuth: false,
          authReturnTo: undefined,
          otpData: undefined
        };
      });
      setPendingAuthData(null);
    }
  };

  const handleLogout = () => {
    // Clear user and tokens from localStorage
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
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
        history: newHistory,
        // Quand on revient depuis le paiement, nettoyer reservationData pour éviter
        // la corruption d'état (reservationData.passengers est un tableau, pas un nombre)
        ...(prev.currentPage === 'payment' ? { reservationData: undefined } : {}),
        ...(prev.currentPage === 'payment' ? { selectedPaymentMethod: undefined, selectedPaymentPayload: undefined } : {}),
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
            darkMode={darkMode}
            isLoggedIn={!!appState.user}
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

      case 'otp-verification':
        return appState.otpData ? (
          <OTPVerificationPage
            identifier={appState.otpData.identifier}
            mode={appState.otpData.mode}
            paymentMethod={appState.otpData.paymentMethod}
            onVerified={(_code) => {
              // After OTP verified
              if (appState.otpData!.mode === 'auth') {
                handleOtpVerified();
              } else if (appState.otpData!.mode === 'payment') {
                // Continue to return page for payment with preserved paymentMethod
                navigateTo(appState.otpData!.returnPage, { 
                  paymentMethod: appState.otpData!.paymentMethod,
                  paymentPayload: appState.otpData!.paymentPayload,
                });
              }
            }}
            onBack={goBack}
            darkMode={darkMode}
          />
        ) : (
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
            passengers={appState.searchParams?.passengers || 1}
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
            selectedPaymentMethod={appState.selectedPaymentMethod}
            selectedPaymentPayload={appState.selectedPaymentPayload}
            pendingCoupon={appState.pendingCoupon}
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
        const derivedUserName = appState.user?.name || [((appState.user as any)?.firstName || ''), ((appState.user as any)?.lastName || '')].filter(Boolean).join(' ');
        return (
          <EditProfilePage
            onNavigate={navigateTo}
            onBack={goBack}
            onUpdateUser={syncUserProfile}
            initialName={appState.profileData?.name || derivedUserName}
            initialEmail={appState.profileData?.email || appState.user?.email}
            initialPhone={appState.profileData?.phone || appState.user?.phone}
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

      case 'referral':
        return (
          <ReferralPage
            onNavigate={navigateTo}
            onBack={goBack}
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

  // Don't show navigation on splash, landing, auth, payment, chat pages
  const hideNavigation = ['landing', 'auth', 'otp-verification', 'payment', 'payment-success', 'chat'].includes(appState.currentPage);

  // Pages where ads should be displayed
  const pagesWithAds: Page[] = ['home', 'search-results', 'tickets', 'operators', 'nearby'];
  const shouldShowAds = pagesWithAds.includes(appState.currentPage) && appState.user;

  // Check if user is new (registered < 7 days ago)
  const isNewUser = appState.user?.created_at 
    ? (Date.now() - new Date(appState.user.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000
    : false;

  if (isInitializing) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        darkMode ? 'bg-gray-900' : 'bg-white'
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full bg-white dark:bg-gray-900 transition-colors duration-200" style={{ overflowX: 'clip' }}>
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
