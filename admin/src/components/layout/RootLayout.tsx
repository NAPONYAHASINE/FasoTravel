/**
 * @file RootLayout.tsx
 * @description Main layout wrapper for authenticated admin pages
 * 
 * STRUCTURE:
 * - Sidebar (navigation)
 * - TopBar (header with user menu)
 * - Main content area with <Outlet />
 */

import { Outlet, Navigate } from 'react-router';
import { Sidebar } from '../Sidebar';  // Use existing Sidebar (not SidebarV2)
import { TopBar } from '../TopBar';
import { useAdminAppSafe } from '../../context/AdminAppContext';

export function RootLayout() {
  const ctx = useAdminAppSafe();

  // 🔥 Si contexte pas disponible (HMR Figma Make), redirect vers login sans crash
  if (!ctx || !ctx.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - Navigation */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* TopBar - Header */}
        <TopBar />

        {/* Page content - React Router Outlet */}
        <main className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
          <Outlet />
        </main>
      </div>
    </div>
  );
}