/**
 * Hooks réutilisables pour toutes les entités
 * Backend-ready: Gèrent loading, errors, cache, et refresh
 * Version 2.0 - Fix: Boucle infinie résolue
 */

import { useState, useEffect, useRef } from 'react';
import {
  transportCompaniesService,
  passengersService,
  stationsService,
  supportService,
  incidentsService,
  storiesService,
  storyCirclesService,
  auditLogsService,
  notificationsService,
  advertisementsService,
  reviewsService,
  userSessionsService,
  operatorPoliciesService,
  operatorServicesService,
  integrationsService,
  featureFlagsService,
} from '../services/entitiesService';
import {
  updatePassenger,
  resetPassengerPassword,
  deletePassenger,
} from '../services/passengersService';
import {
  TransportCompany,
  PassengerUser,
  Station,
  Support,
  Incident,
  Story,
  StoryCircle,
  AuditLog,
  Notification,
  Advertisement,
  Review,
  UserSession,
  OperatorPolicy,
  OperatorService,
  Integration,
  FeatureFlag,
} from '../shared/types/standardized';

// ============================================================================
// TYPES GÉNÉRIQUES
// ============================================================================

export interface UseEntityOptions {
  autoLoad?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export interface UseEntityReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export interface UseEntitiesReturn<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// ============================================================================
// TRANSPORT COMPANIES
// ============================================================================

export function useTransportCompanies(options: UseEntityOptions = {}): UseEntitiesReturn<TransportCompany> {
  const { autoLoad = true } = options;
  const [data, setData] = useState<TransportCompany[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await transportCompaniesService.getAll();

      if (response.success && response.data) {
        setData(response.data);
        options.onSuccess?.(response.data);
      } else {
        const errorMsg = response.error || 'Erreur lors du chargement';
        setError(errorMsg);
        options.onError?.(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMsg);
      options.onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoLoad && !loadedRef.current) {
      loadedRef.current = true;
      refresh();
    }
  }, []); // ✅ Pas de dépendances instables

  return { data, loading, error, refresh };
}

export function useTransportCompany(id: string): UseEntityReturn<TransportCompany> {
  const [data, setData] = useState<TransportCompany | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await transportCompaniesService.getById(id);
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error || 'Société non trouvée');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      refresh();
    }
  }, []); // ✅ Stable

  return { data, loading, error, refresh };
}

// Actions pour TransportCompanies
export function useCompanyActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const approve = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await transportCompaniesService.approve(id);
      if (!response.success) {
        setError(response.error || 'Échec de l\'approbation');
      }
      return response;
    } finally {
      setLoading(false);
    }
  };

  const suspend = async (id: string, reason: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await transportCompaniesService.suspend(id, reason);
      if (!response.success) {
        setError(response.error || 'Échec de la suspension');
      }
      return response;
    } finally {
      setLoading(false);
    }
  };

  const create = async (data: Partial<TransportCompany>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await transportCompaniesService.create(data);
      if (!response.success) {
        setError(response.error || 'Échec de la création');
      }
      return response;
    } finally {
      setLoading(false);
    }
  };

  const update = async (id: string, data: Partial<TransportCompany>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await transportCompaniesService.update(id, data);
      if (!response.success) {
        setError(response.error || 'Échec de la mise à jour');
      }
      return response;
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await transportCompaniesService.delete(id);
      if (!response.success) {
        setError(response.error || 'Échec de la suppression');
      }
      return response;
    } finally {
      setLoading(false);
    }
  };

  return { approve, suspend, create, update, remove, loading, error };
}

// ============================================================================
// PASSENGERS
// ============================================================================

export function usePassengers(options: UseEntityOptions = {}): UseEntitiesReturn<PassengerUser> {
  const { autoLoad = true } = options;
  const [data, setData] = useState<PassengerUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await passengersService.getAll();

      if (response.success && response.data) {
        setData(response.data);
        options.onSuccess?.(response.data);
      } else {
        const errorMsg = response.error || 'Erreur lors du chargement';
        setError(errorMsg);
        options.onError?.(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMsg);
      options.onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoLoad && !loadedRef.current) {
      loadedRef.current = true;
      refresh();
    }
  }, []);

  return { data, loading, error, refresh };
}

export function usePassenger(id: string): UseEntityReturn<PassengerUser> {
  const [data, setData] = useState<PassengerUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await passengersService.getById(id);
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error || 'Passager non trouvé');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      refresh();
    }
  }, []);

  return { data, loading, error, refresh };
}

// Actions pour Passengers
export function usePassengerActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suspend = async (id: string, reason: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await passengersService.suspend(id, reason);
      if (!response.success) {
        setError(response.error || 'Échec de la suspension');
      }
      return response;
    } finally {
      setLoading(false);
    }
  };

  const reactivate = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await passengersService.reactivate(id);
      if (!response.success) {
        setError(response.error || 'Échec de la réactivation');
      }
      return response;
    } finally {
      setLoading(false);
    }
  };

  const verify = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await passengersService.verify(id);
      if (!response.success) {
        setError(response.error || 'Échec de la vérification');
      }
      return response;
    } finally {
      setLoading(false);
    }
  };

  const update = async (id: string, updates: Partial<Pick<PassengerUser, 'name' | 'email' | 'phone'>>) => {
    setLoading(true);
    setError(null);
    try {
      await updatePassenger(id, updates);
    } catch (err: any) {
      setError(err.message || 'Échec de la mise à jour');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (id: string): Promise<string> => {
    setLoading(true);
    setError(null);
    try {
      const result = await resetPassengerPassword(id);
      return result.temporaryPassword;
    } catch (err: any) {
      setError(err.message || 'Échec de la réinitialisation');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await deletePassenger(id);
    } catch (err: any) {
      setError(err.message || 'Échec de la suppression');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { suspend, reactivate, verify, update, resetPassword, remove, loading, error };
}

// ============================================================================
// STATIONS
// ============================================================================

export function useStations(options: UseEntityOptions = {}): UseEntitiesReturn<Station> {
  const { autoLoad = true } = options;
  const [data, setData] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await stationsService.getAll();

      if (response.success && response.data) {
        setData(response.data);
        options.onSuccess?.(response.data);
      } else {
        const errorMsg = response.error || 'Erreur lors du chargement';
        setError(errorMsg);
        options.onError?.(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMsg);
      options.onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoLoad && !loadedRef.current) {
      loadedRef.current = true;
      refresh();
    }
  }, []);

  return { data, loading, error, refresh };
}

export function useStation(id: string): UseEntityReturn<Station> {
  const [data, setData] = useState<Station | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await stationsService.getById(id);
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error || 'Station non trouvée');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      refresh();
    }
  }, []);

  return { data, loading, error, refresh };
}

// Actions pour Stations
export function useStationActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ⚠️ toggleStatus supprimé - Le statut est maintenant AUTOMATIQUE
  // Basé sur heures d'ouverture + connexion internet de l'App Société

  const create = async (data: Omit<Station, 'id'>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await stationsService.create(data);
      if (!response.success) {
        setError(response.error || 'Échec de la création');
      }
      return response;
    } finally {
      setLoading(false);
    }
  };

  const update = async (id: string, data: Partial<Station>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await stationsService.update(id, data);
      if (!response.success) {
        setError(response.error || 'Échec de la mise à jour');
      }
      return response;
    } finally {
      setLoading(false);
    }
  };

  return { create, update, loading, error };
}

// ============================================================================
// SUPPORT
// ============================================================================

export function useSupportTickets(options: UseEntityOptions = {}): UseEntitiesReturn<Support> {
  const { autoLoad = true } = options;
  const [data, setData] = useState<Support[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await supportService.getAll();

      if (response.success && response.data) {
        setData(response.data);
        options.onSuccess?.(response.data);
      } else {
        const errorMsg = response.error || 'Erreur lors du chargement';
        setError(errorMsg);
        options.onError?.(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMsg);
      options.onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoLoad && !loadedRef.current) {
      loadedRef.current = true;
      refresh();
    }
  }, []);

  return { data, loading, error, refresh };
}

export function useSupportTicket(id: string): UseEntityReturn<Support> {
  const [data, setData] = useState<Support | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await supportService.getById(id);
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error || 'Ticket non trouvé');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      refresh();
    }
  }, []);

  return { data, loading, error, refresh };
}

// Actions pour Support
export function useSupportActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assign = async (ticketId: string, adminId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await supportService.assign(ticketId, adminId);
      if (!response.success) {
        setError(response.error || 'Échec de l\'assignation');
      }
      return response;
    } finally {
      setLoading(false);
    }
  };

  const resolve = async (ticketId: string, resolution: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await supportService.resolve(ticketId, resolution);
      if (!response.success) {
        setError(response.error || 'Échec de la résolution');
      }
      return response;
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (ticketId: string, status: Support['status']) => {
    setLoading(true);
    setError(null);
    try {
      const response = await supportService.updateStatus(ticketId, status);
      if (!response.success) {
        setError(response.error || 'Échec de la mise à jour du statut');
      }
      return response;
    } finally {
      setLoading(false);
    }
  };

  const updatePriority = async (ticketId: string, priority: Support['priority']) => {
    setLoading(true);
    setError(null);
    try {
      const response = await supportService.updatePriority(ticketId, priority);
      if (!response.success) {
        setError(response.error || 'Échec de la mise à jour de la priorité');
      }
      return response;
    } finally {
      setLoading(false);
    }
  };

  const addReply = async (ticketId: string, reply: { authorId: string; authorName: string; authorRole: 'admin' | 'user'; message: string }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await supportService.addReply(ticketId, reply);
      if (!response.success) {
        setError(response.error || 'Échec de l\'envoi du message');
      }
      return response;
    } finally {
      setLoading(false);
    }
  };

  return { assign, resolve, updateStatus, updatePriority, addReply, loading, error };
}

// ============================================================================
// AUTRES ENTITÉS (PATTERN SIMPLIFIÉ)
// ============================================================================

export function useIncidents(options: UseEntityOptions = {}): UseEntitiesReturn<Incident> {
  const { autoLoad = true } = options;
  const [data, setData] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await incidentsService.getAll();

      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error || 'Erreur lors du chargement');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoLoad && !loadedRef.current) {
      loadedRef.current = true;
      refresh();
    }
  }, []);

  return { data, loading, error, refresh };
}

export function useIncidentActions() {
  return {
    updateStatus: async (id: string, status: 'open' | 'in-progress' | 'resolved') => {
      return await incidentsService.updateStatus(id, status);
    },
    resolve: async (id: string, resolvedBy: string, resolvedByName: string) => {
      return await incidentsService.resolve(id, resolvedBy, resolvedByName);
    },
    updateSeverity: async (id: string, severity: 'low' | 'medium' | 'high' | 'critical') => {
      return await incidentsService.updateSeverity(id, severity);
    },
    notifyPassengers: async (
      incidentId: string,
      payload: {
        notificationType: 'delay' | 'cancellation' | 'info' | 'update' | 'resolution';
        message: string;
        channels: ('push' | 'sms')[];
      }
    ) => {
      return await incidentsService.notifyPassengers(incidentId, payload);
    },
  };
}

export function useStories(options: UseEntityOptions = {}): UseEntitiesReturn<Story> {
  const { autoLoad = true } = options;
  const [data, setData] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await storiesService.getAll();

      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error || 'Erreur lors du chargement');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoLoad && !loadedRef.current) {
      loadedRef.current = true;
      refresh();
    }
  }, []);

  return { data, loading, error, refresh };
}

export function useStoryActions() {
  const [loading, setLoading] = useState(false);

  const create = async (data: Partial<Story>) => {
    setLoading(true);
    try { return await storiesService.create(data); }
    finally { setLoading(false); }
  };

  const update = async (id: string, data: Partial<Story>) => {
    setLoading(true);
    try { return await storiesService.update(id, data); }
    finally { setLoading(false); }
  };

  const publish = async (id: string) => {
    setLoading(true);
    try { return await storiesService.publish(id); }
    finally { setLoading(false); }
  };

  const archive = async (id: string) => {
    setLoading(true);
    try { return await storiesService.archive(id); }
    finally { setLoading(false); }
  };

  const remove = async (id: string) => {
    setLoading(true);
    try { return await storiesService.delete(id); }
    finally { setLoading(false); }
  };

  return { create, update, publish, archive, remove, loading };
}

export function useStoryCircles(options: UseEntityOptions = {}): UseEntitiesReturn<StoryCircle> {
  const { autoLoad = true } = options;
  const [data, setData] = useState<StoryCircle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await storyCirclesService.getAll();
      if (response.success && response.data) setData(response.data);
      else setError(response.error || 'Erreur');
    } catch (err) { setError(err instanceof Error ? err.message : 'Erreur'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (autoLoad && !loadedRef.current) { loadedRef.current = true; refresh(); }
  }, []);

  return { data, loading, error, refresh };
}

export function useStoryCircleActions() {
  const [loading, setLoading] = useState(false);

  const create = async (data: Partial<StoryCircle>) => {
    setLoading(true);
    try { return await storyCirclesService.create(data); }
    finally { setLoading(false); }
  };

  const update = async (id: string, data: Partial<StoryCircle>) => {
    setLoading(true);
    try { return await storyCirclesService.update(id, data); }
    finally { setLoading(false); }
  };

  const remove = async (id: string) => {
    setLoading(true);
    try { return await storyCirclesService.delete(id); }
    finally { setLoading(false); }
  };

  return { create, update, remove, loading };
}

export function useAuditLogs(limit?: number, options: UseEntityOptions = {}): UseEntitiesReturn<AuditLog> {
  const { autoLoad = true } = options;
  const [data, setData] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await auditLogsService.getAll(limit);

      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error || 'Erreur lors du chargement');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoLoad && !loadedRef.current) {
      loadedRef.current = true;
      refresh();
    }
  }, []);

  return { data, loading, error, refresh };
}

export function useNotifications(options: UseEntityOptions = {}): UseEntitiesReturn<Notification> {
  const { autoLoad = true } = options;
  const [data, setData] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await notificationsService.getAll();

      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error || 'Erreur lors du chargement');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoLoad && !loadedRef.current) {
      loadedRef.current = true;
      refresh();
    }
  }, []);

  return { data, loading, error, refresh };
}

// Actions pour Notifications
export function useNotificationActions() {
  const [loading, setLoading] = useState(false);

  const markAsRead = async (id: string) => {
    setLoading(true);
    try {
      const response = await notificationsService.markAsRead(id);
      return response;
    } finally {
      setLoading(false);
    }
  };

  return { markAsRead, loading };
}

// ============================================================================
// ADVERTISEMENTS
// ============================================================================

export function useAdvertisements(options: UseEntityOptions = {}): UseEntitiesReturn<Advertisement> {
  const { autoLoad = true } = options;
  const [data, setData] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await advertisementsService.getAll();

      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error || 'Erreur lors du chargement');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoLoad && !loadedRef.current) {
      loadedRef.current = true;
      refresh();
    }
  }, []);

  return { data, loading, error, refresh };
}

export function useAdvertisementActions() {
  const [loading, setLoading] = useState(false);

  const update = async (id: string, data: Partial<Advertisement>) => {
    setLoading(true);
    try {
      const response = await advertisementsService.update(id, data);
      return response;
    } finally {
      setLoading(false);
    }
  };

  const create = async (data: Partial<Advertisement>) => {
    setLoading(true);
    try {
      const response = await advertisementsService.create(data);
      return response;
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    setLoading(true);
    try {
      const response = await advertisementsService.delete(id);
      return response;
    } finally {
      setLoading(false);
    }
  };

  return { update, create, remove, loading };
}

// ============================================================================
// REVIEWS
// ============================================================================

export function useReviews(options: UseEntityOptions = {}): UseEntitiesReturn<Review> {
  const { autoLoad = true } = options;
  const [data, setData] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await reviewsService.getAll();

      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error || 'Erreur lors du chargement');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoLoad && !loadedRef.current) {
      loadedRef.current = true;
      refresh();
    }
  }, []);

  return { data, loading, error, refresh };
}

export function useReview(id: string): UseEntityReturn<Review> {
  const [data, setData] = useState<Review | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await reviewsService.getById(id);
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error || 'Avis non trouvé');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      refresh();
    }
  }, []);

  return { data, loading, error, refresh };
}

// Actions pour Reviews (lecture seule + suppression)
export function useReviewActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await reviewsService.delete(id);
      if (!response.success) {
        setError(response.error || 'Échec de la suppression');
      }
      return response;
    } finally {
      setLoading(false);
    }
  };

  return { remove, loading, error };
}

// ============================================================================
// USER SESSIONS
// ============================================================================

export function useUserSessions(options: UseEntityOptions = {}): UseEntitiesReturn<UserSession> {
  const { autoLoad = true } = options;
  const [data, setData] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await userSessionsService.getAll();

      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error || 'Erreur lors du chargement');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoLoad && !loadedRef.current) {
      loadedRef.current = true;
      refresh();
    }
  }, []);

  return { data, loading, error, refresh };
}

export function useUserSession(id: string): UseEntityReturn<UserSession> {
  const [data, setData] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await userSessionsService.getById(id);
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error || 'Session utilisateur non trouvée');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      refresh();
    }
  }, []);

  return { data, loading, error, refresh };
}

// Actions pour UserSessions
export function useUserSessionActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const terminate = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await userSessionsService.terminate(id);
      if (!response.success) {
        setError(response.error || 'Échec de la terminaison');
      }
      return response;
    } finally {
      setLoading(false);
    }
  };

  return { terminate, loading, error };
}

// ============================================================================
// OPERATOR POLICIES
// ============================================================================

export function useOperatorPolicies(options: UseEntityOptions = {}): UseEntitiesReturn<OperatorPolicy> {
  const { autoLoad = true } = options;
  const [data, setData] = useState<OperatorPolicy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await operatorPoliciesService.getAll();

      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error || 'Erreur lors du chargement');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoLoad && !loadedRef.current) {
      loadedRef.current = true;
      refresh();
    }
  }, []);

  return { data, loading, error, refresh };
}

export function useOperatorPolicy(id: string): UseEntityReturn<OperatorPolicy> {
  const [data, setData] = useState<OperatorPolicy | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await operatorPoliciesService.getById(id);
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error || 'Politique opérateur non trouvée');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      refresh();
    }
  }, []);

  return { data, loading, error, refresh };
}

// Actions pour OperatorPolicies
export function useOperatorPolicyActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (data: Partial<OperatorPolicy>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await operatorPoliciesService.create(data);
      if (!response.success) {
        setError(response.error || 'Échec de la création');
      }
      return response;
    } finally {
      setLoading(false);
    }
  };

  const update = async (id: string, data: Partial<OperatorPolicy>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await operatorPoliciesService.update(id, data);
      if (!response.success) {
        setError(response.error || 'Échec de la mise à jour');
      }
      return response;
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await operatorPoliciesService.delete(id);
      if (!response.success) {
        setError(response.error || 'Échec de la suppression');
      }
      return response;
    } finally {
      setLoading(false);
    }
  };

  return { create, update, remove, loading, error };
}

// ============================================================================
// OPERATOR SERVICES
// ============================================================================

export function useOperatorServices(options: UseEntityOptions = {}): UseEntitiesReturn<OperatorService> {
  const { autoLoad = true } = options;
  const [data, setData] = useState<OperatorService[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await operatorServicesService.getAll();

      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error || 'Erreur lors du chargement');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoLoad && !loadedRef.current) {
      loadedRef.current = true;
      refresh();
    }
  }, []);

  return { data, loading, error, refresh };
}

export function useOperatorService(id: string): UseEntityReturn<OperatorService> {
  const [data, setData] = useState<OperatorService | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await operatorServicesService.getById(id);
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error || 'Service opérateur non trouvé');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      refresh();
    }
  }, []);

  return { data, loading, error, refresh };
}

// Actions pour OperatorServices
export function useOperatorServiceActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (data: Partial<OperatorService>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await operatorServicesService.create(data);
      if (!response.success) {
        setError(response.error || 'Échec de la création');
      }
      return response;
    } finally {
      setLoading(false);
    }
  };

  const update = async (id: string, data: Partial<OperatorService>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await operatorServicesService.update(id, data);
      if (!response.success) {
        setError(response.error || 'Échec de la mise à jour');
      }
      return response;
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await operatorServicesService.delete(id);
      if (!response.success) {
        setError(response.error || 'Échec de la suppression');
      }
      return response;
    } finally {
      setLoading(false);
    }
  };

  return { create, update, remove, loading, error };
}

// ============================================================================
// INTEGRATIONS
// ============================================================================

export function useIntegrations(options: UseEntityOptions = {}): UseEntitiesReturn<Integration> {
  const { autoLoad = true } = options;
  const [data, setData] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await integrationsService.getAll();

      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error || 'Erreur lors du chargement');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoLoad && !loadedRef.current) {
      loadedRef.current = true;
      refresh();
    }
  }, []);

  return { data, loading, error, refresh };
}

export function useIntegration(id: string): UseEntityReturn<Integration> {
  const [data, setData] = useState<Integration | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await integrationsService.getById(id);
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error || 'Intégration non trouvée');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      refresh();
    }
  }, []);

  return { data, loading, error, refresh };
}

// Actions pour Integrations
export function useIntegrationActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleStatus = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await integrationsService.toggleStatus(id);
      if (!response.success) {
        setError(response.error || 'Échec du changement de statut');
      }
      return response;
    } finally {
      setLoading(false);
    }
  };

  const create = async (data: Partial<Integration>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await integrationsService.create(data);
      if (!response.success) {
        setError(response.error || 'Échec de la création');
      }
      return response;
    } finally {
      setLoading(false);
    }
  };

  const update = async (id: string, data: Partial<Integration>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await integrationsService.update(id, data);
      if (!response.success) {
        setError(response.error || 'Échec de la mise à jour');
      }
      return response;
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await integrationsService.delete(id);
      if (!response.success) {
        setError(response.error || 'Échec de la suppression');
      }
      return response;
    } finally {
      setLoading(false);
    }
  };

  return { toggleStatus, create, update, remove, loading, error };
}

// ============================================================================
// FEATURE FLAGS
// ============================================================================

export function useFeatureFlags(options: UseEntityOptions = {}): UseEntitiesReturn<FeatureFlag> {
  const { autoLoad = true } = options;
  const [data, setData] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await featureFlagsService.getAll();

      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error || 'Erreur lors du chargement');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoLoad && !loadedRef.current) {
      loadedRef.current = true;
      refresh();
    }
  }, []);

  return { data, loading, error, refresh };
}

export function useFeatureFlag(id: string): UseEntityReturn<FeatureFlag> {
  const [data, setData] = useState<FeatureFlag | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await featureFlagsService.getById(id);
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error || 'Drapeau de fonctionnalité non trouvé');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      refresh();
    }
  }, []);

  return { data, loading, error, refresh };
}

// Actions pour FeatureFlags
export function useFeatureFlagActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await featureFlagsService.toggle(id);
      if (!response.success) {
        setError(response.error || 'Échec du basculement');
      }
      return response;
    } finally {
      setLoading(false);
    }
  };

  const create = async (data: Partial<FeatureFlag>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await featureFlagsService.create(data);
      if (!response.success) {
        setError(response.error || 'Échec de la création');
      }
      return response;
    } finally {
      setLoading(false);
    }
  };

  const update = async (id: string, data: Partial<FeatureFlag>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await featureFlagsService.update(id, data);
      if (!response.success) {
        setError(response.error || 'Échec de la mise à jour');
      }
      return response;
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await featureFlagsService.delete(id);
      if (!response.success) {
        setError(response.error || 'Échec de la suppression');
      }
      return response;
    } finally {
      setLoading(false);
    }
  };

  return { toggle, create, update, remove, loading, error };
}