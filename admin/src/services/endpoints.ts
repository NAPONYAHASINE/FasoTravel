/**
 * ENDPOINTS API - Tous les endpoints définis en un seul endroit (ZÉRO DUPLICATION)
 * Toutes les URLs sont générées par des fonctions pour éviter les string templates dupliqués
 */

// Helper pour construire des query params
export function buildQueryParams(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

// ENDPOINTS - Tous centralisés ici
export const ENDPOINTS = {
  // Authentication
  auth: {
    login: () => '/auth/login',
    logout: () => '/auth/logout',
    refresh: () => '/auth/refresh',
    me: () => '/auth/me',
    resetPassword: () => '/auth/reset-password',
  },

  // Operators (Sociétés de transport)
  operators: {
    list: (params?: { page?: number; limit?: number; status?: string }) =>
      `/operators${params ? buildQueryParams(params) : ''}`,
    get: (id: string) => `/operators/${id}`,
    create: () => '/operators',
    update: (id: string) => `/operators/${id}`,
    delete: (id: string) => `/operators/${id}`,
    toggleStatus: (id: string) => `/operators/${id}/toggle-status`,
    stats: (id: string) => `/operators/${id}/stats`,
  },

  // Stations (Gares)
  stations: {
    list: (params?: { page?: number; limit?: number; city?: string }) =>
      `/stations${params ? buildQueryParams(params) : ''}`,
    get: (id: string) => `/stations/${id}`,
    create: () => '/stations',
    update: (id: string) => `/stations/${id}`,
    delete: (id: string) => `/stations/${id}`,
    stats: (id: string) => `/stations/${id}/stats`,
  },

  // Users (Utilisateurs)
  users: {
    list: (params?: { page?: number; limit?: number; role?: string }) =>
      `/users${params ? buildQueryParams(params) : ''}`,
    get: (id: string) => `/users/${id}`,
    create: () => '/users',
    update: (id: string) => `/users/${id}`,
    delete: (id: string) => `/users/${id}`,
    block: (id: string) => `/users/${id}/block`,
    unblock: (id: string) => `/users/${id}/unblock`,
  },

  // Bookings (Réservations)
  bookings: {
    list: (params?: { page?: number; limit?: number; status?: string }) =>
      `/bookings${params ? buildQueryParams(params) : ''}`,
    get: (id: string) => `/bookings/${id}`,
    update: (id: string) => `/bookings/${id}`,
    cancel: (id: string) => `/bookings/${id}/cancel`,
    confirm: (id: string) => `/bookings/${id}/confirm`,
  },

  // Trips (Trajets)
  trips: {
    list: (params?: { page?: number; limit?: number; operatorId?: string }) =>
      `/trips${params ? buildQueryParams(params) : ''}`,
    get: (id: string) => `/trips/${id}`,
    create: () => '/trips',
    update: (id: string) => `/trips/${id}`,
    delete: (id: string) => `/trips/${id}`,
    cancel: (id: string) => `/trips/${id}/cancel`,
  },

  // Payments (Paiements)
  payments: {
    list: (params?: { page?: number; limit?: number; status?: string }) =>
      `/payments${params ? buildQueryParams(params) : ''}`,
    get: (id: string) => `/payments/${id}`,
    refund: (id: string) => `/payments/${id}/refund`,
    stats: () => '/payments/stats',
  },

  // Incidents
  incidents: {
    list: (params?: { page?: number; limit?: number; status?: string }) =>
      `/incidents${params ? buildQueryParams(params) : ''}`,
    get: (id: string) => `/incidents/${id}`,
    create: () => '/incidents',
    update: (id: string) => `/incidents/${id}`,
    resolve: (id: string) => `/incidents/${id}/resolve`,
    assignTo: (id: string) => `/incidents/${id}/assign`,
  },

  // Support Tickets
  tickets: {
    list: (params?: { page?: number; limit?: number; status?: string }) =>
      `/tickets${params ? buildQueryParams(params) : ''}`,
    get: (id: string) => `/tickets/${id}`,
    create: () => '/tickets',
    update: (id: string) => `/tickets/${id}`,
    close: (id: string) => `/tickets/${id}/close`,
    addMessage: (id: string) => `/tickets/${id}/messages`,
  },

  // Reviews (Avis)
  reviews: {
    list: (params?: { page?: number; limit?: number; operatorId?: string }) =>
      `/reviews${params ? buildQueryParams(params) : ''}`,
    get: (id: string) => `/reviews/${id}`,
    moderate: (id: string) => `/reviews/${id}/moderate`,
    delete: (id: string) => `/reviews/${id}`,
  },

  // Promotions
  promotions: {
    list: (params?: { page?: number; limit?: number; status?: string }) =>
      `/promotions${params ? buildQueryParams(params) : ''}`,
    get: (id: string) => `/promotions/${id}`,
    create: () => '/promotions',
    update: (id: string) => `/promotions/${id}`,
    delete: (id: string) => `/promotions/${id}`,
    toggle: (id: string) => `/promotions/${id}/toggle`,
  },

  // Advertising (Publicités)
  ads: {
    list: (params?: { page?: number; limit?: number; status?: string }) =>
      `/ads${params ? buildQueryParams(params) : ''}`,
    get: (id: string) => `/ads/${id}`,
    create: () => '/ads',
    update: (id: string) => `/ads/${id}`,
    delete: (id: string) => `/ads/${id}`,
    stats: (id: string) => `/ads/${id}/stats`,
  },

  // Integrations
  integrations: {
    list: () => '/integrations',
    get: (id: string) => `/integrations/${id}`,
    update: (id: string) => `/integrations/${id}`,
    testConnection: (id: string) => `/integrations/${id}/test`,
  },

  // WhatsApp Business (OTP & Messages)
  whatsapp: {
    account: () => '/whatsapp/account',
    testMessage: () => '/whatsapp/test-message',
    health: () => '/whatsapp/health',
    deliveryStats: () => '/whatsapp/delivery-stats',
  },

  // AWS (S3 + CloudFront + Lightsail)
  aws: {
    health: () => '/aws/health',
    s3Stats: () => '/aws/s3/stats',
    cdnStats: () => '/aws/cloudfront/stats',
    lightsailMetrics: () => '/aws/lightsail/metrics',
    purgeCdn: () => '/aws/cloudfront/purge',
    restartInstance: () => '/aws/lightsail/restart',
  },

  // Integration Alerts
  alerts: {
    rules: () => '/alerts/rules',
    createRule: () => '/alerts/rules',
    toggleRule: (id: string) => `/alerts/rules/${id}/toggle`,
    deleteRule: (id: string) => `/alerts/rules/${id}`,
    list: () => '/alerts',
    acknowledge: (id: string) => `/alerts/${id}/acknowledge`,
    activeCount: () => '/alerts/active-count',
  },

  // System Logs / Audit Logs
  logs: {
    list: (params?: { page?: number; limit?: number; level?: string; category?: string; search?: string; source?: string; severity?: string; entityType?: string; userId?: string; dateRange?: string }) =>
      `/logs${params ? buildQueryParams(params) : ''}`,
    get: (id: string) => `/logs/${id}`,
    stats: (params?: { dateRange?: string }) =>
      `/logs/stats${params ? buildQueryParams(params) : ''}`,
    export: (params?: { startDate?: string; endDate?: string; format?: string }) =>
      `/logs/export${params ? buildQueryParams(params) : ''}`,
  },

  // Dashboard & Analytics
  dashboard: {
    overview: () => '/dashboard/overview',
    stats: () => '/dashboard/stats',
    recentActivity: () => '/dashboard/recent-activity',
    realTimeMap: () => '/dashboard/realtime-map',
  },

  // Notifications
  notifications: {
    list: (params?: { page?: number; limit?: number; read?: boolean }) =>
      `/notifications${params ? buildQueryParams(params) : ''}`,
    markAsRead: (id: string) => `/notifications/${id}/read`,
    markAllAsRead: () => '/notifications/read-all',
    delete: (id: string) => `/notifications/${id}`,
  },

  // Settings
  settings: {
    get: () => '/settings',
    update: () => '/settings',
    uploadLogo: () => '/settings/logo',
    exportData: (format: string) => `/settings/export?format=${format}`,
    importData: () => '/settings/import',
  },

  // Admin Security (Settings > Security tab)
  security: {
    profile: () => '/admin/security/profile',
    changePassword: () => '/admin/security/change-password',
    enable2FA: () => '/admin/security/2fa/enable',
    verify2FA: () => '/admin/security/2fa/verify',
    disable2FA: () => '/admin/security/2fa/disable',
    activeSessions: () => '/admin/security/sessions',
    revokeSession: (id: string) => `/admin/security/sessions/${id}/revoke`,
    revokeAllOtherSessions: () => '/admin/security/sessions/revoke-others',
    securityEvents: (params?: { page?: number; limit?: number }) =>
      `/admin/security/events${params ? buildQueryParams(params) : ''}`,
  },

  // Sessions (User Session Management)
  sessions: {
    list: (params?: { page?: number; limit?: number; deviceType?: string; userType?: string; active?: boolean; search?: string }) =>
      `/sessions${params ? buildQueryParams(params) : ''}`,
    get: (id: string) => `/sessions/${id}`,
    stats: () => '/sessions/stats',
    terminate: (id: string) => `/sessions/${id}/terminate`,
    terminateBulk: () => '/sessions/terminate-bulk',
    terminateByUser: (userId: string) => `/sessions/user/${userId}/terminate`,
    terminateSuspicious: () => '/sessions/terminate-suspicious',
    blockIp: () => '/sessions/block-ip',
    blockedIps: () => '/sessions/blocked-ips',
    unblockIp: (ip: string) => `/sessions/blocked-ips/${encodeURIComponent(ip)}`,
    export: (params?: { format?: string; deviceType?: string; userType?: string; active?: boolean }) =>
      `/sessions/export${params ? buildQueryParams(params) : ''}`,
  },

  // Policies (Politiques & Conditions)
  policies: {
    // Operator policies (company + platform rules)
    operatorList: (params?: { page?: number; limit?: number; source?: string; companyId?: string; type?: string; compliance?: string }) =>
      `/policies/operator${params ? buildQueryParams(params) : ''}`,
    operatorGet: (id: string) => `/policies/operator/${id}`,
    operatorCreate: () => '/policies/operator',
    operatorUpdate: (id: string) => `/policies/operator/${id}`,
    operatorDelete: (id: string) => `/policies/operator/${id}`,
    operatorToggleStatus: (id: string) => `/policies/operator/${id}/toggle-status`,
    operatorUpdateCompliance: (id: string) => `/policies/operator/${id}/compliance`,
    // Platform policies (CGU, Confidentialité, pages légales)
    platformList: (params?: { page?: number; limit?: number; status?: string; type?: string; scope?: string }) =>
      `/policies/platform${params ? buildQueryParams(params) : ''}`,
    platformGet: (id: string) => `/policies/platform/${id}`,
    platformCreate: () => '/policies/platform',
    platformUpdate: (id: string) => `/policies/platform/${id}`,
    platformDelete: (id: string) => `/policies/platform/${id}`,
    platformPublish: (id: string) => `/policies/platform/${id}/publish`,
    platformArchive: (id: string) => `/policies/platform/${id}/archive`,
  },

  // Referrals (Parrainage)
  referrals: {
    list: (params?: { page?: number; limit?: number; status?: string }) =>
      `/admin/referrals${params ? buildQueryParams(params) : ''}`,
    get: (id: string) => `/admin/referrals/${id}`,
    stats: () => '/admin/referrals/stats',
    config: () => '/admin/referrals/config',
    coupons: (params?: { page?: number; limit?: number; status?: string }) =>
      `/admin/referrals/coupons${params ? buildQueryParams(params) : ''}`,
    userReferrals: (userId: string) => `/admin/referrals/user/${userId}`,
  },
} as const;

export type Endpoints = typeof ENDPOINTS;