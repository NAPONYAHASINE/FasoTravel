import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { DataProvider } from './contexts/DataContext';
import { registerServiceWorker } from './utils/registerSW';
import { Toaster } from './components/ui/sonner';

// ✅ Pages chargées immédiatement (critiques)
import LoginPage from './pages/LoginPage';
import StatusPage from './pages/StatusPage';

// ✅ Lazy loading des dashboards (chargés seulement si besoin)
const ResponsableDashboard = lazy(() => import('./pages/responsable/Dashboard'));
const ManagerDashboard = lazy(() => import('./pages/manager/Dashboard'));
const CaissierDashboard = lazy(() => import('./pages/caissier/Dashboard'));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#f59e0b] mb-4"></div>
      <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
    </div>
  </div>
);

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/status" element={<StatusPage />} />
        
        <Route
          path="/"
          element={
            isAuthenticated ? (
              user?.role === 'responsable' ? (
                <Navigate to="/responsable" replace />
              ) : user?.role === 'manager' ? (
                <Navigate to="/manager" replace />
              ) : user?.role === 'caissier' ? (
                <Navigate to="/caissier" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/responsable/*"
          element={
            <ProtectedRoute allowedRoles={['responsable']}>
              <ResponsableDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/manager/*"
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <ManagerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/caissier/*"
          element={
            <ProtectedRoute allowedRoles={['caissier']}>
              <CaissierDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="/unauthorized" element={<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Accès non autorisé</h1>
            <p className="text-gray-600 dark:text-gray-400">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
          </div>
        </div>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  // ✅ Enregistrer le Service Worker
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <Router>
            <AppRoutes />
            <Toaster />
          </Router>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

