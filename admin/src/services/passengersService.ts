/**
 * @file passengersService.ts
 * @description Service de gestion des passagers (utilisateurs app mobile)
 * 
 * BACKEND-READY:
 * - Mode Mock: Données en mémoire avec simulation délai réseau
 * - Mode Production: Appels API vers le backend
 * 
 * Fonctionnalités:
 * - CRUD passagers
 * - Suspension/Réactivation
 * - Réinitialisation mot de passe
 * - Historique des réservations
 */

import { PassengerUser } from '../shared/types/standardized';
import { apiService } from './apiService';
import { AppConfig } from '../config/app.config';
import { MOCK_PASSENGERS } from '../lib/adminMockData';

// ==================== API FUNCTIONS ====================

/**
 * Récupère tous les passagers
 */
export async function fetchPassengers(): Promise<PassengerUser[]> {
  if (AppConfig.isMock) {
    // Mode Mock
    await new Promise(resolve => setTimeout(resolve, 500));
    return [...MOCK_PASSENGERS];
  }

  // Mode Production
  const response = await apiService.get<PassengerUser[]>('/api/admin/passengers');
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Erreur lors de la récupération des passagers');
  }
  return response.data;
}

/**
 * Récupère un passager par ID
 */
export async function fetchPassengerById(id: string): Promise<PassengerUser> {
  if (AppConfig.isMock) {
    // Mode Mock
    await new Promise(resolve => setTimeout(resolve, 300));
    const passenger = MOCK_PASSENGERS.find(p => p.id === id);
    if (!passenger) {
      throw new Error('Passager non trouvé');
    }
    return { ...passenger };
  }

  // Mode Production
  const response = await apiService.get<PassengerUser>(`/api/admin/passengers/${id}`);
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Passager non trouvé');
  }
  return response.data;
}

/**
 * Met à jour les informations d'un passager
 */
export async function updatePassenger(
  id: string,
  updates: Partial<Pick<PassengerUser, 'name' | 'email' | 'phone'>>
): Promise<PassengerUser> {
  if (AppConfig.isMock) {
    // Mode Mock
    await new Promise(resolve => setTimeout(resolve, 800));
    const index = MOCK_PASSENGERS.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error('Passager non trouvé');
    }
    MOCK_PASSENGERS[index] = {
      ...MOCK_PASSENGERS[index],
      ...updates,
    };
    return { ...MOCK_PASSENGERS[index] };
  }

  // Mode Production
  const response = await apiService.patch<PassengerUser>(`/api/admin/passengers/${id}`, updates);
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Erreur lors de la mise à jour');
  }
  return response.data;
}

/**
 * Suspend un passager
 */
export async function suspendPassenger(id: string, reason: string): Promise<void> {
  if (AppConfig.isMock) {
    // Mode Mock
    await new Promise(resolve => setTimeout(resolve, 800));
    const index = MOCK_PASSENGERS.findIndex(p => p.id === id);
    if (index !== -1) {
      MOCK_PASSENGERS[index].status = 'suspended';
    }
    return;
  }

  // Mode Production
  const response = await apiService.post<void>(`/api/admin/passengers/${id}/suspend`, { reason });
  if (!response.success) {
    throw new Error(response.error || 'Erreur lors de la suspension');
  }
}

/**
 * Réactive un passager
 */
export async function reactivatePassenger(id: string): Promise<void> {
  if (AppConfig.isMock) {
    // Mode Mock
    await new Promise(resolve => setTimeout(resolve, 800));
    const index = MOCK_PASSENGERS.findIndex(p => p.id === id);
    if (index !== -1) {
      MOCK_PASSENGERS[index].status = 'active';
    }
    return;
  }

  // Mode Production
  const response = await apiService.post<void>(`/api/admin/passengers/${id}/reactivate`);
  if (!response.success) {
    throw new Error(response.error || 'Erreur lors de la réactivation');
  }
}

/**
 * Réinitialise le mot de passe d'un passager
 */
export async function resetPassengerPassword(id: string): Promise<{ temporaryPassword: string }> {
  if (AppConfig.isMock) {
    // Mode Mock
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Génère un mot de passe temporaire
    const temporaryPassword = Math.random().toString(36).slice(-8).toUpperCase();
    return { temporaryPassword };
  }

  // Mode Production
  const response = await apiService.post<{ temporaryPassword: string }>(
    `/api/admin/passengers/${id}/reset-password`
  );
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Erreur lors de la réinitialisation');
  }
  return response.data;
}

/**
 * Supprime un passager
 */
export async function deletePassenger(id: string): Promise<void> {
  if (AppConfig.isMock) {
    // Mode Mock
    await new Promise(resolve => setTimeout(resolve, 1000));
    const index = MOCK_PASSENGERS.findIndex(p => p.id === id);
    if (index !== -1) {
      MOCK_PASSENGERS.splice(index, 1);
    }
    return;
  }

  // Mode Production
  const response = await apiService.delete<void>(`/api/admin/passengers/${id}`);
  if (!response.success) {
    throw new Error(response.error || 'Erreur lors de la suppression');
  }
}

/**
 * Envoie une notification à un passager
 */
export async function sendNotificationToPassenger(
  id: string,
  notification: { title: string; message: string }
): Promise<void> {
  if (AppConfig.isMock) {
    // Mode Mock
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log(`📧 Notification envoyée à ${id}:`, notification);
    return;
  }

  // Mode Production
  const response = await apiService.post<void>(`/api/admin/passengers/${id}/notify`, notification);
  if (!response.success) {
    throw new Error(response.error || 'Erreur lors de l\'envoi de la notification');
  }
}