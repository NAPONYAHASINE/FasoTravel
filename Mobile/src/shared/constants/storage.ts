/**
 * 📦 LOCALSTORAGE KEYS - PARTAGÉ MOBILE & SOCIETE
 * 
 * Clés standardisées pour localStorage
 * ✅ Utilisées par Mobile ET Societe
 */

// ============================================
// AUTHENTICATION
// ============================================

/** Token d'authentification JWT */
export const STORAGE_AUTH_TOKEN = 'auth_token' as const;

/** Token de refresh */
export const STORAGE_REFRESH_TOKEN = 'refresh_token' as const;

/** Utilisateur actuellement connecté */
export const STORAGE_CURRENT_USER = 'auth_user' as const;

/** Expiration du token */
export const STORAGE_TOKEN_EXPIRES_AT = 'token_expires_at' as const;

// ============================================
// TICKETS & BOOKINGS
// ============================================

/** Cache des tickets de l'utilisateur */
export const STORAGE_USER_TICKETS = 'user_tickets' as const;

/** Cache des détails d'un ticket */
export const STORAGE_TICKET_DETAIL = (id: string) => `ticket_${id}` as const;

// ============================================
// TRIPS & SEARCH
// ============================================

/** Cache des trajets trouvés */
export const STORAGE_SEARCH_RESULTS = 'search_results' as const;

/** Cache des trajets mock */
export const STORAGE_MOCK_TRIPS = 'mock_trips' as const;

// ============================================
// OPERATORS DATA (Societe)
// ============================================

/** Cache des managers */
export const STORAGE_MANAGERS = 'managers' as const;

/** Cache des cashiers */
export const STORAGE_CASHIERS = 'cashiers' as const;

/** Cache des routes */
export const STORAGE_ROUTES = 'routes' as const;

/** Cache des schedules */
export const STORAGE_SCHEDULES = 'schedules' as const;

// ============================================
// UI STATE
// ============================================

/** Dernière recherche effectuée */
export const STORAGE_LAST_SEARCH = 'last_search' as const;

/** Préférences utilisateur */
export const STORAGE_USER_PREFERENCES = 'user_preferences' as const;

/** Offline mode flag */
export const STORAGE_OFFLINE_MODE = 'offline_mode' as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Efface TOUT le localStorage (logout)
 */
export const clearAllStorage = (): void => {
  localStorage.clear();
};

/**
 * Efface juste les données d'authentification
 */
export const clearAuthStorage = (): void => {
  localStorage.removeItem(STORAGE_AUTH_TOKEN);
  localStorage.removeItem(STORAGE_REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_CURRENT_USER);
  localStorage.removeItem(STORAGE_TOKEN_EXPIRES_AT);
};

/**
 * Vérifie si l'utilisateur est connecté
 */
export const hasAuthToken = (): boolean => {
  return !!localStorage.getItem(STORAGE_AUTH_TOKEN);
};
