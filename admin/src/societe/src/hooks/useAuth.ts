/**
 * @file useAuth.ts
 * @description Auth hook
 */

import { useApp } from '../contexts/AppContext';

export function useAuth() {
  const { isAuthenticated, currentUser, login, logout } = useApp();

  return {
    isAuthenticated,
    user: currentUser,
    login,
    logout,
    isResponsable: currentUser?.role === 'responsable',
    isManager: currentUser?.role === 'manager',
    isCaissier: currentUser?.role === 'caissier'
  };
}
