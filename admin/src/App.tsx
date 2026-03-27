import { Toaster } from 'sonner@2.0.3';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { AdminAppProvider } from './context/AdminAppContext';

// Layout
import { RootLayout } from './components/layout/RootLayout';

// Auth pages
import { Login } from './components/Login';
import { OtpVerification } from './components/OtpVerification';

// Dashboard pages
import DashboardHome from './components/dashboard/DashboardHome';
import GlobalMap from './components/dashboard/GlobalMap';
import SupportCenter from './components/dashboard/SupportCenter';

// Transport Companies (Operators)
import TransportCompanyManagement from './components/dashboard/TransportCompanyManagement';
import CompanyDetailPage from './pages/companies/CompanyDetailPage';
import CompanyEditPage from './pages/companies/CompanyEditPage';

// Passengers
import PassengerManagement from './components/dashboard/PassengerManagement';
import PassengerDetailPage from './pages/passengers/PassengerDetailPage';

// Stations
import StationManagement from './components/dashboard/StationManagement';
import StationDetailPage from './pages/stations/StationDetailPage';

// Trips
import TripManagement from './components/dashboard/TripManagement';
import TripCreatePage from './pages/trips/TripCreatePage';
import TripDetailPage from './pages/trips/TripDetailPage';
import TripEditPage from './pages/trips/TripEditPage';

// Bookings
import BookingManagement from './components/dashboard/BookingManagement';
import BookingDetailPage from './pages/bookings/BookingDetailPage';

// Payments
import PaymentManagement from './components/dashboard/PaymentManagement';
import PaymentDetailPage from './pages/payments/PaymentDetailPage';
import ReconciliationPage from './pages/payments/ReconciliationPage';
import FinancialFlow from './components/dashboard/FinancialFlow';

// Content
import AdvertisingManagement from './components/dashboard/AdvertisingManagement';
import PromotionManagement from './components/dashboard/PromotionManagement';
import NotificationCenter from './components/dashboard/NotificationCenter';

// Support
import TicketManagement from './components/dashboard/TicketManagement';
import SupportDetailPage from './pages/support/SupportDetailPage';

// Analytics
import AnalyticsDashboard from './components/dashboard/AnalyticsDashboard';
import ReportsPage from './pages/analytics/ReportsPage';

// System
import IncidentManagement from './components/dashboard/IncidentManagement';
import SystemLogs from './components/dashboard/SystemLogs';
import Integrations from './components/dashboard/Integrations';
import SessionManagement from './components/dashboard/SessionManagement';
import PolicyManagement from './components/dashboard/PolicyManagement';
import ReferralManagement from './components/dashboard/ReferralManagement';
import Settings from './components/dashboard/Settings';

// Reviews
import ReviewManagement from './components/dashboard/ReviewManagement';

// 🎯 ADMIN APPLICATION - FasoTravel Platform Supervisor
//
// ARCHITECTURE:
// - BrowserRouter declarative mode (context propagation works in Figma Make)
// - AdminAppProvider wraps everything INSIDE BrowserRouter
// - Nested routes with RootLayout
// - Permission-based routing

export default function App() {
  return (
    <BrowserRouter>
      <AdminAppProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/verify-otp" element={<OtpVerification />} />
          <Route element={<RootLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="dashboard" element={<DashboardHome />} />

            {/* Transport Companies */}
            <Route path="companies" element={<TransportCompanyManagement />} />
            <Route path="companies/:companyId" element={<CompanyDetailPage />} />
            <Route path="companies/:companyId/edit" element={<CompanyEditPage />} />

            {/* Passengers */}
            <Route path="passengers" element={<PassengerManagement />} />
            <Route path="passengers/:passengerId" element={<PassengerDetailPage />} />

            {/* Stations */}
            <Route path="stations" element={<StationManagement />} />
            <Route path="stations/:stationId" element={<StationDetailPage />} />

            {/* Trips */}
            <Route path="trips" element={<TripManagement />} />
            <Route path="trips/create" element={<TripCreatePage />} />
            <Route path="trips/:tripId" element={<TripDetailPage />} />
            <Route path="trips/:tripId/edit" element={<TripEditPage />} />

            {/* Bookings */}
            <Route path="bookings" element={<BookingManagement />} />
            <Route path="bookings/:bookingId" element={<BookingDetailPage />} />

            {/* Payments */}
            <Route path="payments" element={<PaymentManagement />} />
            <Route path="payments/:paymentId" element={<PaymentDetailPage />} />
            <Route path="payments/reconciliation" element={<ReconciliationPage />} />
            <Route path="finances" element={<FinancialFlow />} />

            {/* Support */}
            <Route path="support" element={<SupportCenter />} />
            <Route path="tickets" element={<TicketManagement />} />
            <Route path="tickets/:ticketId" element={<SupportDetailPage />} />

            {/* Content */}
            <Route path="advertising" element={<AdvertisingManagement />} />
            <Route path="promotions" element={<PromotionManagement />} />
            <Route path="referrals" element={<ReferralManagement />} />
            <Route path="notifications" element={<NotificationCenter />} />

            {/* Analytics */}
            <Route path="analytics" element={<AnalyticsDashboard />} />
            <Route path="analytics/reports" element={<ReportsPage />} />

            {/* System */}
            <Route path="map" element={<GlobalMap />} />
            <Route path="incidents" element={<IncidentManagement />} />
            <Route path="logs" element={<SystemLogs />} />
            <Route path="integrations" element={<Integrations />} />
            <Route path="sessions" element={<SessionManagement />} />
            <Route path="policies" element={<PolicyManagement />} />
            <Route path="reviews" element={<ReviewManagement />} />
            <Route path="settings" element={<Settings />} />

            {/* 404 */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </AdminAppProvider>
    </BrowserRouter>
  );
}