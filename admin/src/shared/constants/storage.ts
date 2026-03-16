/**
 * 📦 LOCALSTORAGE KEYS - Admin Application
 * 
 * Clés standardisées pour localStorage
 * ✅ Alignées avec Mobile & Societe
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
// ADMIN-SPECIFIC
// ============================================

/** Mode application (mock/production) */
export const STORAGE_APP_MODE = 'app_mode' as const;

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
