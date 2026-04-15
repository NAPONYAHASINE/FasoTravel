/**
 * ADMIN MOCK DATA - Données de test pour l'application Admin
 * Vue superviseur de tout l'écosystème FasoTravel
 * 
 * IMPORTANT: Ces données représentent l'écosystème COMPLET :
 * - Plusieurs sociétés de transport
 * - Passagers de l'app mobile
 * - Utilisateurs opérateurs des sociétés
 * - Gares/stations globales
 * - Trajets multi-sociétés
 */

import {
  TransportCompany,
  PassengerUser,
  AdminUser,
  OperatorUser,
  Station,
  Trip,
  Ticket,
  Incident,
  Story,
  StoryCircle,
  Review,
  Support,
  AuditLog,
  DashboardStats,
  Notification,
  Payment,
  RevenueStats,
  Integration,
  FeatureFlag,
  Advertisement,
  Promotion,
  PromotionStats,
  UserSession,
  OperatorPolicy,
  OperatorService,
  TicketStats,
  UserStats,
  BookingStats,
  AutomationRule,
  SentCampaign,
  NotifTemplate,
  ScheduledNotification,
  NotifStats,
  AudienceSegment,
  ChannelStat,
  WeeklyNotifStat,
  PlatformPolicy,
  AdminActiveSession,
  SecurityEvent,
  IntegrationAlertRule,
  IntegrationAlert,
  WhatsAppAccountInfo,
  PaydunyaChannelStats,
  PaydunyaWebhookLog,
  PaydunyaHealthStatus,
  AwsHealthReport,
  Referral,
  ReferralCoupon,
  ReferralStats,
} from '../shared/types/standardized';

// ==================== TRANSPORT COMPANIES ====================
// Les sociétés de transport qui utilisent l'app Société

export const MOCK_TRANSPORT_COMPANIES: TransportCompany[] = [
  {
    id: 'company_001',
    name: 'TSR Transport',
    legalName: 'Transport et Services Routiers SA',
    logo: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=200',
    email: 'contact@tsr.bf',
    phone: '+22625123456',
    registrationNumber: 'BF-2018-TSR-001',
    taxId: 'IFU00123456',
    address: 'Avenue Kwame Nkrumah, Ouagadougou',
    commission: 5,
    status: 'active',
    amenities: ['wifi', 'coffee', 'ac', 'usb', 'toilet', 'tv'],
    contactPersonName: 'Amadou Ouédraogo',
    contactPersonWhatsapp: '+22670111111',
    contactPersonEmail: 'admin@tsr.bf',
    totalVehicles: 45,
    totalRoutes: 12,
    totalTrips: 1247,
    rating: 4.6,
    createdAt: '2024-06-10T08:00:00Z',
    updatedAt: '2026-02-01T14:30:00Z'
  },
  {
    id: 'company_002',
    name: 'STAF Express',
    legalName: 'Société de Transport Africain Express',
    logo: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=200',
    email: 'info@staf.bf',
    phone: '+22625234567',
    registrationNumber: 'BF-2019-STAF-002',
    taxId: 'IFU00234567',
    address: 'Boulevard Tensoba, Bobo-Dioulasso',
    commission: 5,
    status: 'active',
    amenities: ['wifi', 'ac', 'usb', 'luggage'],
    contactPersonName: 'Fatima Kaboré',
    contactPersonWhatsapp: '+22671222222',
    contactPersonEmail: 'direction@staf.bf',
    totalVehicles: 32,
    totalRoutes: 8,
    totalTrips: 856,
    rating: 4.4,
    createdAt: '2024-08-15T09:00:00Z',
    updatedAt: '2026-02-01T10:15:00Z'
  },
  {
    id: 'company_003',
    name: 'Rakieta Transport',
    legalName: 'Compagnie Rakieta Transport',
    logo: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=200',
    email: 'contact@rakieta.bf',
    phone: '+22625345678',
    registrationNumber: 'BF-2020-RAK-003',
    taxId: 'IFU00345678',
    address: 'Route de Koudougou, Ouagadougou',
    commission: 5.5,
    status: 'active',
    amenities: ['ac', 'toilet', 'luggage'],
    contactPersonName: 'Ibrahim Sawadogo',
    contactPersonWhatsapp: '+22672333333',
    contactPersonEmail: 'admin@rakieta.bf',
    totalVehicles: 28,
    totalRoutes: 10,
    totalTrips: 723,
    rating: 4.3,
    createdAt: '2024-10-01T08:30:00Z',
    updatedAt: '2026-02-01T09:45:00Z'
  },
  {
    id: 'company_004',
    name: 'SOGEBAF',
    legalName: 'Société de Gestion de Bus Africains du Faso',
    logo: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=200',
    email: 'contact@sogebaf.bf',
    phone: '+22625456789',
    address: 'Avenue Charles de Gaulle, Ouagadougou',
    commission: 5,
    status: 'active',
    amenities: ['ac', 'usb'],
    contactPersonName: 'Rasmata Compaoré',
    contactPersonWhatsapp: '+22673444444',
    contactPersonEmail: 'direction@sogebaf.bf',
    totalVehicles: 15,
    totalRoutes: 5,
    totalTrips: 342,
    rating: 4.1,
    createdAt: '2026-01-25T14:00:00Z',
    updatedAt: '2026-01-25T14:00:00Z'
  }
];

// ==================== ADMIN USERS ====================
// Les administrateurs FasoTravel

export const MOCK_ADMIN_USERS: AdminUser[] = [
  {
    id: 'admin_001',
    email: 'admin@fasotravel.bf',
    name: 'Moussa Diarra',
    role: 'SUPER_ADMIN',
    status: 'active',
    mfaEnabled: true,
    lastLoginAt: '2026-02-06T08:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2026-02-06T08:00:00Z'
  },
  {
    id: 'admin_002',
    email: 'support@fasotravel.bf',
    name: 'Aminata Traoré',
    role: 'SUPPORT_ADMIN',
    status: 'active',
    mfaEnabled: false,
    lastLoginAt: '2026-02-06T07:30:00Z',
    createdAt: '2024-03-15T00:00:00Z',
    updatedAt: '2026-02-06T07:30:00Z'
  },
  {
    id: 'admin_003',
    email: 'finance@fasotravel.bf',
    name: 'Ibrahim Kaboré',
    role: 'FINANCE_ADMIN',
    status: 'active',
    mfaEnabled: true,
    lastLoginAt: '2026-02-05T16:45:00Z',
    createdAt: '2024-06-20T00:00:00Z',
    updatedAt: '2026-02-05T16:45:00Z'
  },
  {
    id: 'admin_004',
    email: 'operator.tsr@fasotravel.bf',
    name: 'Fatoumata Sawadogo',
    role: 'OPERATOR_ADMIN',
    operatorId: 'company_001',  // TSR Transport
    status: 'active',
    mfaEnabled: false,
    lastLoginAt: '2026-02-06T06:00:00Z',
    createdAt: '2024-09-10T00:00:00Z',
    updatedAt: '2026-02-06T06:00:00Z'
  },
  {
    id: 'admin_005',
    email: 'operator.staf@fasotravel.bf',
    name: 'Seydou Compaoré',
    role: 'OPERATOR_ADMIN',
    operatorId: 'company_002',  // STAF Express
    status: 'active',
    mfaEnabled: false,
    lastLoginAt: '2026-02-05T18:20:00Z',
    createdAt: '2024-10-05T00:00:00Z',
    updatedAt: '2026-02-05T18:20:00Z'
  }
];

// ==================== PASSENGER USERS ====================
// Les passagers utilisant l'app mobile

export const MOCK_PASSENGERS: PassengerUser[] = [
  {
    id: 'passenger_001',
    email: 'jean.kouame@example.com',
    name: 'Jean Kouamé',
    phone: '+22670123456',
    profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jean',
    phoneVerified: true,
    emailVerified: true,
    phoneVerifiedAt: '2025-01-16T09:00:00Z',
    emailVerifiedAt: '2025-01-16T09:05:00Z',
    lastLoginAt: '2026-02-02T07:30:00Z',
    referralCode: 'FT-226-JK01',
    referralPointsBalance: 120,
    totalReferrals: 12,
    badgeLevel: 'ambassadeur',
    status: 'active',
    createdAt: '2025-01-15T10:30:00Z',
    updatedAt: '2026-02-02T07:30:00Z'
  },
  {
    id: 'passenger_002',
    email: 'marie.traore@example.com',
    name: 'Marie Traoré',
    phone: '+22671234567',
    profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marie',
    phoneVerified: true,
    emailVerified: true,
    phoneVerifiedAt: '2025-02-21T08:00:00Z',
    emailVerifiedAt: '2025-02-21T08:10:00Z',
    lastLoginAt: '2026-02-01T18:00:00Z',
    referralCode: 'FT-226-MT02',
    referredBy: 'FT-226-JK01',
    referralPointsBalance: 50,
    totalReferrals: 5,
    badgeLevel: 'standard',
    status: 'active',
    createdAt: '2025-02-20T09:00:00Z',
    updatedAt: '2026-02-01T18:00:00Z'
  },
  {
    id: 'passenger_003',
    email: 'abdoulaye.sana@example.com',
    name: 'Abdoulaye Sana',
    phone: '+22672345678',
    phoneVerified: true,
    emailVerified: false,
    phoneVerifiedAt: '2025-03-11T10:00:00Z',
    lastLoginAt: '2026-02-01T12:45:00Z',
    referralCode: 'FT-226-AS03',
    referralPointsBalance: 260,
    totalReferrals: 26,
    badgeLevel: 'standard',
    status: 'active',
    createdAt: '2025-03-10T14:20:00Z',
    updatedAt: '2026-02-01T12:45:00Z'
  },
  {
    id: 'passenger_004',
    email: 'fatima.kabore@example.com',
    name: 'Fatima Kaboré',
    phone: '+22673456789',
    profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fatima',
    phoneVerified: true,
    emailVerified: true,
    phoneVerifiedAt: '2025-04-06T11:00:00Z',
    emailVerifiedAt: '2025-04-06T11:15:00Z',
    lastLoginAt: '2026-01-30T15:20:00Z',
    referralCode: 'FT-226-FK04',
    referredBy: 'FT-226-JK01',
    referralPointsBalance: 30,
    totalReferrals: 3,
    badgeLevel: 'standard',
    status: 'active',
    createdAt: '2025-04-05T16:30:00Z',
    updatedAt: '2026-01-30T15:20:00Z'
  },
  {
    id: 'passenger_005',
    email: 'spam.user@example.com',
    name: 'Spam User',
    phone: '+22674567890',
    phoneVerified: false,
    emailVerified: false,
    lastLoginAt: '2025-11-15T10:00:00Z',
    status: 'suspended', // Suspendu par admin
    createdAt: '2025-11-10T09:00:00Z',
    updatedAt: '2025-12-01T14:00:00Z'
  }
];

// ==================== OPERATOR USERS ====================
// Les employés des sociétés de transport

export const MOCK_OPERATOR_USERS: OperatorUser[] = [
  // TSR Transport
  {
    id: 'operator_001',
    email: 'admin@tsr.bf',
    name: 'Amadou Ouédraogo',
    role: 'responsable',
    companyId: 'company_001',
    companyName: 'TSR Transport',
    status: 'active',
    lastLoginAt: '2026-02-02T08:15:00Z',
    createdAt: '2024-06-15T10:00:00Z',
    updatedAt: '2026-02-02T08:15:00Z'
  },
  {
    id: 'operator_002',
    email: 'manager.ouaga@tsr.bf',
    name: 'Salif Ouattara',
    role: 'manager',
    companyId: 'company_001',
    companyName: 'TSR Transport',
    stationId: 'station_001',
    stationName: 'Gare Routière Ouagadougou',
    status: 'active',
    lastLoginAt: '2026-02-01T17:30:00Z',
    createdAt: '2024-07-01T09:00:00Z',
    updatedAt: '2026-02-01T17:30:00Z'
  },
  {
    id: 'operator_003',
    email: 'caisse1@tsr.bf',
    name: 'Awa Koné',
    role: 'caissier',
    companyId: 'company_001',
    companyName: 'TSR Transport',
    stationId: 'station_001',
    stationName: 'Gare Routière Ouagadougou',
    shiftStartTime: '07:00',
    shiftEndTime: '15:00',
    status: 'active',
    lastLoginAt: '2026-02-02T07:05:00Z',
    createdAt: '2024-08-10T08:00:00Z',
    updatedAt: '2026-02-02T07:05:00Z'
  },
  
  // STAF Express
  {
    id: 'operator_004',
    email: 'direction@staf.bf',
    name: 'Fatima Kaboré',
    role: 'responsable',
    companyId: 'company_002',
    companyName: 'STAF Express',
    status: 'active',
    lastLoginAt: '2026-02-01T16:45:00Z',
    createdAt: '2024-08-20T12:00:00Z',
    updatedAt: '2026-02-01T16:45:00Z'
  },
  {
    id: 'operator_005',
    email: 'manager.bobo@staf.bf',
    name: 'Issouf Konaté',
    role: 'manager',
    companyId: 'company_002',
    companyName: 'STAF Express',
    stationId: 'station_002',
    stationName: 'Gare Routière Bobo-Dioulasso',
    status: 'active',
    lastLoginAt: '2026-02-01T18:00:00Z',
    createdAt: '2024-09-05T10:00:00Z',
    updatedAt: '2026-02-01T18:00:00Z'
  },
  
  // Rakieta Transport
  {
    id: 'operator_006',
    email: 'admin@rakieta.bf',
    name: 'Ibrahim Sawadogo',
    role: 'responsable',
    companyId: 'company_003',
    companyName: 'Rakieta Transport',
    status: 'active',
    lastLoginAt: '2026-02-02T06:30:00Z',
    createdAt: '2024-10-05T11:00:00Z',
    updatedAt: '2026-02-02T06:30:00Z'
  }
];

// ==================== STATIONS ====================
// Gares routières gérées par l'Admin (infrastructure globale)

export const MOCK_STATIONS: Station[] = [
  {
    id: 'station_001',
    name: 'Gare Routière de Ouagadougou',
    city: 'Ouagadougou',
    latitude: 12.3714,
    longitude: -1.5197,
    capacity: 50,
    contactPerson: 'Moussa Compaoré',
    contactPhone: '+22625111111',
    address: 'Avenue Kwame Nkrumah',
    status: 'active',
    openingTime: '05:00',
    closingTime: '22:00',
    // 🔥 CONNEXION: 2 caissiers connectés (heartbeat récent)
    lastHeartbeat: new Date(Date.now() - 10000).toISOString(), // Il y a 10 secondes
    isConnected: true,
    activeCashiers: 2, // 2 caissiers actuellement connectés
    amenities: ['wifi', 'parking', 'restrooms', 'cafeteria', 'waiting_area'],
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2025-06-10T14:00:00Z'
  },
  {
    id: 'station_002',
    name: 'Gare Routière de Bobo-Dioulasso',
    city: 'Bobo-Dioulasso',
    latitude: 11.1771,
    longitude: -4.2898,
    capacity: 40,
    contactPerson: 'Karim Ouédraogo',
    contactPhone: '+22625222222',
    address: 'Boulevard de la Révolution',
    status: 'active',
    openingTime: '05:00',
    closingTime: '22:00',
    // 🔥 CONNEXION: 1 caissier connecté (suffit pour rester active)
    lastHeartbeat: new Date(Date.now() - 15000).toISOString(), // Il y a 15 secondes
    isConnected: true,
    activeCashiers: 1, // 1 seul caissier connecté (mais ça suffit !)
    amenities: ['parking', 'restrooms', 'cafeteria', 'waiting_area'],
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2025-05-20T10:00:00Z'
  },
  {
    id: 'station_003',
    name: 'Gare Routière de Koudougou',
    city: 'Koudougou',
    latitude: 12.2520,
    longitude: -2.3631,
    capacity: 25,
    contactPerson: 'Aminata Sana',
    contactPhone: '+22625333333',
    address: 'Route Nationale 1',
    status: 'inactive', // ⚠️ Déconnectée (AUCUN caissier connecté)
    openingTime: '06:00',
    closingTime: '20:00',
    // 🔥 CONNEXION: 0 caissiers connectés (heartbeat trop ancien)
    lastHeartbeat: new Date(Date.now() - 120000).toISOString(), // Il y a 2 minutes (> 30s)
    isConnected: false,
    activeCashiers: 0, // Aucun caissier connecté = ventes en ligne bloquées
    amenities: ['parking', 'restrooms', 'waiting_area'],
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2025-04-15T11:00:00Z'
  },
  {
    id: 'station_004',
    name: 'Gare Routière de Ouahigouya',
    city: 'Ouahigouya',
    latitude: 13.5828,
    longitude: -2.4214,
    capacity: 20,
    contactPerson: 'Zakaria Ilboudo',
    contactPhone: '+22625444444',
    address: 'Avenue de la Liberté',
    status: 'active',
    openingTime: '06:00',
    closingTime: '20:00',
    // 🔥 CONNEXION: 3 caissiers connectés (gare bien staffée)
    lastHeartbeat: new Date(Date.now() - 8000).toISOString(), // Il y a 8 secondes
    isConnected: true,
    activeCashiers: 3, // 3 caissiers actifs
    amenities: ['parking', 'restrooms'],
    createdAt: '2024-03-10T00:00:00Z',
    updatedAt: '2025-07-05T09:00:00Z'
  },
  {
    id: 'station_005',
    name: 'Gare Routière de Banfora',
    city: 'Banfora',
    latitude: 10.6339,
    longitude: -4.7600,
    capacity: 15,
    status: 'active', // 🔥 FERMÉE (hors heures d'ouverture = toujours active)
    openingTime: '06:00',
    closingTime: '19:00',
    // 🔥 CONNEXION: Gare fermée, mais 1 caissier connecté (shift de nuit ?)
    lastHeartbeat: new Date(Date.now() - 5000).toISOString(), // Il y a 5 secondes
    isConnected: true,
    activeCashiers: 1, // 1 caissier connecté
    amenities: ['parking'],
    createdAt: '2024-04-20T00:00:00Z',
    updatedAt: '2026-01-10T14:00:00Z'
  }
];

// ==================== DASHBOARD STATS ====================
// Statistiques globales de la plateforme

export const MOCK_ADMIN_DASHBOARD_STATS: DashboardStats = {
  // Sociétés
  totalCompanies: 4,
  activeCompanies: 4,
  pendingCompanies: 0,
  
  // Financier (agrégé de toutes les sociétés)
  totalRevenue: 45680000, // 45.68M FCFA
  todayRevenue: 1250000, // 1.25M FCFA
  platformCommission: 2284000, // Commission FasoTravel (5%)
  
  // Trajets (tous les opérateurs)
  activeTrips: 23,
  todayTrips: 47,
  
  // Passagers (app mobile)
  totalPassengers: 8542,
  todayPassengers: 89,
  
  // Réservations
  totalBookings: 12847,
  todayBookings: 156,
  cancelledBookings: 342,
  
  // Infrastructure
  totalStations: 5,
  totalOperatorUsers: 48,
  
  // Incidents & Santé
  pendingIncidents: 3,
  systemHealth: 97
};

// ==================== SUPPORT TICKETS ====================

export const MOCK_SUPPORT_TICKETS: Support[] = [
  {
    id: 'support_001',
    userId: 'passenger_001',
    userName: 'Jean Kouamé',
    userType: 'passenger',
    subject: 'Problème de paiement mobile money',
    message: 'Mon paiement a été débité mais je n\'ai pas reçu mon ticket',
    category: 'payment',
    priority: 'high',
    status: 'in-progress',
    assignedTo: 'admin_002',
    assignedToName: 'Aminata Traoré',
    replies: [
      {
        id: 'reply_001',
        authorId: 'admin_002',
        authorName: 'Aminata Traoré',
        authorRole: 'admin',
        message: 'Bonjour Jean, nous vérifions votre transaction. Pouvez-vous nous envoyer votre numéro de transaction mobile money ?',
        createdAt: '2026-02-01T15:00:00Z'
      },
      {
        id: 'reply_002',
        authorId: 'passenger_001',
        authorName: 'Jean Kouamé',
        authorRole: 'user',
        message: 'Oui, le numéro est TXN-2026-00458. Le débit a eu lieu à 14h25.',
        createdAt: '2026-02-01T15:30:00Z'
      }
    ],
    createdAt: '2026-02-01T14:30:00Z',
    updatedAt: '2026-02-01T16:00:00Z'
  },
  {
    id: 'support_002',
    userId: 'operator_002',
    userName: 'Salif Ouattara',
    userType: 'operator',
    companyName: 'TSR Transport',
    subject: 'Problème d\'accès à l\'application',
    message: 'Je ne peux plus me connecter depuis ce matin',
    category: 'technical',
    priority: 'urgent',
    status: 'resolved',
    assignedTo: 'admin_002',
    assignedToName: 'Aminata Traoré',
    replies: [
      {
        id: 'reply_003',
        authorId: 'admin_002',
        authorName: 'Aminata Traoré',
        authorRole: 'admin',
        message: 'Votre mot de passe a été réinitialisé. Vous recevrez un SMS avec les nouvelles informations de connexion.',
        createdAt: '2026-02-01T09:30:00Z'
      }
    ],
    resolvedAt: '2026-02-01T10:00:00Z',
    resolution: 'Réinitialisation du mot de passe effectuée',
    createdAt: '2026-02-01T08:30:00Z',
    updatedAt: '2026-02-01T10:00:00Z'
  },
  {
    id: 'support_003',
    userId: 'passenger_002',
    userName: 'Marie Traoré',
    userType: 'passenger',
    subject: 'Suggestion d\'amélioration',
    message: 'Serait-il possible d\'ajouter une option de réservation récurrente?',
    category: 'feedback',
    priority: 'low',
    status: 'open',
    replies: [],
    createdAt: '2026-02-02T07:15:00Z',
    updatedAt: '2026-02-02T07:15:00Z'
  }
];

// ==================== INCIDENTS ====================

export const MOCK_INCIDENTS: Incident[] = [
  {
    id: 'incident_001',
    tripId: 'trip_123',
    tripRoute: 'Ouagadougou → Bobo-Dioulasso',
    tripDepartureTime: '2026-02-02T08:00:00Z',
    companyId: 'company_001',
    companyName: 'TSR Transport',
    type: 'delay',
    severity: 'medium',
    title: 'Retard de 45 minutes sur Ouaga-Bobo',
    description: 'Embouteillage important à la sortie de Ouagadougou, le bus est bloqué au niveau du péage de Saaba. Les passagers ont été informés.',
    status: 'in-progress',
    reporterType: 'company',
    reportedBy: 'operator_002',
    reportedByName: 'Salif Ouattara',
    reportedByPhone: '+226 70 11 22 33',
    estimatedResolutionTime: '2026-02-02T11:00:00Z',
    impactEstimate: '1 trajet, 35 passagers affectés',
    passengersAffected: 35,
    createdAt: '2026-02-02T08:30:00Z',
    updatedAt: '2026-02-02T08:45:00Z'
  },
  {
    id: 'incident_002',
    tripId: 'trip_234',
    tripRoute: 'Banfora → Ouagadougou',
    tripDepartureTime: '2026-02-01T06:30:00Z',
    companyId: 'company_002',
    companyName: 'STAF Express',
    gareId: 'station_005',
    gareName: 'Gare Routière de Banfora',
    type: 'mechanical',
    severity: 'low',
    title: 'Panne de climatisation bus STAF',
    description: 'La climatisation du bus BF-1234-AB est en panne depuis le départ de Banfora. Les passagers se plaignent de la chaleur.',
    status: 'resolved',
    reporterType: 'passenger',
    reportedBy: 'passenger_042',
    reportedByName: 'Aminata Traoré',
    reportedByPhone: '+226 76 88 99 00',
    resolvedBy: 'admin_002',
    resolvedByName: 'Aminata Traoré',
    resolvedAt: '2026-02-01T14:00:00Z',
    impactEstimate: 'Confort réduit pour 28 passagers',
    passengersAffected: 28,
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-02-01T14:00:00Z'
  },
  {
    id: 'incident_003',
    tripId: 'trip_456',
    tripRoute: 'Ouagadougou → Ouahigouya',
    tripDepartureTime: '2026-02-01T14:00:00Z',
    companyId: 'company_003',
    companyName: 'Rakieta Transport',
    type: 'cancellation',
    severity: 'high',
    title: 'Annulation trajet Ouaga-Ouahigouya 14h',
    description: 'Problème technique majeur sur le véhicule (transmission). Les passagers ont été transférés au trajet de 16h.',
    status: 'resolved',
    reporterType: 'company',
    reportedBy: 'operator_003',
    reportedByName: 'Awa Koné',
    reportedByPhone: '+226 70 55 66 77',
    resolvedBy: 'operator_002',
    resolvedByName: 'Salif Ouattara',
    resolvedAt: '2026-02-01T13:30:00Z',
    impactEstimate: '18 passagers transférés vers trajet 16h',
    passengersAffected: 18,
    createdAt: '2026-02-01T12:45:00Z',
    updatedAt: '2026-02-01T13:30:00Z'
  },
  {
    id: 'incident_004',
    tripId: 'trip_789',
    tripRoute: 'Bobo-Dioulasso → Ouagadougou',
    tripDepartureTime: '2026-02-03T07:00:00Z',
    companyId: 'company_001',
    companyName: 'TSR Transport',
    type: 'accident',
    severity: 'critical',
    title: 'Collision mineure à Boromo',
    description: 'Le bus a été impliqué dans un accrochage avec un véhicule personnel à Boromo. Pas de blessés graves mais le bus est immobilisé en attendant le constat.',
    status: 'open',
    reporterType: 'passenger',
    reportedBy: 'passenger_015',
    reportedByName: 'Ibrahim Sawadogo',
    reportedByPhone: '+226 78 44 55 66',
    impactEstimate: 'Bus immobilisé, 42 passagers en attente',
    passengersAffected: 42,
    createdAt: '2026-02-03T09:15:00Z',
    updatedAt: '2026-02-03T09:15:00Z'
  },
  {
    id: 'incident_005',
    tripId: 'trip_321',
    tripRoute: 'Ouagadougou → Koudougou',
    tripDepartureTime: '2026-02-03T10:00:00Z',
    companyId: 'company_004',
    companyName: 'SOGEBAF',
    type: 'delay',
    severity: 'low',
    title: 'Retard de 15 min au départ de Ouaga',
    description: 'Le chauffeur est arrivé en retard à la gare. Les passagers attendent le départ.',
    status: 'open',
    reporterType: 'passenger',
    reportedBy: 'passenger_078',
    reportedByName: 'Fatou Diallo',
    reportedByPhone: '+226 71 22 33 44',
    passengersAffected: 22,
    createdAt: '2026-02-03T10:15:00Z',
    updatedAt: '2026-02-03T10:15:00Z'
  },
  {
    id: 'incident_006',
    tripId: 'trip_654',
    tripRoute: 'Ouagadougou → Fada N\'Gourma',
    tripDepartureTime: '2026-02-02T06:00:00Z',
    companyId: 'company_002',
    companyName: 'STAF Express',
    gareName: 'Gare Routière de Ouagadougou',
    type: 'other',
    severity: 'medium',
    title: 'Bagage perdu d\'un passager',
    description: 'Le passager Moussa Compaoré signale qu\'un de ses bagages n\'a pas été chargé dans la soute au départ de Ouagadougou.',
    status: 'in-progress',
    reporterType: 'passenger',
    reportedBy: 'passenger_103',
    reportedByName: 'Moussa Compaoré',
    reportedByPhone: '+226 75 33 44 55',
    impactEstimate: '1 passager, bagage en cours de localisation',
    passengersAffected: 1,
    createdAt: '2026-02-02T07:30:00Z',
    updatedAt: '2026-02-02T09:00:00Z'
  },
  {
    id: 'incident_007',
    tripId: 'trip_987',
    tripRoute: 'Bobo-Dioulasso → Banfora',
    tripDepartureTime: '2026-02-03T13:00:00Z',
    companyId: 'company_003',
    companyName: 'Rakieta Transport',
    type: 'mechanical',
    severity: 'high',
    title: 'Crevaison sur la route nationale',
    description: 'Le bus a subi une crevaison à 40 km de Banfora. Le chauffeur procède au changement de roue. Un bus de remplacement est en route.',
    status: 'open',
    reporterType: 'company',
    reportedBy: 'operator_005',
    reportedByName: 'Drissa Sanogo',
    reportedByPhone: '+226 70 99 88 77',
    estimatedResolutionTime: '2026-02-03T15:00:00Z',
    impactEstimate: 'Bus immobilisé, 30 passagers, remplacement en route',
    passengersAffected: 30,
    createdAt: '2026-02-03T14:20:00Z',
    updatedAt: '2026-02-03T14:20:00Z'
  }
];

// ==================== STORY CIRCLES (types dynamiques) ====================

export const MOCK_STORY_CIRCLES: StoryCircle[] = [
  { id: 'circle_promo', name: 'Promotions', emoji: '🔥', gradient: 'linear-gradient(135deg, #ef4444, #f97316)', color: 'red', isDefault: true, order: 1, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'circle_new', name: 'Nouveautés', emoji: '✨', gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)', color: 'blue', isDefault: true, order: 2, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'circle_dest', name: 'Destinations', emoji: '📍', gradient: 'linear-gradient(135deg, #22c55e, #10b981)', color: 'green', isDefault: true, order: 3, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'circle_ann', name: 'Annonces', emoji: '📢', gradient: 'linear-gradient(135deg, #8b5cf6, #ec4899)', color: 'purple', isDefault: true, order: 4, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
];

// ==================== STORIES ====================

export const MOCK_STORIES: Story[] = [
  {
    id: 'story_001',
    title: 'Nouvelle ligne Ouaga-Banfora',
    description: 'TSR Transport lance une nouvelle ligne directe Ouagadougou-Banfora avec départs quotidiens à 8h et 14h. Réservez dès maintenant !',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800',
    circleId: 'circle_new',
    ctaText: 'Réserver',
    actionType: 'internal',
    internalPage: 'search-results',
    status: 'published',
    publishedAt: '2026-02-01T10:00:00Z',
    createdBy: 'admin_001',
    createdByName: 'Moussa Diarra',
    viewsCount: 1247,
    clicksCount: 312,
    createdAt: '2026-02-01T09:00:00Z',
    updatedAt: '2026-02-01T10:00:00Z'
  },
  {
    id: 'story_002',
    title: '-20% sur tous les trajets ce weekend !',
    description: 'Profitez de 20% de réduction sur tous les trajets réservés via l\'app mobile ce weekend.',
    mediaType: 'gradient',
    gradient: 'linear-gradient(135deg, #EF2B2D 0%, #FCD116 50%, #009E49 100%)',
    emoji: '🎉',
    circleId: 'circle_promo',
    ctaText: 'En profiter',
    actionType: 'internal',
    internalPage: 'search-results',
    status: 'published',
    publishedAt: '2026-01-31T08:00:00Z',
    createdBy: 'admin_002',
    createdByName: 'Aminata Traoré',
    viewsCount: 3421,
    clicksCount: 876,
    createdAt: '2026-01-30T16:00:00Z',
    updatedAt: '2026-01-31T08:00:00Z'
  },
  {
    id: 'story_003',
    title: 'Découvrez Banfora',
    description: 'Les cascades de Karfiguéla, le lac de Tengrela... Banfora vous attend ! Trajets quotidiens depuis Ouaga et Bobo.',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    circleId: 'circle_dest',
    ctaText: 'Voir les trajets',
    actionType: 'internal',
    internalPage: 'search-results',
    status: 'published',
    publishedAt: '2026-02-03T07:00:00Z',
    createdBy: 'admin_001',
    createdByName: 'Moussa Diarra',
    viewsCount: 892,
    clicksCount: 145,
    createdAt: '2026-02-02T15:00:00Z',
    updatedAt: '2026-02-03T07:00:00Z'
  },
  {
    id: 'story_004',
    title: 'Maintenance prévue le 5 mars',
    description: 'Maintenance planifiée de la plateforme le 5 mars de 2h à 4h du matin. L\'app sera temporairement indisponible.',
    mediaType: 'gradient',
    gradient: 'linear-gradient(135deg, #1e3a5f 0%, #2d5986 100%)',
    emoji: '🔧',
    circleId: 'circle_ann',
    actionType: 'none',
    status: 'draft',
    createdBy: 'admin_001',
    createdByName: 'Moussa Diarra',
    viewsCount: 0,
    clicksCount: 0,
    createdAt: '2026-02-28T07:00:00Z',
    updatedAt: '2026-02-28T07:00:00Z'
  },
  {
    id: 'story_005',
    title: 'Bus climatisés sur la ligne Ouaga-Bobo',
    description: 'STAF Express équipe tous ses bus de la climatisation ! Voyagez au frais sur la ligne la plus populaire.',
    mediaType: 'video',
    mediaUrl: 'https://sample-videos.com/video321/mp4/720/bus_promo.mp4',
    circleId: 'circle_new',
    ctaText: 'Voir les bus',
    actionType: 'internal',
    internalPage: 'operators',
    status: 'published',
    publishedAt: '2026-02-20T09:00:00Z',
    createdBy: 'admin_002',
    createdByName: 'Aminata Traoré',
    viewsCount: 2103,
    clicksCount: 534,
    createdAt: '2026-02-19T14:00:00Z',
    updatedAt: '2026-02-20T09:00:00Z'
  },
  {
    id: 'story_006',
    title: 'Koudougou — La cité du cavalier rouge',
    description: 'Explorez la troisième ville du Burkina. Marché central, artisanat local et ambiance authentique.',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?w=800',
    circleId: 'circle_dest',
    ctaText: 'Réserver un trajet',
    actionType: 'internal',
    internalPage: 'search-results',
    status: 'published',
    publishedAt: '2026-02-15T10:00:00Z',
    createdBy: 'admin_001',
    createdByName: 'Moussa Diarra',
    viewsCount: 567,
    clicksCount: 89,
    createdAt: '2026-02-14T11:00:00Z',
    updatedAt: '2026-02-15T10:00:00Z'
  },
  {
    id: 'story_007',
    title: 'Soldes de fin de mois — Jusqu\'à -40%',
    description: 'Du 25 au 28 février, toutes les sociétés participent aux soldes. Jusqu\'à 40% de réduction !',
    mediaType: 'gradient',
    gradient: 'linear-gradient(135deg, #f97316 0%, #ef4444 50%, #ec4899 100%)',
    emoji: '💰',
    circleId: 'circle_promo',
    ctaText: 'Voir les offres',
    actionType: 'internal',
    internalPage: 'home',
    status: 'archived',
    publishedAt: '2026-02-25T00:00:00Z',
    expiresAt: '2026-02-28T23:59:59Z',
    createdBy: 'admin_002',
    createdByName: 'Aminata Traoré',
    viewsCount: 4820,
    clicksCount: 1230,
    createdAt: '2026-02-24T18:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z'
  }
];

// ==================== AUDIT LOGS ====================
// 
// RÉFÉRENTIEL DES ADMINS (source: MOCK_ADMIN_USERS) :
//   admin_001 = Moussa Diarra       | SUPER_ADMIN     | IP: 41.188.12.34 | Ouagadougou
//   admin_002 = Aminata Traoré      | SUPPORT_ADMIN   | IP: 41.188.23.45 | Ouagadougou
//   admin_003 = Ibrahim Kaboré      | FINANCE_ADMIN   | IP: 41.188.34.56 | Ouagadougou
//   admin_004 = Fatoumata Sawadogo  | OPERATOR_ADMIN  | company_001 (TSR Transport) | IP: 41.188.45.67 | Ouagadougou
//   admin_005 = Seydou Compaoré     | OPERATOR_ADMIN  | company_002 (STAF Express)  | IP: 41.188.56.78 | Bobo-Dioulasso
//   system    = Système             | tâches auto     | IP: 10.0.1.50 | AWS eu-west-3
//
// SOCIÉTÉS : TSR Transport (company_001), STAF Express (company_002), Rakieta Transport (company_003), SOGEBAF (company_004)
// GARES : Ouagadougou (station_001), Bobo-Dioulasso (station_002), Koudougou (station_003), Ouahigouya (station_004), Banfora (station_005)
// PASSAGERS : Jean Kouamé (passenger_001), Marie Traoré (passenger_002), Abdoulaye Sana (passenger_003), Fatima Kaboré (passenger_004), Spam User (passenger_005)
//
// OPÉRATEURS DE SOCIÉTÉ (employés des sociétés de transport) :
//   operator_001 = Salif Ouattara   | manager gare Ouagadougou  | TSR Transport  | IP: 41.188.67.89
//   operator_002 = Hamidou Sanou    | manager gare Bobo         | TSR Transport  | IP: 41.188.68.90
//   operator_003 = Abdoul Kaboré    | manager gare Bobo         | STAF Express   | IP: 41.188.78.90
//
// RÈGLES PAR RÔLE :
//   SUPER_ADMIN    → config plateforme, intégrations, feature flags, sociétés (approve/suspend/create), politiques, gares
//   SUPPORT_ADMIN  → support tickets, incidents, passagers (verify/suspend), notifications push/sms, stories
//   FINANCE_ADMIN  → paiements, remboursements, exports financiers, promotions (approve/reject), rapports
//   OPERATOR_ADMIN → actions limitées à SA société (routes, trips, véhicules), PAS de config plateforme

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  // ═══════════════════════════════════════════════════════════════════
  // 9 MARS 2026 (aujourd'hui) — 7 entrées (admin + opérateur + passager + système)
  // ═══════════════════════════════════════════════════════════════════
  { id: 'log_052', userId: 'operator_001', userName: 'Salif Ouattara', action: 'create', entityType: 'booking', entityId: 'BKG-2026-001290', details: 'OPÉRATEUR (TSR Transport, gare Ouagadougou) — Réservation guichet BKG-2026-001290 créée : passager Moussa Bamogo, Ouaga→Bobo 10/03 08h00, siège B7, 8 500 FCFA — paiement espèces au guichet', severity: 'info', category: 'operations', changes: { status: { oldValue: null, newValue: 'confirmed' }, paymentMethod: { oldValue: null, newValue: 'cash_counter' } }, ipAddress: '41.188.67.89', geoLocation: 'Ouagadougou, BF', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122', sessionId: 'sess_20260309_op1', durationMs: 1800, createdAt: '2026-03-09T08:15:00Z' },
  { id: 'log_051', userId: 'passenger_001', userName: 'Jean Kouamé', action: 'create', entityType: 'booking', entityId: 'BKG-2026-001289', details: 'PASSAGER (app mobile) — Réservation BKG-2026-001289 : Ouaga→Koudougou 10/03 14h00, Rakieta Transport, siège A2, 4 500 FCFA — paiement Orange Money', severity: 'info', category: 'operations', changes: { status: { oldValue: null, newValue: 'confirmed' }, paymentChannel: { oldValue: null, newValue: 'Orange Money' } }, ipAddress: '41.188.90.12', geoLocation: 'Ouagadougou, BF', userAgent: 'FasoTravel/2.1.0 (Android 14; Samsung Galaxy A54)', sessionId: 'sess_20260309_p001', durationMs: 3500, createdAt: '2026-03-09T07:45:00Z' },
  { id: 'log_050', userId: 'admin_001', userName: 'Moussa Diarra', action: 'login', entityType: 'session', entityId: 'sess_20260309_001', details: 'Connexion SUPER_ADMIN — dashboard admin FasoTravel depuis le bureau de Ouagadougou (MFA validé)', severity: 'info', category: 'security', ipAddress: '41.188.12.34', geoLocation: 'Ouagadougou, BF', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122', sessionId: 'sess_20260309_001', durationMs: 1200, createdAt: '2026-03-09T07:02:00Z' },
  { id: 'log_049', userId: 'system', userName: 'Système', action: 'health_check', entityType: 'integration', entityId: 'integration_paydunya', details: 'Health check PayDunya — 6/6 canaux opérationnels : Orange Money ✓, Moov Money ✓, Wave ✓, Sank Money ✓, Telecel Money ✓, Carte Bancaire ✓', severity: 'info', category: 'operations', ipAddress: '10.0.1.50', geoLocation: 'AWS eu-west-3', durationMs: 340, createdAt: '2026-03-09T06:00:00Z' },
  { id: 'log_048', userId: 'admin_002', userName: 'Aminata Traoré', action: 'bulk_send', entityType: 'notification', entityId: 'notif_campaign_042', details: 'SUPPORT_ADMIN — Campagne push envoyée à 3 420 passagers actifs : "Nouveaux horaires Ouaga-Bobo mars 2026" — canaux : push + WhatsApp Business', severity: 'info', category: 'content', changes: { audience: { oldValue: null, newValue: '3 420 passagers actifs' }, channels: { oldValue: null, newValue: 'push + WhatsApp Business' } }, ipAddress: '41.188.23.45', geoLocation: 'Ouagadougou, BF', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', sessionId: 'sess_20260309_002', durationMs: 4500, createdAt: '2026-03-09T05:30:00Z' },
  { id: 'log_047', userId: 'operator_003', userName: 'Abdoul Kaboré', action: 'update', entityType: 'company', entityId: 'company_002', details: 'OPÉRATEUR (STAF Express, gare Bobo-Dioulasso) — Validation embarquement trajet STAF Bobo→Banfora 09h00 : 42/55 passagers embarqués, 3 no-show, départ confirmé à 09h05', severity: 'info', category: 'operations', changes: { passengersBoarded: { oldValue: 0, newValue: 42 }, noShows: { oldValue: 0, newValue: 3 } }, ipAddress: '41.188.78.90', geoLocation: 'Bobo-Dioulasso, BF', userAgent: 'FasoTravel-Operator/1.3.0 (Android 13)', sessionId: 'sess_20260309_op3', durationMs: 900, createdAt: '2026-03-09T09:05:00Z' },
  { id: 'log_046', userId: 'passenger_002', userName: 'Marie Traoré', action: 'update', entityType: 'booking', entityId: 'BKG-2026-001285', details: 'PASSAGER (app mobile) — Annulation réservation BKG-2026-001285 : Ouaga→Bobo 11/03, STAF Express — remboursement 7 000 FCFA via Wave (politique 100% si > 24h avant départ)', severity: 'warning', category: 'finance', changes: { status: { oldValue: 'confirmed', newValue: 'cancelled' }, refundAmount: { oldValue: 0, newValue: 7000 }, refundChannel: { oldValue: null, newValue: 'Wave' } }, ipAddress: '41.188.91.34', geoLocation: 'Ouagadougou, BF', userAgent: 'FasoTravel/2.1.0 (iOS 17.3; iPhone 14)', sessionId: 'sess_20260309_p002', durationMs: 2200, createdAt: '2026-03-09T10:20:00Z' },

  // ═══════════════════════════════════════════════════════════════════
  // 8 MARS 2026 — 8 entrées (admin + opérateur + passager)
  // ═══════════════════════════════════════════════════════════════════
  { id: 'log_045', userId: 'operator_002', userName: 'Hamidou Sanou', action: 'update', entityType: 'ticket', entityId: 'TKT-2026-001280', details: 'OPÉRATEUR (TSR Transport, gare Bobo-Dioulasso) — Billet TKT-2026-001280 scanné à l\'embarquement : passager Aminata Diallo, Bobo→Ouaga 08h30, siège C12 — validé OK', severity: 'info', category: 'operations', changes: { ticketStatus: { oldValue: 'active', newValue: 'UTILISÉ' } }, ipAddress: '41.188.68.90', geoLocation: 'Bobo-Dioulasso, BF', userAgent: 'FasoTravel-Operator/1.3.0 (Android 13)', sessionId: 'sess_20260308_op2', durationMs: 350, createdAt: '2026-03-08T08:25:00Z' },
  { id: 'log_044', userId: 'passenger_003', userName: 'Abdoulaye Sana', action: 'create', entityType: 'support', entityId: 'support_new_001', details: 'PASSAGER (app mobile) — Nouveau ticket support : "Mon billet ne s\'affiche pas après paiement" — référence BKG-2026-001278, paiement Moov Money, montant 6 000 FCFA', severity: 'info', category: 'operations', changes: { status: { oldValue: null, newValue: 'open' }, priority: { oldValue: null, newValue: 'high' } }, ipAddress: '41.188.92.56', geoLocation: 'Koudougou, BF', userAgent: 'FasoTravel/2.1.0 (Android 12; Xiaomi Redmi Note 11)', sessionId: 'sess_20260308_p003', durationMs: 1500, createdAt: '2026-03-08T17:30:00Z' },
  { id: 'log_043', userId: 'operator_001', userName: 'Salif Ouattara', action: 'create', entityType: 'incident', entityId: 'incident_new_001', details: 'OPÉRATEUR (TSR Transport, gare Ouagadougou) — Incident signalé : retard 30min sur trajet Ouaga→Fada 14h00, cause embouteillage sortie Ouagadougou — 28 passagers à notifier', severity: 'warning', category: 'operations', changes: { type: { oldValue: null, newValue: 'delay' }, estimatedDelay: { oldValue: null, newValue: '30min' } }, ipAddress: '41.188.67.89', geoLocation: 'Ouagadougou, BF', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122', sessionId: 'sess_20260308_op1', durationMs: 600, createdAt: '2026-03-08T14:15:00Z' },
  { id: 'log_039', userId: 'admin_003', userName: 'Ibrahim Kaboré', action: 'approve', entityType: 'promotion', entityId: 'promo_002', details: 'FINANCE_ADMIN — Promotion "TSR Ouaga-Bobo -1 500 FCFA" (promo_002) approuvée — réduction fixe 1 500 FCFA, valide 15 fév-15 mars, usage max 500, marge opérateur vérifiée à 18%', severity: 'info', category: 'finance', changes: { approvalStatus: { oldValue: 'pending', newValue: 'approved' } }, ipAddress: '41.188.34.56', geoLocation: 'Ouagadougou, BF', sessionId: 'sess_20260308_003', durationMs: 800, createdAt: '2026-03-08T16:45:00Z' },
  { id: 'log_038', userId: 'admin_002', userName: 'Aminata Traoré', action: 'resolve', entityType: 'incident', entityId: 'incident_001', details: 'SUPPORT_ADMIN — Incident "Retard 45min Ouaga-Bobo" (TSR Transport, trip_123) résolu — 35 passagers notifiés par WhatsApp Business, temps de résolution 6h15', severity: 'warning', category: 'operations', changes: { status: { oldValue: 'in-progress', newValue: 'resolved' }, passengersNotified: { oldValue: 0, newValue: 35 } }, ipAddress: '41.188.23.45', geoLocation: 'Ouagadougou, BF', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', sessionId: 'sess_20260308_002', durationMs: 2100, createdAt: '2026-03-08T15:20:00Z' },
  { id: 'log_037', userId: 'admin_003', userName: 'Ibrahim Kaboré', action: 'refund', entityType: 'payment', entityId: 'payment_001', details: 'FINANCE_ADMIN — Remboursement 8 500 FCFA via Orange Money sur paiement payment_001 (passager Jean Kouamé, TSR Transport BKG-2026-001234) — motif : annulation > 24h avant départ, politique remboursement 100% appliquée', severity: 'warning', category: 'finance', changes: { status: { oldValue: 'completed', newValue: 'refunded' }, refundAmount: { oldValue: 0, newValue: 8500 } }, ipAddress: '41.188.34.56', geoLocation: 'Ouagadougou, BF', sessionId: 'sess_20260308_003', durationMs: 3200, createdAt: '2026-03-08T14:10:00Z' },
  { id: 'log_036', userId: 'admin_001', userName: 'Moussa Diarra', action: 'update', entityType: 'company', entityId: 'company_001', details: 'SUPER_ADMIN — TSR Transport : commission maintenue à 5%, ajout service bagages 2 000 FCFA, contact mis à jour (Amadou Ouédraogo, +226 70 11 11 11)', severity: 'info', category: 'config', changes: { luggagePrice: { oldValue: null, newValue: 2000 }, amenities: { oldValue: 'wifi,coffee,ac,usb,toilet,tv', newValue: 'wifi,coffee,ac,usb,toilet,tv,luggage' } }, ipAddress: '41.188.12.34', geoLocation: 'Ouagadougou, BF', sessionId: 'sess_20260308_001', durationMs: 950, createdAt: '2026-03-08T11:30:00Z' },
  { id: 'log_035', userId: 'system', userName: 'Système', action: 'alert_triggered', entityType: 'integration', entityId: 'integration_google_maps', details: 'Alerte Google Maps (billingType: usage) — quota API jour atteint à 85% (12 400/14 250 requêtes) — facturation à l\'usage, seuil d\'alerte 75% dépassé', severity: 'warning', category: 'operations', ipAddress: '10.0.1.50', geoLocation: 'AWS eu-west-3', durationMs: 50, createdAt: '2026-03-08T09:00:00Z' },

  // ═══════════════════════════════════════════════════════════════════
  // 7 MARS 2026 — 6 entrées
  // ═══════════════════════════════════════════════════════════════════
  { id: 'log_034', userId: 'admin_002', userName: 'Aminata Traoré', action: 'assign', entityType: 'support', entityId: 'support_001', details: 'SUPPORT_ADMIN — Ticket support_001 "Problème de paiement mobile money" (passager Jean Kouamé, passenger_001) : auto-assigné, priorité haute — paiement débité sans ticket reçu', severity: 'info', category: 'operations', changes: { assignedTo: { oldValue: null, newValue: 'admin_002 (Aminata Traoré)' }, priority: { oldValue: 'medium', newValue: 'high' } }, ipAddress: '41.188.23.45', geoLocation: 'Ouagadougou, BF', sessionId: 'sess_20260307_002', durationMs: 450, createdAt: '2026-03-07T17:30:00Z' },
  { id: 'log_033', userId: 'admin_001', userName: 'Moussa Diarra', action: 'toggle', entityType: 'feature_flag', entityId: 'flag_live_tracking', details: 'SUPER_ADMIN — Feature flag "Live Tracking GPS" activé — rollout progressif 50% des passagers, monitoring Google Maps + WebSocket actif', severity: 'info', category: 'config', changes: { enabled: { oldValue: false, newValue: true }, rolloutPercentage: { oldValue: 0, newValue: 50 } }, ipAddress: '41.188.12.34', geoLocation: 'Ouagadougou, BF', sessionId: 'sess_20260307_001', durationMs: 300, createdAt: '2026-03-07T16:00:00Z' },
  { id: 'log_032', userId: 'admin_002', userName: 'Aminata Traoré', action: 'publish', entityType: 'story', entityId: 'story_001', details: 'SUPPORT_ADMIN — Story "Nouvelle ligne Ouaga-Banfora" publiée dans cercle "Nouveautés" — image bus TSR, CTA "Réserver" → page recherche, créée par Moussa Diarra', severity: 'info', category: 'content', changes: { status: { oldValue: 'draft', newValue: 'published' } }, ipAddress: '41.188.23.45', geoLocation: 'Ouagadougou, BF', sessionId: 'sess_20260307_002', durationMs: 600, createdAt: '2026-03-07T14:20:00Z' },
  { id: 'log_031', userId: 'admin_001', userName: 'Moussa Diarra', action: 'config_change', entityType: 'integration', entityId: 'integration_003', details: 'SUPER_ADMIN — Configuration WhatsApp Business (billingType: usage) mise à jour — senderId changé de "FASOTRAVEL" à "FasoTravel", template message billet FASOTRAVEL_TICKET modifié avec QR code', severity: 'info', category: 'config', changes: { senderId: { oldValue: 'FASOTRAVEL', newValue: 'FasoTravel' }, templateModified: { oldValue: null, newValue: 'FASOTRAVEL_TICKET' } }, ipAddress: '41.188.12.34', geoLocation: 'Ouagadougou, BF', sessionId: 'sess_20260307_001', durationMs: 1100, createdAt: '2026-03-07T11:45:00Z' },
  { id: 'log_030', userId: 'admin_002', userName: 'Aminata Traoré', action: 'verify', entityType: 'passenger', entityId: 'passenger_003', details: 'SUPPORT_ADMIN — Vérification manuelle passager Abdoulaye Sana (passenger_003) — téléphone +226 72 34 56 78 validé par OTP WhatsApp Business, email non vérifié (pas d\'adresse confirmée)', severity: 'info', category: 'security', changes: { phoneVerified: { oldValue: false, newValue: true } }, ipAddress: '41.188.23.45', geoLocation: 'Ouagadougou, BF', sessionId: 'sess_20260307_002', durationMs: 500, createdAt: '2026-03-07T10:00:00Z' },
  { id: 'log_029', userId: 'admin_005', userName: 'Seydou Compaoré', action: 'update', entityType: 'company', entityId: 'company_002', details: 'OPERATOR_ADMIN (STAF Express) — Horaires STAF mis à jour sur l\'axe Bobo→Ouaga : départ 06h30 au lieu de 07h00, arrivée estimée 12h30 — modification limitée à company_002', severity: 'info', category: 'operations', changes: { departureTime: { oldValue: '07:00', newValue: '06:30' }, estimatedArrival: { oldValue: '13:00', newValue: '12:30' } }, ipAddress: '41.188.56.78', geoLocation: 'Bobo-Dioulasso, BF', userAgent: 'Mozilla/5.0 (Linux; Android 14; Samsung Galaxy A54)', sessionId: 'sess_20260307_005', durationMs: 750, createdAt: '2026-03-07T09:15:00Z' },

  // ═══════════════════════════════════════════════════════════════════
  // 6 MARS 2026 — 3 entrées
  // ═══════════════════════════════════════════════════════════════════
  { id: 'log_028', userId: 'admin_002', userName: 'Aminata Traoré', action: 'escalate', entityType: 'incident', entityId: 'incident_003', details: 'SUPPORT_ADMIN — Incident "Annulation Ouaga→Ouahigouya 14h" (Rakieta Transport, trip_456) escaladé en sévérité critique — 18 passagers bloqués, véhicule en panne transmission, transfert sur trajet 16h en cours', severity: 'critical', category: 'operations', changes: { severity: { oldValue: 'high', newValue: 'critical' } }, ipAddress: '41.188.23.45', geoLocation: 'Ouagadougou, BF', sessionId: 'sess_20260306_002', durationMs: 700, createdAt: '2026-03-06T18:45:00Z' },
  { id: 'log_027', userId: 'system', userName: 'Système', action: 'backup_completed', entityType: 'system', entityId: 'backup_20260306', details: 'Backup quotidien AWS S3 (billingType: subscription) terminé — 2.4 Go compressé, 847 fichiers, 0 erreurs, rétention 30 jours, CloudFront cache purgé', severity: 'info', category: 'operations', ipAddress: '10.0.1.50', geoLocation: 'AWS eu-west-3', durationMs: 45000, createdAt: '2026-03-06T03:00:00Z' },
  { id: 'log_026', userId: 'admin_004', userName: 'Fatoumata Sawadogo', action: 'login', entityType: 'session', entityId: 'sess_20260306_004', details: 'Connexion OPERATOR_ADMIN (TSR Transport) — accès limité aux données TSR uniquement (company_001), MFA non activé', severity: 'info', category: 'security', ipAddress: '41.188.45.67', geoLocation: 'Ouagadougou, BF', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122', sessionId: 'sess_20260306_004', durationMs: 800, createdAt: '2026-03-06T08:00:00Z' },

  // ═══════════════════════════════════════════════════════════════════
  // 5 MARS 2026 — 3 entrées
  // ═══════════════════════════════════════════════════════════════════
  { id: 'log_025', userId: 'admin_003', userName: 'Ibrahim Kaboré', action: 'reject', entityType: 'promotion', entityId: 'promo_003', details: 'FINANCE_ADMIN — Promotion "STAF Étudiants -20%" (promo_003, STAF Express) rejetée — code ETUDIANT20 : réduction appliquée sans vérification carte étudiante côté app, risque de fraude. Demander à Seydou Compaoré (OPERATOR_ADMIN STAF) de corriger les conditions', severity: 'warning', category: 'finance', changes: { approvalStatus: { oldValue: 'pending', newValue: 'rejected' }, rejectionReason: { oldValue: null, newValue: 'Pas de vérification carte étudiante' } }, ipAddress: '41.188.34.56', geoLocation: 'Ouagadougou, BF', sessionId: 'sess_20260305_003', durationMs: 600, createdAt: '2026-03-05T15:30:00Z' },
  { id: 'log_024', userId: 'admin_002', userName: 'Aminata Traoré', action: 'suspend', entityType: 'passenger', entityId: 'passenger_005', details: 'SUPPORT_ADMIN — Passager "Spam User" (passenger_005) suspendu — compte non vérifié (téléphone + email), activité suspecte : 12 tentatives de réservation échouées en 24h sans paiement', severity: 'warning', category: 'security', changes: { status: { oldValue: 'active', newValue: 'suspended' } }, ipAddress: '41.188.23.45', geoLocation: 'Ouagadougou, BF', sessionId: 'sess_20260305_002', durationMs: 800, createdAt: '2026-03-05T11:00:00Z' },
  { id: 'log_023', userId: 'admin_001', userName: 'Moussa Diarra', action: 'create', entityType: 'station', entityId: 'station_006', details: 'SUPER_ADMIN — Nouvelle gare "Gare Routière de Tenkodogo" créée — capacité 20 bus, coordonnées GPS 11.7833°N 0.3667°W, contact local configuré, horaires 06h-20h', severity: 'info', category: 'operations', changes: { name: { oldValue: null, newValue: 'Gare Routière de Tenkodogo' }, capacity: { oldValue: null, newValue: 20 } }, ipAddress: '41.188.12.34', geoLocation: 'Ouagadougou, BF', sessionId: 'sess_20260305_001', durationMs: 2200, createdAt: '2026-03-05T09:30:00Z' },

  // ═══════════════════════════════════════════════════════════════════
  // 3 MARS 2026 — 2 entrées
  // ═══════════════════════════════════════════════════════════════════
  { id: 'log_022', userId: 'admin_004', userName: 'Fatoumata Sawadogo', action: 'update', entityType: 'company', entityId: 'company_001', details: 'OPERATOR_ADMIN (TSR Transport) — Mise à jour véhicule TSR bus BF-4521-AB : contrôle technique renouvelé jusqu\'au 15/09/2026, capacité 70 places confirmée — périmètre limité à company_001', severity: 'info', category: 'operations', changes: { vehicleInspection: { oldValue: '2025-09-15', newValue: '2026-09-15' }, vehicleCapacity: { oldValue: 70, newValue: 70 } }, ipAddress: '41.188.45.67', geoLocation: 'Ouagadougou, BF', sessionId: 'sess_20260303_004', durationMs: 650, createdAt: '2026-03-03T14:00:00Z' },
  { id: 'log_021', userId: 'admin_001', userName: 'Moussa Diarra', action: 'update', entityType: 'policy', entityId: 'policy_cancellation_01', details: 'SUPER_ADMIN — Politique d\'annulation mise à jour : remboursement 100% si annulation > 24h avant départ (avant : 80% si > 12h). S\'applique à toutes les sociétés, tous les canaux PayDunya', severity: 'info', category: 'config', changes: { cancellationDeadlineHours: { oldValue: 12, newValue: 24 }, refundPercentage: { oldValue: 80, newValue: 100 } }, ipAddress: '41.188.12.34', geoLocation: 'Ouagadougou, BF', sessionId: 'sess_20260303_001', durationMs: 1500, createdAt: '2026-03-03T09:00:00Z' },

  // ═══════════════════════════════════════════════════════════════════
  // 28 FÉVRIER 2026 — 2 entrées
  // ═══════════════════════════════════════════════════════════════════
  { id: 'log_020', userId: 'admin_001', userName: 'Moussa Diarra', action: 'reactivate', entityType: 'company', entityId: 'company_002', details: 'SUPER_ADMIN — STAF Express (company_002) réactivée après 18 jours de suspension — documents conformité véhicules reçus : 3 contrôles techniques renouvelés, attestation assurance RC mise à jour', severity: 'info', category: 'operations', changes: { status: { oldValue: 'suspended', newValue: 'active' } }, ipAddress: '41.188.12.34', geoLocation: 'Ouagadougou, BF', sessionId: 'sess_20260228_001', durationMs: 900, createdAt: '2026-02-28T10:30:00Z' },
  { id: 'log_019', userId: 'admin_003', userName: 'Ibrahim Kaboré', action: 'export', entityType: 'payment', entityId: 'export_feb_2026', details: 'FINANCE_ADMIN — Export CSV paiements février 2026 : 1 847 transactions, montant total 12 143 500 FCFA, commission FasoTravel 607 175 FCFA (5%), frais service 184 700 FCFA (100 FCFA × 1 847 billets) — fichier 14.2 Mo', severity: 'info', category: 'finance', ipAddress: '41.188.34.56', geoLocation: 'Ouagadougou, BF', sessionId: 'sess_20260228_003', durationMs: 8500, createdAt: '2026-02-28T09:00:00Z' },

  // ═══════════════════════════════════════════════════════════════════
  // 22 FÉVRIER 2026 — 1 entrée
  // ═══════════════════════════════════════════════════════════════════
  { id: 'log_018', userId: 'system', userName: 'Système', action: 'alert_triggered', entityType: 'integration', entityId: 'integration_aws', details: 'Alerte AWS Lightsail (billingType: subscription) — utilisation disque 78%, seuil d\'alerte 75% dépassé — recommandation : purger les logs > 90 jours ou passer au plan supérieur', severity: 'warning', category: 'operations', ipAddress: '10.0.1.50', geoLocation: 'AWS eu-west-3', durationMs: 80, createdAt: '2026-02-22T04:15:00Z' },

  // ═══════════════════════════════════════════════════════════════════
  // 15 FÉVRIER 2026 — 2 entrées
  // ═══════════════════════════════════════════════════════════════════
  { id: 'log_017', userId: 'admin_002', userName: 'Aminata Traoré', action: 'archive', entityType: 'story', entityId: 'story_002', details: 'SUPPORT_ADMIN — Story "-20% sur tous les trajets ce weekend !" (story_002, cercle Promotions) archivée — performance : 3 421 vues, 876 clics CTA, taux conversion 25.6%', severity: 'info', category: 'content', changes: { status: { oldValue: 'published', newValue: 'archived' } }, ipAddress: '41.188.23.45', geoLocation: 'Ouagadougou, BF', sessionId: 'sess_20260215_002', durationMs: 400, createdAt: '2026-02-15T17:00:00Z' },
  { id: 'log_016', userId: 'admin_005', userName: 'Seydou Compaoré', action: 'login', entityType: 'session', entityId: 'sess_20260215_005', details: 'Connexion OPERATOR_ADMIN (STAF Express) depuis Bobo-Dioulasso — accès limité aux données STAF uniquement (company_002), appareil mobile Android', severity: 'info', category: 'security', ipAddress: '41.188.56.78', geoLocation: 'Bobo-Dioulasso, BF', userAgent: 'Mozilla/5.0 (Linux; Android 14; Samsung Galaxy A54)', sessionId: 'sess_20260215_005', durationMs: 950, createdAt: '2026-02-15T08:00:00Z' },

  // ═══════════════════════════════════════════════════════════════════
  // 10 FÉVRIER 2026 — 2 entrées
  // ═══════════════════════════════════════════════════════════════════
  { id: 'log_015', userId: 'admin_001', userName: 'Moussa Diarra', action: 'suspend', entityType: 'company', entityId: 'company_002', details: 'SUPER_ADMIN — STAF Express (company_002) suspendue : non-conformité véhicules — contrôle technique expiré sur 3 bus (BF-2301-AC, BF-2302-AC, BF-2305-AC), notification envoyée à Fatima Kaboré (responsable STAF) et Seydou Compaoré (OPERATOR_ADMIN STAF)', severity: 'critical', category: 'operations', changes: { status: { oldValue: 'active', newValue: 'suspended' }, suspensionReason: { oldValue: null, newValue: 'Contrôle technique expiré (3 véhicules)' } }, ipAddress: '41.188.12.34', geoLocation: 'Ouagadougou, BF', sessionId: 'sess_20260210_001', durationMs: 1200, createdAt: '2026-02-10T14:30:00Z' },
  { id: 'log_014', userId: 'admin_003', userName: 'Ibrahim Kaboré', action: 'approve', entityType: 'promotion', entityId: 'promo_001', details: 'FINANCE_ADMIN — Promotion "Réduction Saison Sèche -25%" (promo_001, TSR Transport, code SAISON25) approuvée — réduction 25%, min achat 3 000 FCFA, max remise 5 000 FCFA, usage max 2 000, marge opérateur vérifiée à 22%', severity: 'info', category: 'finance', changes: { approvalStatus: { oldValue: 'pending', newValue: 'approved' } }, ipAddress: '41.188.34.56', geoLocation: 'Ouagadougou, BF', sessionId: 'sess_20260210_003', durationMs: 700, createdAt: '2026-02-10T10:00:00Z' },

  // ═══════════════════════════════════════════════════════════════════
  // 25 JANVIER 2026 — 2 entrées
  // ═══════════════════════════════════════════════════════════════════
  { id: 'log_013', userId: 'admin_001', userName: 'Moussa Diarra', action: 'create', entityType: 'company', entityId: 'company_004', details: 'SUPER_ADMIN — Nouvelle société SOGEBAF (company_004) enregistrée — "Société de Gestion de Bus Africains du Faso", contact Rasmata Compaoré (+226 73 44 44 44), commission négociée 4%, 15 véhicules déclarés — statut : en attente de vérification des documents', severity: 'info', category: 'operations', changes: { name: { oldValue: null, newValue: 'SOGEBAF' }, status: { oldValue: null, newValue: 'pending' }, commission: { oldValue: null, newValue: '4%' } }, ipAddress: '41.188.12.34', geoLocation: 'Ouagadougou, BF', sessionId: 'sess_20260125_001', durationMs: 3500, createdAt: '2026-01-25T14:00:00Z' },
  { id: 'log_012', userId: 'admin_002', userName: 'Aminata Traoré', action: 'resolve', entityType: 'support', entityId: 'support_001', details: 'SUPPORT_ADMIN — Ticket support_001 "Problème de paiement mobile money" (Jean Kouamé, passenger_001) résolu — transaction TXN-2026-00458 retrouvée, billet BKG-2026-001234 émis manuellement, passager notifié par SMS', severity: 'info', category: 'operations', changes: { status: { oldValue: 'in-progress', newValue: 'resolved' } }, ipAddress: '41.188.23.45', geoLocation: 'Ouagadougou, BF', sessionId: 'sess_20260125_002', durationMs: 2500, createdAt: '2026-01-25T11:00:00Z' },

  // ═══════════════════════════════════════════════════════════════════
  // 20 JANVIER 2026 — 2 entrées
  // ═══════════════════════════════════════════════════════════════════
  { id: 'log_011', userId: 'admin_001', userName: 'Moussa Diarra', action: 'config_change', entityType: 'integration', entityId: 'integration_paydunya', details: 'SUPER_ADMIN — PayDunya (billingType: client_charged) : activation canal Telecel Money + mise à jour frais Wave de 1.5% à 1% — rappel : frais PayDunya à la charge du client (1% Mobile Money, 3.5% carte bancaire)', severity: 'info', category: 'config', changes: { 'canaux.telecel_money': { oldValue: 'désactivé', newValue: 'activé' }, 'canaux.wave.frais': { oldValue: '1.5%', newValue: '1%' } }, ipAddress: '41.188.12.34', geoLocation: 'Ouagadougou, BF', sessionId: 'sess_20260120_001', durationMs: 1800, createdAt: '2026-01-20T11:00:00Z' },
  { id: 'log_010', userId: 'system', userName: 'Système', action: 'ssl_renewal', entityType: 'system', entityId: 'cert_fasotravel_bf', details: 'Certificat SSL fasotravel.bf renouvelé automatiquement via Let\'s Encrypt — valide jusqu\'au 20 avril 2026, CDN CloudFront cache invalidé', severity: 'info', category: 'security', ipAddress: '10.0.1.50', geoLocation: 'AWS eu-west-3', durationMs: 3200, createdAt: '2026-01-20T02:00:00Z' },

  // ═══════════════════════════════════════════════════════════════════
  // 15 JANVIER 2026 — 1 entrée
  // ═══════════════════════════════════════════════════════════════════
  { id: 'log_009', userId: 'admin_001', userName: 'Moussa Diarra', action: 'update', entityType: 'station', entityId: 'station_005', details: 'SUPER_ADMIN — Gare Routière de Banfora (station_005) : horaires mis à jour (ouverture 05h30 au lieu de 06h00), ajout équipement parking — capacité inchangée 15 bus', severity: 'info', category: 'operations', changes: { openingTime: { oldValue: '06:00', newValue: '05:30' }, amenities: { oldValue: 'parking', newValue: 'parking' } }, ipAddress: '41.188.12.34', geoLocation: 'Ouagadougou, BF', sessionId: 'sess_20260115_001', durationMs: 750, createdAt: '2026-01-15T08:45:00Z' },

  // ═══════════════════════════════════════════════════════════════════
  // 5 JANVIER 2026 — 1 entrée
  // ═══════════════════════════════════════════════════════════════════
  { id: 'log_008', userId: 'admin_003', userName: 'Ibrahim Kaboré', action: 'export', entityType: 'booking', entityId: 'export_dec_2025', details: 'FINANCE_ADMIN — Export CSV réservations décembre 2025 : 3 420 réservations, montant total 22 487 000 FCFA, commission FasoTravel 1 124 350 FCFA + 342 000 FCFA frais service — fichier 22.8 Mo, destiné au rapport trimestriel Q4-2025', severity: 'info', category: 'finance', ipAddress: '41.188.34.56', geoLocation: 'Ouagadougou, BF', sessionId: 'sess_20260105_003', durationMs: 12500, createdAt: '2026-01-05T09:00:00Z' },

  // ═══════════════════════════════════════════════════════════════════
  // 28 DÉCEMBRE 2025 — 1 entrée (CRITIQUE)
  // ═══════════════════════════════════════════════════════════════════
  { id: 'log_007', userId: 'admin_001', userName: 'Moussa Diarra', action: 'login_failed', entityType: 'session', entityId: 'sess_failed_20251228', details: 'ALERTE SÉCURITÉ — Tentative de connexion échouée sur le compte SUPER_ADMIN (admin_001, Moussa Diarra) — mot de passe incorrect, 3ème tentative, IP étrangère 196.200.15.78 (Abidjan, Côte d\'Ivoire) — compte temporairement verrouillé 15min', severity: 'critical', category: 'security', ipAddress: '196.200.15.78', geoLocation: 'Abidjan, CI', userAgent: 'Mozilla/5.0 (Linux; Android 13)', durationMs: 200, createdAt: '2025-12-28T22:15:00Z' },

  // ═══════════════════════════════════════════════════════════════════
  // 25 DÉCEMBRE 2025 — 1 entrée
  // ═══════════════════════════════════════════════════════════════════
  { id: 'log_006', userId: 'admin_002', userName: 'Aminata Traoré', action: 'bulk_send', entityType: 'notification', entityId: 'notif_campaign_038', details: 'SUPPORT_ADMIN — Message de vœux envoyé à 5 210 passagers via WhatsApp Business (billingType: usage) : "Joyeuses fêtes de la part de FasoTravel !" — coût estimé 26 050 FCFA (5 FCFA/message)', severity: 'info', category: 'content', changes: { audience: { oldValue: null, newValue: '5 210 passagers actifs' }, channels: { oldValue: null, newValue: 'WhatsApp Business' }, estimatedCost: { oldValue: null, newValue: '26 050 FCFA' } }, ipAddress: '41.188.23.45', geoLocation: 'Ouagadougou, BF', sessionId: 'sess_20251225_002', durationMs: 12000, createdAt: '2025-12-25T08:00:00Z' },

  // ═══════════════════════════════════════════════════════════════════
  // 20 DÉCEMBRE 2025 — 1 entrée (CRITIQUE)
  // ═══════════════════════════════════════════════════════════════════
  { id: 'log_005', userId: 'admin_001', userName: 'Moussa Diarra', action: 'terminate', entityType: 'session', entityId: 'sess_suspect_001', details: 'SUPER_ADMIN — Session suspecte terminée d\'urgence : connexion détectée depuis Abidjan (IP 196.200.15.78) sur le compte admin_001 le 28/12 — session forcée fermée, MFA déjà activé, mot de passe changé par précaution', severity: 'critical', category: 'security', ipAddress: '41.188.12.34', geoLocation: 'Ouagadougou, BF', sessionId: 'sess_20251220_001', durationMs: 300, createdAt: '2025-12-20T19:30:00Z' },

  // ═══════════════════════════════════════════════════════════════════
  // 15 DÉCEMBRE 2025 — 1 entrée
  // ═══════════════════════════════════════════════════════════════════
  { id: 'log_004', userId: 'admin_001', userName: 'Moussa Diarra', action: 'update', entityType: 'operator', entityId: 'operator_002', details: 'SUPER_ADMIN — Rôle opérateur Salif Ouattara (operator_002, TSR Transport) confirmé : manager gare Ouagadougou (station_001), accès validation embarquement + rapports journaliers', severity: 'info', category: 'operations', changes: { role: { oldValue: 'caissier', newValue: 'manager' }, stationName: { oldValue: null, newValue: 'Gare Routière de Ouagadougou' } }, ipAddress: '41.188.12.34', geoLocation: 'Ouagadougou, BF', sessionId: 'sess_20251215_001', durationMs: 600, createdAt: '2025-12-15T14:30:00Z' },

  // ═══════════════════════════════════════════════════════════════════
  // 15 NOVEMBRE 2025 — 1 entrée
  // ═══════════════════════════════════════════════════════════════════
  { id: 'log_003', userId: 'admin_001', userName: 'Moussa Diarra', action: 'approve', entityType: 'company', entityId: 'company_003', details: 'SUPER_ADMIN — Rakieta Transport (company_003) approuvée : 28 véhicules déclarés, licence BF-2020-RAK-003 valide jusqu\'en 2027, contact Ibrahim Sawadogo (+226 72 33 33 33), commission fixée à 5.5%, 10 routes autorisées', severity: 'info', category: 'operations', changes: { status: { oldValue: 'pending', newValue: 'active' }, commission: { oldValue: null, newValue: '5.5%' } }, ipAddress: '41.188.12.34', geoLocation: 'Ouagadougou, BF', sessionId: 'sess_20251115_001', durationMs: 1200, createdAt: '2025-11-15T11:00:00Z' },

  // ═══════════════════════════════════════════════════════════════════
  // 1 NOVEMBRE 2025 — 1 entrée
  // ═══════════════════════════════════════════════════════════════════
  { id: 'log_002', userId: 'admin_001', userName: 'Moussa Diarra', action: 'create', entityType: 'policy', entityId: 'policy_refund_01', details: 'SUPER_ADMIN — Politique de remboursement créée : délai max 72h après demande, remboursement via le même canal PayDunya (Orange Money → Orange Money, Wave → Wave, etc.), commission FasoTravel non remboursable', severity: 'info', category: 'config', ipAddress: '41.188.12.34', geoLocation: 'Ouagadougou, BF', sessionId: 'sess_20251101_001', durationMs: 4200, createdAt: '2025-11-01T10:00:00Z' },

  // ═══════════════════════════════════════════════════════════════════
  // 5 OCTOBRE 2025 — 1 entrée (PREMIÈRE ENTRÉE)
  // ═══════════════════════════════════════════════════════════════════
  { id: 'log_001', userId: 'admin_001', userName: 'Moussa Diarra', action: 'create', entityType: 'system', entityId: 'platform_init', details: 'SUPER_ADMIN — Initialisation plateforme FasoTravel : connexion PayDunya (6 canaux, frais client), WhatsApp Business (OTP/Messages), AWS S3+CloudFront+Lightsail, Google Maps, Google Analytics — commission 5% + 100 FCFA/billet, split payment configuré', severity: 'info', category: 'config', ipAddress: '41.188.12.34', geoLocation: 'Ouagadougou, BF', sessionId: 'sess_20251005_001', durationMs: 15000, createdAt: '2025-10-05T08:00:00Z' },
];

// ==================== NOTIFICATIONS ====================

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif_001',
    type: 'warning',
    title: 'Nouvelle demande de société',
    message: 'SOGEBAF a soumis une demande d\'inscription',
    read: false,
    entityType: 'company',
    entityId: 'company_004',
    actionUrl: '/companies/company_004',
    createdAt: '2026-01-25T14:00:00Z'
  },
  {
    id: 'notif_002',
    type: 'error',
    title: 'Incident critique signalé',
    message: 'Retard important sur le trajet Ouaga-Bobo',
    read: false,
    entityType: 'incident',
    entityId: 'incident_001',
    actionUrl: '/incidents/incident_001',
    createdAt: '2026-02-02T08:30:00Z'
  },
  {
    id: 'notif_003',
    type: 'success',
    title: 'Incident résolu',
    message: 'Panne d\'électricité à Banfora résolue',
    read: true,
    entityType: 'incident',
    entityId: 'incident_002',
    readAt: '2026-02-01T15:00:00Z',
    createdAt: '2026-02-01T14:00:00Z'
  },
  {
    id: 'notif_004',
    type: 'info',
    title: 'Nouveau passager vérifié',
    message: '50 nouveaux passagers inscrits cette semaine',
    read: true,
    readAt: '2026-02-01T10:00:00Z',
    createdAt: '2026-01-31T23:59:00Z'
  }
];

// ==================== PAYMENTS ====================

export const MOCK_PAYMENTS: Payment[] = [
  // COMPLETED - Paiements réussis
  {
    id: 'payment_001',
    bookingId: 'BKG-2026-001234',
    userId: 'passenger_001',
    userName: 'Jean Kouamé',
    companyId: 'company_001',
    companyName: 'TSR Transport',
    amount: 8500,
    currency: 'FCFA',
    method: 'orange_money',
    status: 'completed',
    platformFee: 425,
    companyAmount: 8075,
    transactionId: 'TXN_20260219_001',
    paymentGateway: 'Orange Money',
    processedAt: '2026-02-19T10:32:00Z',
    createdAt: '2026-02-19T10:30:00Z',
    updatedAt: '2026-02-19T10:32:00Z'
  },
  {
    id: 'payment_002',
    bookingId: 'BKG-2026-001235',
    userId: 'pass_002',
    userName: 'Ibrahim Compaoré',
    companyId: 'company_002',
    companyName: 'STAF Express',
    amount: 11000,
    currency: 'FCFA',
    method: 'card',
    status: 'completed',
    platformFee: 550,
    companyAmount: 10450,
    transactionId: 'TXN_20260220_001',
    paymentGateway: 'Visa',
    processedAt: '2026-02-20T08:17:00Z',
    createdAt: '2026-02-20T08:15:00Z',
    updatedAt: '2026-02-20T08:17:00Z'
  },
  {
    id: 'payment_003',
    bookingId: 'BKG-2026-001236',
    userId: 'pass_003',
    userName: 'Aïcha Kaboré',
    companyId: 'company_001',
    companyName: 'TSR Transport',
    amount: 4200,
    currency: 'FCFA',
    method: 'cash',
    status: 'completed',
    platformFee: 210,
    companyAmount: 3990,
    processedAt: '2026-02-20T12:05:00Z',
    createdAt: '2026-02-20T12:00:00Z',
    updatedAt: '2026-02-20T12:05:00Z'
  },
  {
    id: 'payment_004',
    bookingId: 'BKG-2026-001220',
    userId: 'pass_010',
    userName: 'Abdoulaye Traoré',
    companyId: 'company_003',
    companyName: 'Rakieta Transport',
    amount: 6500,
    currency: 'FCFA',
    method: 'orange_money',
    status: 'completed',
    platformFee: 325,
    companyAmount: 6175,
    transactionId: 'TXN_20260220_002',
    paymentGateway: 'Moov Money',
    processedAt: '2026-02-20T06:05:00Z',
    createdAt: '2026-02-20T06:00:00Z',
    updatedAt: '2026-02-20T06:05:00Z'
  },
  {
    id: 'payment_005',
    bookingId: 'BKG-2026-001221',
    userId: 'pass_011',
    userName: 'Mariam Ouédraogo',
    companyId: 'company_002',
    companyName: 'STAF Express',
    amount: 24000,
    currency: 'FCFA',
    method: 'card',
    status: 'completed',
    platformFee: 1200,
    companyAmount: 22800,
    transactionId: 'TXN_20260220_003',
    paymentGateway: 'Mastercard',
    processedAt: '2026-02-20T05:35:00Z',
    createdAt: '2026-02-20T05:30:00Z',
    updatedAt: '2026-02-20T05:35:00Z'
  },
  {
    id: 'payment_012',
    bookingId: 'BKG-2026-001150',
    userId: 'pass_020',
    userName: 'Souleymane Diallo',
    companyId: 'company_001',
    companyName: 'TSR Transport',
    amount: 8500,
    currency: 'FCFA',
    method: 'orange_money',
    status: 'completed',
    platformFee: 425,
    companyAmount: 8075,
    transactionId: 'TXN_20260215_001',
    paymentGateway: 'Orange Money',
    processedAt: '2026-02-15T14:25:00Z',
    createdAt: '2026-02-15T14:20:00Z',
    updatedAt: '2026-02-15T14:25:00Z'
  },
  // PENDING - Paiements en attente
  {
    id: 'payment_006',
    bookingId: 'BKG-2026-001240',
    userId: 'pass_040',
    userName: 'Moussa Sana',
    companyId: 'company_001',
    companyName: 'TSR Transport',
    amount: 10000,
    currency: 'FCFA',
    method: 'orange_money',
    status: 'pending',
    transactionId: 'TXN_20260220_004',
    paymentGateway: 'Orange Money',
    createdAt: '2026-02-20T14:30:00Z',
    updatedAt: '2026-02-20T14:30:00Z'
  },
  {
    id: 'payment_007',
    bookingId: 'BKG-2026-001241',
    userId: 'pass_041',
    userName: 'Fatoumata Diarra',
    companyId: 'company_002',
    companyName: 'STAF Express',
    amount: 5500,
    currency: 'FCFA',
    method: 'moov_money',
    status: 'pending',
    transactionId: 'TXN_20260220_005',
    paymentGateway: 'Moov Money',
    createdAt: '2026-02-20T15:00:00Z',
    updatedAt: '2026-02-20T15:00:00Z'
  },
  // REFUNDED - Paiements remboursés
  {
    id: 'payment_008',
    bookingId: 'BKG-2026-001180',
    userId: 'pass_030',
    userName: 'Boukary Koné',
    companyId: 'company_003',
    companyName: 'Rakieta Transport',
    amount: 7200,
    currency: 'FCFA',
    method: 'orange_money',
    status: 'refunded',
    platformFee: 360,
    companyAmount: 6840,
    transactionId: 'TXN_20260218_001',
    paymentGateway: 'Orange Money',
    processedAt: '2026-02-18T16:50:00Z',
    refundedAt: '2026-02-19T10:20:00Z',
    refundReason: 'Annulation par le passager',
    createdAt: '2026-02-18T16:45:00Z',
    updatedAt: '2026-02-19T10:20:00Z'
  },
  {
    id: 'payment_009',
    bookingId: 'BKG-2026-001175',
    userId: 'pass_031',
    userName: 'Zalissa Ouattara',
    companyId: 'company_001',
    companyName: 'TSR Transport',
    amount: 4000,
    currency: 'FCFA',
    method: 'cash',
    status: 'refunded',
    platformFee: 200,
    companyAmount: 3800,
    refundedAt: '2026-02-18T14:00:00Z',
    refundReason: 'Annulation par le passager',
    createdAt: '2026-02-17T11:30:00Z',
    updatedAt: '2026-02-18T14:00:00Z'
  },
  // FAILED - Paiements échoués
  {
    id: 'payment_010',
    bookingId: 'BKG-2026-ERR001',
    userId: 'pass_050',
    userName: 'Seydou Bamba',
    companyId: 'company_002',
    companyName: 'STAF Express',
    amount: 9000,
    currency: 'FCFA',
    method: 'card',
    status: 'failed',
    transactionId: 'TXN_20260220_ERR',
    paymentGateway: 'Visa',
    createdAt: '2026-02-20T11:00:00Z',
    updatedAt: '2026-02-20T11:01:00Z'
  },
  {
    id: 'payment_011',
    bookingId: 'BKG-2026-ERR002',
    userId: 'pass_051',
    userName: 'Rasmata Zongo',
    companyId: 'company_003',
    companyName: 'Rakieta Transport',
    amount: 7500,
    currency: 'FCFA',
    method: 'orange_money',
    status: 'failed',
    transactionId: 'TXN_20260219_ERR',
    paymentGateway: 'Orange Money',
    createdAt: '2026-02-19T16:00:00Z',
    updatedAt: '2026-02-19T16:02:00Z'
  }
];

// ==================== REVENUE STATS ====================

export const MOCK_REVENUE_STATS: RevenueStats = {
  totalRevenue: 45680000,
  platformCommission: 2284000,
  companyRevenue: 43396000,
  
  todayRevenue: 1250000,
  weekRevenue: 8950000,
  monthRevenue: 35420000,
  
  totalPayments: 12,  // Correspond au nombre de MOCK_PAYMENTS
  successfulPayments: 6,
  failedPayments: 2,
  refundedPayments: 2,
  
  averageTicketPrice: 7575,
  topCompanyId: 'company_001',
  topCompanyRevenue: 18750000
};

// ==================== INTEGRATIONS ====================

export const MOCK_INTEGRATIONS: Integration[] = [
  {
    id: 'integration_001',
    name: 'PaydunYa',
    type: 'payment',
    provider: 'PaydunYa (Agrégateur PSP)',
    status: 'active',
    apiKey: 'pk_live_fasotravel_xxxxxxxxxxxxxx',
    apiSecret: 'sk_live_fasotravel_xxxxxxxxxxxxxx',
    webhookUrl: 'https://api.fasotravel.bf/webhooks/paydunya',
    config: {
      masterKey: 'FASOTRAVEL_MASTER_KEY',
      mode: 'live',
      currency: 'XOF',
      callbackUrl: 'https://api.fasotravel.bf/payments/callback',
      returnUrl: 'https://fasotravel.bf/paiement/confirmation',
      cancelUrl: 'https://fasotravel.bf/paiement/echec',
      channels: {
        orange_money: { enabled: true, label: 'Orange Money', provider: 'Orange Burkina Faso', fee: 1.0 },
        moov_money: { enabled: true, label: 'Moov Money', provider: 'Moov Africa Burkina', fee: 1.0 },
        wave: { enabled: true, label: 'Wave', provider: 'Wave Mobile Money', fee: 1.0 },
        sank_money: { enabled: true, label: 'Sank Money', provider: 'Sank (Burkina Faso)', fee: 1.0 },
        telecel_money: { enabled: false, label: 'Telecel Money', provider: 'Telecel Faso', fee: 1.0 },
        card: { enabled: true, label: 'Carte Bancaire', provider: 'Visa / Mastercard', fee: 3.5 },
      }
    },
    lastSyncAt: '2026-03-07T10:30:00Z',
    billingType: 'client_charged',
    billingDetails: '1% Mobile Money, 3.5% Carte Bancaire — frais à la charge du client',
    createdAt: '2024-06-01T10:00:00Z',
    updatedAt: '2026-03-07T10:30:00Z'
  },
  {
    id: 'integration_003',
    name: 'WhatsApp Business',
    type: 'sms',
    provider: 'WhatsApp Business (OTP & Messages)',
    status: 'active',
    apiKey: 'ib_live_xxxxxxxxxxxxxxxxxxxxxx',
    apiSecret: 'ib_secret_xxxxxxxxxxxxxxxxxxxxxx',
    webhookUrl: 'https://api.fasotravel.bf/webhooks/whatsapp',
    docsUrl: 'https://developers.facebook.com/docs/whatsapp/',
    dashboardUrl: 'https://business.facebook.com/wa/manage/',
    billingType: 'usage',
    billingDetails: 'Facturation à l\'usage — ~30 FCFA/message envoyé',

    config: {
      baseUrl: 'https://graph.facebook.com/v19.0',
      senderId: 'FasoTravel',
      supportedNetworks: ['Orange Burkina Faso', 'Moov Africa Burkina'],
      useCases: {
        otp: { enabled: true, templateId: 'FASOTRAVEL_OTP', expirySeconds: 300 },
        ticketSms: { enabled: true, templateId: 'FASOTRAVEL_TICKET', includeDeepLink: true },
        tripReminder: { enabled: true, templateId: 'FASOTRAVEL_REMINDER', beforeMinutes: 60 },
      },
      deepLinkBase: 'fasotravel://',
      costPerSms: 30,
      monthlyEstimate: 63000,
    },
    usageStats: {
      apiCallsThisMonth: 2100,
      apiCallsLimit: 0,
      successRate: 98.2,
      avgLatencyMs: 340,
      uptimePercent: 99.8,
      lastHealthCheck: '2026-03-09T08:00:00Z',
      extras: {
        messagesSentThisMonth: 2100,
        otpSent: 1450,
        ticketSmsSent: 520,
        reminderSmsSent: 130,
        deliveryRate: 97.5,
        avgDeliveryTimeSec: 4.2,
      },
    },
    lastSyncAt: '2026-03-08T07:00:00Z',
    createdAt: '2024-06-15T12:00:00Z',
    updatedAt: '2026-03-08T07:00:00Z'
  },
  {
    id: 'integration_004',
    name: 'Google Analytics',
    type: 'analytics',
    provider: 'Google',
    status: 'active',
    apiKey: 'GA_xxxxxxxxxxxxxx',
    docsUrl: 'https://developers.google.com/analytics',
    dashboardUrl: 'https://analytics.google.com',
    billingType: 'free',
    billingDetails: 'Service gratuit Google',
    config: {
      trackingId: 'UA-XXXXXXX-1',
      propertyId: 'G-XXXXXXXXX',
      dataStreams: ['Web (fasotravel.bf)', 'App Mobile (Android)', 'App Mobile (iOS)'],
      eventsTracked: [
        'page_view', 'search_trip', 'select_trip', 'begin_checkout',
        'purchase', 'refund', 'login', 'sign_up', 'share',
      ],
      conversionsConfigured: ['purchase', 'sign_up', 'begin_checkout'],
    },
    usageStats: {
      apiCallsThisMonth: 0,
      apiCallsLimit: 0,
      successRate: 100,
      avgLatencyMs: 0,
      uptimePercent: 100,
      lastHealthCheck: '2026-03-09T08:00:00Z',
      extras: {
        activeUsersToday: 342,
        activeUsers7d: 1850,
        activeUsers30d: 5420,
        sessionsThisMonth: 18500,
        bounceRate: 32.4,
        avgSessionDuration: '3m 42s',
        topPages: [
          { page: '/recherche', views: 6200 },
          { page: '/accueil', views: 5100 },
          { page: '/billets', views: 3400 },
          { page: '/operateurs', views: 2100 },
        ],
        conversionRate: 8.7,
        topAcquisition: [
          { source: 'Direct', percent: 45 },
          { source: 'Organic Search', percent: 28 },
          { source: 'Social (Facebook)', percent: 18 },
          { source: 'Referral', percent: 9 },
        ],
      },
    },
    lastSyncAt: '2026-03-09T00:00:00Z',
    createdAt: '2024-07-01T09:00:00Z',
    updatedAt: '2026-03-09T00:00:00Z'
  },
  {
    id: 'integration_005',
    name: 'Google Maps',
    type: 'mapping',
    provider: 'Google Maps Platform',
    status: 'active',
    apiKey: 'AIzaSy_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    docsUrl: 'https://developers.google.com/maps/documentation',
    dashboardUrl: 'https://console.cloud.google.com/google/maps-apis',
    billingType: 'usage',
    billingDetails: 'Facturation à l\'usage Google Cloud Platform',
    config: {
      projectId: 'fasotravel-bf',
      billingAccount: 'FASOTRAVEL_GCP',
      region: 'BF',
      apis: ['Maps JavaScript API', 'Directions API', 'Geocoding API', 'Distance Matrix API'],
      optimizations: {
        routesCached: true,
        garesInternalDb: true,
        distanceCalcBackend: true,
        liveTrackingSingleEmitter: true,
        rule5km: true,
      },
      quotaLimitPerDay: 28500,
      monthlyEstimate: 20000,
    },
    usageStats: {
      apiCallsThisMonth: 12400,
      apiCallsLimit: 28500,
      successRate: 99.6,
      avgLatencyMs: 180,
      uptimePercent: 99.95,
      lastHealthCheck: '2026-03-09T08:00:00Z',
      extras: {
        mapsLoadThisMonth: 8200,
        directionsRequests: 2800,
        geocodingRequests: 920,
        distanceMatrixRequests: 480,
        quotaUsedPercent: 43.5,
        estimatedCostUsd: 32,
        cachedRoutesCount: 47,
        cachedStationsCount: 23,
      },
    },
    lastSyncAt: '2026-03-08T08:00:00Z',
    createdAt: '2024-06-01T10:00:00Z',
    updatedAt: '2026-03-08T08:00:00Z'
  },
  {
    id: 'integration_006',
    name: 'AWS S3 + CloudFront',
    type: 'storage',
    provider: 'Amazon Web Services',
    status: 'active',
    apiKey: 'AKIAIOSFODNN7EXAMPLE',
    apiSecret: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    docsUrl: 'https://docs.aws.amazon.com/s3/',
    dashboardUrl: 'https://console.aws.amazon.com/s3',
    billingType: 'subscription',
    monthlyCostFcfa: 35000,
    billingDetails: 'Abonnement mensuel — Lightsail + S3 + CloudFront',
    config: {
      bucketName: 'fasotravel-media-bf',
      bucketRegion: 'eu-west-3',
      distributionId: 'E1XXXXXXXXX',
      cdnDomain: 'cdn.fasotravel.bf',
      contentTypes: {
        stories: { path: 'stories/', maxSizeMb: 10, formats: ['jpg', 'png', 'mp4'] },
        ticketsPdf: { path: 'tickets/', maxSizeMb: 2, formats: ['pdf'] },
        companyLogos: { path: 'logos/', maxSizeMb: 1, formats: ['png', 'svg'] },
        promoMedia: { path: 'promos/', maxSizeMb: 5, formats: ['jpg', 'png', 'mp4'] },
      },
      lightsailInstance: 'fasotravel-api-prod',
      lightsailRegion: 'eu-west-3',
      apiServicesCount: 12,
      monthlyEstimate: 35000,
    },
    usageStats: {
      apiCallsThisMonth: 45200,
      apiCallsLimit: 0,
      successRate: 99.9,
      avgLatencyMs: 45,
      uptimePercent: 99.99,
      lastHealthCheck: '2026-03-09T08:00:00Z',
      extras: {
        storageUsedGb: 2.8,
        storageLimitGb: 50,
        bandwidthUsedGb: 12.4,
        objectsCount: 3420,
        cdnCacheHitRate: 94.2,
        cdnRequestsThisMonth: 38000,
        lightsailStatus: 'running',
        lightsailCpuAvg: 18,
        lightsailMemoryAvg: 42,
        lightsailDiskUsedPercent: 34,
        storageByType: {
          stories: { count: 1200, sizeMb: 980 },
          tickets: { count: 1800, sizeMb: 420 },
          logos: { count: 45, sizeMb: 12 },
          promos: { count: 375, sizeMb: 650 },
        },
      },
    },
    lastSyncAt: '2026-03-08T06:00:00Z',
    createdAt: '2024-06-01T08:00:00Z',
    updatedAt: '2026-03-08T06:00:00Z'
  }
];

// ==================== FEATURE FLAGS ====================

export const MOCK_FEATURE_FLAGS: FeatureFlag[] = [
  {
    id: 'flag_001',
    name: 'Réservation récurrente',
    key: 'recurring_bookings',
    description: 'Permettre aux passagers de créer des réservations récurrentes',
    enabled: false,
    rolloutPercentage: 0,
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-01-15T10:00:00Z'
  },
  {
    id: 'flag_002',
    name: 'Chat support en direct',
    key: 'live_chat_support',
    description: 'Chat en temps réel pour le support client',
    enabled: true,
    rolloutPercentage: 100,
    enabledAt: '2025-12-01T09:00:00Z',
    createdAt: '2025-11-20T14:00:00Z',
    updatedAt: '2025-12-01T09:00:00Z'
  },
  {
    id: 'flag_003',
    name: 'Programme de fidélité',
    key: 'loyalty_program',
    description: 'Système de points de fidélité pour les passagers',
    enabled: true,
    rolloutPercentage: 50,
    targetCompanies: ['company_001', 'company_002'],
    enabledAt: '2026-01-10T10:00:00Z',
    createdAt: '2026-01-05T12:00:00Z',
    updatedAt: '2026-01-10T10:00:00Z'
  }
];

// ==================== ADVERTISEMENTS ====================

export const MOCK_ADVERTISEMENTS: Advertisement[] = [
  {
    id: 'ad_001',
    title: '🎉 Voyagez confortablement avec TSR',
    description: 'Bus climatisés, Wi-Fi gratuit, sièges confortables. Réservez maintenant sur FasoTravel !',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800',
    ctaText: 'Réserver maintenant',
    actionType: 'internal',
    internalPage: 'operators',
    internalData: { companyId: 'company_001' },
    targetPages: ['home', 'search-results'],
    targetNewUsers: false,
    priority: 8,
    startDate: '2026-02-01T00:00:00Z',
    endDate: '2026-04-30T23:59:59Z',
    impressions: 15420,
    clicks: 782,
    status: 'active',
    createdAt: '2026-01-25T10:00:00Z',
    updatedAt: '2026-02-02T08:00:00Z'
  },
  {
    id: 'ad_002',
    title: '📱 Téléchargez l\'app FasoTravel',
    description: 'Réservez vos trajets en 2 clics ! Disponible sur iOS et Android.',
    mediaType: 'gradient',
    gradient: 'linear-gradient(135deg, #EF2B2D 0%, #FCD116 50%, #009E49 100%)',
    emoji: '🚌',
    ctaText: 'Télécharger',
    actionType: 'external',
    actionUrl: 'https://app.fasotravel.bf',
    targetPages: ['home', 'tickets', 'operators'],
    targetNewUsers: true,
    priority: 10,
    startDate: '2026-01-15T00:00:00Z',
    endDate: '2026-06-15T23:59:59Z',
    impressions: 8932,
    clicks: 1247,
    status: 'active',
    createdAt: '2026-01-10T14:00:00Z',
    updatedAt: '2026-02-02T08:00:00Z'
  },
  {
    id: 'ad_003',
    title: '🌟 Promo STAF Express -30%',
    description: 'Profitez de -30% sur tous les trajets Ouaga-Bobo avec STAF Express ce mois-ci.',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800',
    ctaText: 'Voir les offres',
    actionType: 'internal',
    internalPage: 'search-results',
    internalData: { from: 'Ouagadougou', to: 'Bobo-Dioulasso' },
    targetPages: ['home', 'search-results', 'nearby'],
    targetNewUsers: false,
    priority: 7,
    startDate: '2026-02-10T00:00:00Z',
    endDate: '2026-03-10T23:59:59Z',
    maxImpressions: 50000,
    maxClicks: 5000,
    impressions: 22150,
    clicks: 1893,
    status: 'active',
    createdAt: '2026-02-08T09:00:00Z',
    updatedAt: '2026-02-15T11:00:00Z'
  },
  {
    id: 'ad_004',
    title: '🎬 Découvrez nos nouveaux bus',
    description: 'Rakieta Transport renouvelle sa flotte ! Découvrez nos bus dernière génération.',
    mediaType: 'video',
    mediaUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
    ctaText: 'Regarder la vidéo',
    actionType: 'none',
    targetPages: ['home'],
    targetNewUsers: false,
    priority: 5,
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-02-01T23:59:59Z',
    impressions: 5200,
    clicks: 310,
    status: 'expired',
    createdAt: '2025-12-28T16:00:00Z',
    updatedAt: '2026-02-01T23:59:59Z'
  },
  {
    id: 'ad_005',
    title: '💰 Parrainage FasoTravel',
    description: 'Invitez un ami et gagnez 2 000 FCFA de crédit voyage chacun !',
    mediaType: 'gradient',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    emoji: '🤝',
    ctaText: 'Parrainer un ami',
    actionType: 'internal',
    internalPage: 'profile',
    targetPages: ['home', 'tickets', 'nearby'],
    targetNewUsers: false,
    priority: 6,
    startDate: '2026-03-01T00:00:00Z',
    endDate: '2026-05-31T23:59:59Z',
    impressions: 0,
    clicks: 0,
    status: 'inactive',
    createdAt: '2026-02-28T12:00:00Z',
    updatedAt: '2026-02-28T12:00:00Z'
  }
];

// ==================== REVIEWS ====================
// Les avis sont émis par les passagers APRÈS avoir terminé un voyage
// Ils concernent la SOCIÉTÉ DE TRANSPORT (pas la plateforme)
// Pas de workflow — données collectées telles quelles

export const MOCK_REVIEWS: Review[] = [
  {
    id: 'review_001',
    tripId: 'trip_003',
    passengerId: 'passenger_001',
    passengerName: 'Jean Kouamé',
    companyId: 'company_001',
    companyName: 'TSR Transport',
    routeName: 'Bobo-Dioulasso → Ouagadougou',
    tripDate: '2026-02-20',
    tripTime: '08:00',
    rating: 5,
    comment: 'Excellent voyage ! Bus propre, chauffeur professionnel et ponctuel. Je recommande vivement TSR Transport.',
    helpfulCount: 12,
    createdAt: '2026-02-20T11:30:00Z',
    updatedAt: '2026-02-20T11:30:00Z',
  },
  {
    id: 'review_002',
    tripId: 'trip_006',
    passengerId: 'passenger_002',
    passengerName: 'Aminata Traoré',
    companyId: 'company_002',
    companyName: 'STAF Express',
    routeName: 'Bobo-Dioulasso → Ouagadougou',
    tripDate: '2026-02-19',
    tripTime: '14:30',
    rating: 3,
    comment: 'Service correct mais le bus était en retard de 45 minutes. La climatisation ne fonctionnait pas bien.',
    helpfulCount: 5,
    createdAt: '2026-02-19T21:00:00Z',
    updatedAt: '2026-02-19T21:00:00Z',
  },
  {
    id: 'review_003',
    tripId: 'trip_003',
    passengerId: 'passenger_003',
    passengerName: 'Ibrahim Sawadogo',
    companyId: 'company_001',
    companyName: 'TSR Transport',
    routeName: 'Bobo-Dioulasso → Ouagadougou',
    tripDate: '2026-02-20',
    tripTime: '08:00',
    rating: 1,
    comment: 'Très mauvaise expérience. Le bus est parti avec 2h de retard et le chauffeur conduisait dangereusement.',
    helpfulCount: 20,
    createdAt: '2026-02-20T12:00:00Z',
    updatedAt: '2026-02-20T12:00:00Z',
  },
  {
    id: 'review_004',
    tripId: 'trip_006',
    passengerId: 'passenger_004',
    passengerName: 'Fatou Diallo',
    companyId: 'company_002',
    companyName: 'STAF Express',
    routeName: 'Bobo-Dioulasso → Ouagadougou',
    tripDate: '2026-02-19',
    tripTime: '14:30',
    rating: 4,
    comment: "Bon voyage dans l'ensemble. Le bus était confortable et le personnel aimable.",
    helpfulCount: 3,
    createdAt: '2026-02-19T21:30:00Z',
    updatedAt: '2026-02-19T21:30:00Z',
  },
  {
    id: 'review_005',
    tripId: 'trip_008',
    passengerId: 'passenger_005',
    passengerName: 'Moussa Ouédraogo',
    companyId: 'company_003',
    companyName: 'Rakieta Transport',
    routeName: 'Koudougou → Banfora',
    tripDate: '2026-02-20',
    tripTime: '10:00',
    rating: 2,
    comment: 'Bus sale, pas de climatisation. Voyage très inconfortable.',
    helpfulCount: 8,
    createdAt: '2026-02-20T16:00:00Z',
    updatedAt: '2026-02-20T16:00:00Z',
  },
  {
    id: 'review_006',
    tripId: 'trip_006',
    passengerId: 'passenger_001',
    passengerName: 'Jean Kouamé',
    companyId: 'company_002',
    companyName: 'STAF Express',
    routeName: 'Bobo-Dioulasso → Ouagadougou',
    tripDate: '2026-02-19',
    tripTime: '14:30',
    rating: 4,
    comment: 'Deuxième voyage avec STAF Express, toujours satisfait. Personnel accueillant.',
    helpfulCount: 2,
    createdAt: '2026-02-19T22:00:00Z',
    updatedAt: '2026-02-19T22:00:00Z',
  },
  {
    id: 'review_007',
    tripId: 'trip_003',
    passengerId: 'passenger_006',
    passengerName: 'Adama Compaoré',
    companyId: 'company_001',
    companyName: 'TSR Transport',
    routeName: 'Bobo-Dioulasso → Ouagadougou',
    tripDate: '2026-02-20',
    tripTime: '08:00',
    rating: 4,
    comment: 'Très bon service TSR comme toujours. Le chauffeur était prudent et le bus climatisé.',
    helpfulCount: 6,
    createdAt: '2026-02-20T13:00:00Z',
    updatedAt: '2026-02-20T13:00:00Z',
  },
  {
    id: 'review_008',
    tripId: 'trip_008',
    passengerId: 'passenger_007',
    passengerName: 'Mariam Sanogo',
    companyId: 'company_003',
    companyName: 'Rakieta Transport',
    routeName: 'Koudougou → Banfora',
    tripDate: '2026-02-20',
    tripTime: '10:00',
    rating: 3,
    comment: "Voyage correct pour le prix. Le bus est un peu vieux mais le trajet s'est bien passé.",
    helpfulCount: 1,
    createdAt: '2026-02-20T17:30:00Z',
    updatedAt: '2026-02-20T17:30:00Z',
  },
  {
    id: 'review_009',
    tripId: 'trip_003',
    passengerId: 'passenger_008',
    passengerName: 'Ousmane Kaboré',
    companyId: 'company_001',
    companyName: 'TSR Transport',
    routeName: 'Bobo-Dioulasso → Ouagadougou',
    tripDate: '2026-02-20',
    tripTime: '08:00',
    rating: 5,
    comment: 'Service impeccable. Bus neuf, climatisation parfaite, arrivée en avance !',
    helpfulCount: 15,
    createdAt: '2026-02-20T11:00:00Z',
    updatedAt: '2026-02-20T11:00:00Z',
  },
  {
    id: 'review_010',
    tripId: 'trip_006',
    passengerId: 'passenger_009',
    passengerName: 'Salif Ouattara',
    companyId: 'company_002',
    companyName: 'STAF Express',
    routeName: 'Bobo-Dioulasso → Ouagadougou',
    tripDate: '2026-02-19',
    tripTime: '14:30',
    rating: 1,
    comment: "Très déçu. Le bus avait plus d'une heure de retard et aucune excuse du personnel.",
    helpfulCount: 9,
    createdAt: '2026-02-19T23:00:00Z',
    updatedAt: '2026-02-19T23:00:00Z',
  },
];

// ==================== PROMOTIONS (Réductions de prix par les opérateurs) ====================

export const MOCK_PROMOTIONS: Promotion[] = [
  {
    id: 'promo_001',
    operatorId: 'company_001',
    operatorName: 'TSR Transport',
    title: 'Réduction Saison Sèche -25%',
    description: 'Profitez de 25% de réduction sur tous les trajets TSR pendant la saison sèche',
    code: 'SAISON25',
    discountType: 'percentage',
    discountValue: 25,
    minPurchaseAmount: 3000,
    maxDiscountAmount: 5000,
    usageLimit: 2000,
    usageLimitPerUser: 3,
    usageCount: 847,
    startDate: '2026-02-01T00:00:00Z',
    endDate: '2026-03-31T23:59:59Z',
    isActive: true,
    approvalStatus: 'approved',
    approvedBy: 'admin_001',
    approvedByName: 'Moussa Diarra',
    approvedAt: '2026-01-30T14:00:00Z',
    createdBy: 'operator_001',
    createdByName: 'Amadou Traoré',
    createdAt: '2026-01-28T10:00:00Z',
    updatedAt: '2026-02-27T08:00:00Z'
  },
  {
    id: 'promo_002',
    operatorId: 'company_001',
    operatorName: 'TSR Transport',
    tripRoute: 'Ouagadougou → Bobo-Dioulasso',
    tripId: 'trip_ouaga_bobo_001',
    title: 'TSR Ouaga-Bobo -1500 FCFA',
    description: 'Réduction de 1500 FCFA sur le trajet Ouagadougou - Bobo-Dioulasso',
    discountType: 'fixed',
    discountValue: 1500,
    minPurchaseAmount: 5000,
    usageLimit: 500,
    usageLimitPerUser: 2,
    usageCount: 213,
    startDate: '2026-02-15T00:00:00Z',
    endDate: '2026-03-15T23:59:59Z',
    isActive: true,
    approvalStatus: 'approved',
    approvedBy: 'admin_003',
    approvedByName: 'Ibrahim Kaboré',
    approvedAt: '2026-02-14T09:00:00Z',
    createdBy: 'operator_001',
    createdByName: 'Amadou Traoré',
    createdAt: '2026-02-12T16:00:00Z',
    updatedAt: '2026-02-27T08:00:00Z'
  },
  {
    id: 'promo_003',
    operatorId: 'company_002',
    operatorName: 'STAF',
    title: 'STAF Étudiants -20%',
    description: 'Tarif spécial étudiants sur tous les trajets STAF. Carte étudiante requise à l\'embarquement.',
    code: 'ETUDIANT20',
    discountType: 'percentage',
    discountValue: 20,
    usageLimit: 1000,
    usageLimitPerUser: 1,
    usageCount: 456,
    startDate: '2026-01-15T00:00:00Z',
    endDate: '2026-06-30T23:59:59Z',
    isActive: true,
    approvalStatus: 'approved',
    approvedBy: 'admin_001',
    approvedByName: 'Moussa Diarra',
    approvedAt: '2026-01-14T11:00:00Z',
    createdBy: 'operator_staf_001',
    createdByName: 'Ibrahim Sawadogo',
    createdAt: '2026-01-12T08:00:00Z',
    updatedAt: '2026-02-27T08:00:00Z'
  },
  {
    id: 'promo_004',
    operatorId: 'company_003',
    operatorName: 'Rakieta Transport',
    tripRoute: 'Ouagadougou → Koudougou',
    tripId: 'trip_ouaga_koudougou_001',
    title: 'Lancement Ouaga-Koudougou',
    description: 'Prix de lancement pour la nouvelle ligne Ouagadougou - Koudougou. Offre limitée !',
    discountType: 'percentage',
    discountValue: 30,
    usageLimit: 300,
    usageLimitPerUser: 2,
    usageCount: 12,
    startDate: '2026-03-01T00:00:00Z',
    endDate: '2026-03-31T23:59:59Z',
    isActive: false,
    approvalStatus: 'pending',
    createdBy: 'operator_006',
    createdByName: 'Ibrahim Sawadogo',
    createdAt: '2026-02-25T14:00:00Z',
    updatedAt: '2026-02-25T14:00:00Z'
  },
  {
    id: 'promo_005',
    operatorId: 'company_002',
    operatorName: 'STAF',
    tripRoute: 'Bobo-Dioulasso → Banfora',
    tripId: 'trip_bobo_banfora_001',
    title: 'STAF Bobo-Banfora -2000 FCFA',
    description: 'Réduction spéciale sur la ligne Bobo-Banfora pour le weekend',
    discountType: 'fixed',
    discountValue: 2000,
    minPurchaseAmount: 4000,
    usageLimit: 200,
    usageLimitPerUser: 1,
    usageCount: 45,
    startDate: '2026-02-20T00:00:00Z',
    endDate: '2026-03-10T23:59:59Z',
    isActive: false,
    approvalStatus: 'pending',
    createdBy: 'operator_staf_001',
    createdByName: 'Ibrahim Sawadogo',
    createdAt: '2026-02-18T10:00:00Z',
    updatedAt: '2026-02-18T10:00:00Z'
  },
  {
    id: 'promo_006',
    operatorId: 'company_001',
    operatorName: 'TSR Transport',
    title: 'Nouvel An TSR -50%',
    description: 'Promo exceptionnelle du Nouvel An sur tous les trajets TSR',
    code: 'NEWYEAR50',
    discountType: 'percentage',
    discountValue: 50,
    usageLimit: 1000,
    usageLimitPerUser: 2,
    usageCount: 1000,
    startDate: '2025-12-28T00:00:00Z',
    endDate: '2026-01-05T23:59:59Z',
    isActive: false,
    approvalStatus: 'approved',
    approvedBy: 'admin_001',
    approvedByName: 'Moussa Diarra',
    approvedAt: '2025-12-27T10:00:00Z',
    createdBy: 'operator_001',
    createdByName: 'Amadou Traoré',
    createdAt: '2025-12-20T10:00:00Z',
    updatedAt: '2026-01-06T00:00:00Z'
  },
  {
    id: 'promo_007',
    operatorId: 'company_003',
    operatorName: 'Rakieta Transport',
    title: 'Rakieta Flash -15%',
    description: 'Réduction flash de 15% sur tous les trajets Rakieta ce weekend uniquement',
    discountType: 'percentage',
    discountValue: 15,
    usageLimit: 100,
    usageCount: 100,
    startDate: '2026-02-08T00:00:00Z',
    endDate: '2026-02-09T23:59:59Z',
    isActive: false,
    approvalStatus: 'approved',
    approvedBy: 'admin_003',
    approvedByName: 'Ibrahim Kaboré',
    approvedAt: '2026-02-07T16:00:00Z',
    createdBy: 'operator_006',
    createdByName: 'Ibrahim Sawadogo',
    createdAt: '2026-02-06T09:00:00Z',
    updatedAt: '2026-02-10T00:00:00Z'
  },
  {
    id: 'promo_008',
    operatorId: 'company_002',
    operatorName: 'STAF',
    title: 'STAF Famille -3000 FCFA',
    description: 'Réduction famille : -3000 FCFA pour les groupes de 4+ passagers',
    discountType: 'fixed',
    discountValue: 3000,
    minPurchaseAmount: 10000,
    usageLimit: 150,
    usageLimitPerUser: 1,
    usageCount: 8,
    startDate: '2026-03-05T00:00:00Z',
    endDate: '2026-04-05T23:59:59Z',
    isActive: false,
    approvalStatus: 'rejected',
    approvedBy: 'admin_001',
    approvedByName: 'Moussa Diarra',
    approvedAt: '2026-02-26T11:00:00Z',
    rejectionReason: 'Réduction trop élevée par rapport au prix minimum. Veuillez proposer une réduction de 2000 FCFA maximum.',
    createdBy: 'operator_staf_001',
    createdByName: 'Ibrahim Sawadogo',
    createdAt: '2026-02-24T15:00:00Z',
    updatedAt: '2026-02-26T11:00:00Z'
  },
  {
    id: 'promo_009',
    operatorId: 'company_001',
    operatorName: 'TSR Transport',
    tripRoute: 'Ouagadougou → Kaya',
    tripId: 'trip_ouaga_kaya_001',
    title: 'TSR Ouaga-Kaya Promo',
    description: 'Prix spécial sur la ligne Ouagadougou - Kaya pendant le mois de mars',
    discountType: 'percentage',
    discountValue: 10,
    usageLimit: 400,
    usageLimitPerUser: 3,
    usageCount: 0,
    startDate: '2026-03-01T00:00:00Z',
    endDate: '2026-03-31T23:59:59Z',
    isActive: false,
    approvalStatus: 'pending',
    createdBy: 'operator_001',
    createdByName: 'Amadou Traoré',
    createdAt: '2026-02-27T09:00:00Z',
    updatedAt: '2026-02-27T09:00:00Z'
  }
];

export const MOCK_PROMOTION_STATS: PromotionStats = {
  total: 9,
  active: 3,
  pending: 3,
  expired: 2,
  rejected: 1,
  totalUsage: 2681,
  totalSavings: 4250000, // ~4.25M FCFA d'économies générées
  avgDiscountPercent: 23.4
};

// ==================== USER SESSIONS ====================

export const MOCK_USER_SESSIONS: UserSession[] = [
  {
    id: 'session_001',
    userId: 'admin_001',
    userName: 'Moussa Diarra',
    userType: 'admin',
    deviceType: 'web',
    deviceInfo: 'Chrome 120 on Windows 10',
    ipAddress: '41.188.12.34',
    location: 'Ouagadougou, Burkina Faso',
    loginAt: '2026-02-02T08:00:00Z',
    lastActivityAt: '2026-02-02T08:45:00Z',
    active: true
  },
  {
    id: 'session_002',
    userId: 'passenger_001',
    userName: 'Jean Kouamé',
    userType: 'passenger',
    deviceType: 'mobile',
    deviceInfo: 'Android 13',
    ipAddress: '41.188.23.45',
    location: 'Ouagadougou, Burkina Faso',
    loginAt: '2026-02-02T07:30:00Z',
    lastActivityAt: '2026-02-02T08:15:00Z',
    active: true
  },
  {
    id: 'session_003',
    userId: 'operator_002',
    userName: 'Salif Ouattara',
    userType: 'operator',
    deviceType: 'web',
    deviceInfo: 'Firefox 121 on macOS',
    ipAddress: '41.188.34.56',
    location: 'Ouagadougou, Burkina Faso',
    loginAt: '2026-02-01T17:30:00Z',
    logoutAt: '2026-02-01T23:00:00Z',
    lastActivityAt: '2026-02-01T22:58:00Z',
    active: false
  }
];

// ==================== OPERATOR POLICIES ====================

export const MOCK_OPERATOR_POLICIES: OperatorPolicy[] = [
  // ===== POLITIQUES PLATEFORME (émises par FasoTravel) =====
  {
    id: 'policy_001',
    type: 'cancellation',
    title: 'Politique d\'annulation standard FasoTravel',
    description: 'Annulation gratuite jusqu\'à 24h avant le départ. Entre 12h et 24h : remboursement à 50%. Moins de 12h : aucun remboursement. S\'applique à toutes les sociétés partenaires.',
    rules: { freeCancellationHours: 24, partialRefundHours: 12, refundPercentage: { moreThan24h: 100, between12and24h: 50, lessThan12h: 0 } },
    source: 'platform',
    status: 'active',
    effectiveFrom: '2024-06-01T00:00:00Z',
    createdBy: 'admin_001',
    createdByName: 'Moussa Diarra',
    createdAt: '2024-05-20T10:00:00Z',
    updatedAt: '2024-05-20T10:00:00Z'
  },
  {
    id: 'policy_002',
    type: 'transfer',
    title: 'Politique de transfert de billet FasoTravel',
    description: 'Le transfert de billet est autorisé jusqu\'à 6h avant le départ moyennant des frais de 500 FCFA. Le nouveau passager doit fournir une pièce d\'identité valide.',
    rules: { transferDeadlineHours: 6, transferFee: 500, requiresId: true },
    source: 'platform',
    status: 'active',
    effectiveFrom: '2024-06-01T00:00:00Z',
    createdBy: 'admin_001',
    createdByName: 'Moussa Diarra',
    createdAt: '2024-05-20T10:00:00Z',
    updatedAt: '2024-05-20T10:00:00Z'
  },
  {
    id: 'policy_003',
    type: 'baggage',
    title: 'Franchise bagages standard',
    description: 'Chaque passager a droit à 1 bagage de 25kg inclus. Tout excédent sera facturé selon la grille tarifaire de la société de transport.',
    rules: { includedBagsCount: 1, maxWeightKg: 25, overweightFeePerKg: 200 },
    source: 'platform',
    status: 'active',
    effectiveFrom: '2024-06-01T00:00:00Z',
    createdBy: 'admin_001',
    createdByName: 'Moussa Diarra',
    createdAt: '2024-05-20T10:00:00Z',
    updatedAt: '2024-08-15T09:00:00Z'
  },
  {
    id: 'policy_004',
    type: 'delay',
    title: 'Politique retard et compensation',
    description: 'En cas de retard supérieur à 2h, le passager peut demander un report gratuit. Au-delà de 4h, un remboursement intégral est proposé.',
    rules: { freeRescheduleAfterMinutes: 120, fullRefundAfterMinutes: 240 },
    source: 'platform',
    status: 'active',
    effectiveFrom: '2024-07-01T00:00:00Z',
    createdBy: 'admin_001',
    createdByName: 'Moussa Diarra',
    createdAt: '2024-06-25T14:00:00Z',
    updatedAt: '2024-06-25T14:00:00Z'
  },
  // ===== POLITIQUES SOCIÉTÉS (émises par les sociétés) =====
  {
    id: 'policy_101',
    companyId: 'company_001',
    companyName: 'TSR Transport',
    type: 'cancellation',
    title: 'Annulation TSR — Conditions spéciales',
    description: 'TSR Transport applique un remboursement de 75% entre 6h et 24h avant le départ. Annulation gratuite sous 48h. Politique plus favorable que le standard plateforme.',
    rules: { freeCancellationHours: 48, partialRefundHours: 6, refundPercentage: { moreThan48h: 100, between6and48h: 75, lessThan6h: 0 } },
    source: 'company',
    status: 'active',
    complianceStatus: 'compliant',
    effectiveFrom: '2024-07-15T00:00:00Z',
    createdBy: 'operator_tsr_001',
    createdByName: 'Direction TSR',
    createdAt: '2024-07-10T08:00:00Z',
    updatedAt: '2024-07-10T08:00:00Z'
  },
  {
    id: 'policy_102',
    companyId: 'company_001',
    companyName: 'TSR Transport',
    type: 'baggage',
    title: 'Bagages TSR — Franchise étendue',
    description: 'TSR offre 2 bagages de 30kg chacun inclus dans le prix du billet. Excédent : 150 FCFA/kg. Colis volumineux sur demande préalable.',
    rules: { includedBagsCount: 2, maxWeightKg: 30, overweightFeePerKg: 150, bulkyItemsAllowed: true },
    source: 'company',
    status: 'active',
    complianceStatus: 'compliant',
    effectiveFrom: '2024-07-15T00:00:00Z',
    createdBy: 'operator_tsr_001',
    createdByName: 'Direction TSR',
    createdAt: '2024-07-10T08:30:00Z',
    updatedAt: '2024-07-10T08:30:00Z'
  },
  {
    id: 'policy_103',
    companyId: 'company_001',
    companyName: 'TSR Transport',
    type: 'transfer',
    title: 'Transfert billet TSR',
    description: 'TSR autorise le transfert gratuit jusqu\'à 12h avant le départ. Passé ce délai, frais de 300 FCFA.',
    rules: { freeTransferHours: 12, lateTransferFee: 300, requiresId: true },
    source: 'company',
    status: 'active',
    complianceStatus: 'compliant',
    effectiveFrom: '2024-07-15T00:00:00Z',
    createdBy: 'operator_tsr_001',
    createdByName: 'Direction TSR',
    createdAt: '2024-07-10T09:00:00Z',
    updatedAt: '2024-07-10T09:00:00Z'
  },
  {
    id: 'policy_201',
    companyId: 'company_002',
    companyName: 'STAF Express',
    type: 'cancellation',
    title: 'Annulation STAF Express',
    description: 'STAF applique le standard plateforme avec un bonus : remboursement à 60% entre 6h et 12h. Annulation gratuite sous 24h.',
    rules: { freeCancellationHours: 24, refundPercentage: { moreThan24h: 100, between12and24h: 60, between6and12h: 30, lessThan6h: 0 } },
    source: 'company',
    status: 'active',
    complianceStatus: 'compliant',
    effectiveFrom: '2024-08-01T00:00:00Z',
    createdBy: 'operator_staf_001',
    createdByName: 'Direction STAF',
    createdAt: '2024-07-28T10:00:00Z',
    updatedAt: '2024-07-28T10:00:00Z'
  },
  {
    id: 'policy_202',
    companyId: 'company_002',
    companyName: 'STAF Express',
    type: 'baggage',
    title: 'Politique bagages STAF Express',
    description: '1 bagage de 25kg inclus. Excédent : 250 FCFA/kg. Animaux de compagnie interdits en soute.',
    rules: { includedBagsCount: 1, maxWeightKg: 25, overweightFeePerKg: 250, petsAllowed: false },
    source: 'company',
    status: 'active',
    complianceStatus: 'compliant',
    effectiveFrom: '2024-08-01T00:00:00Z',
    createdBy: 'operator_staf_001',
    createdByName: 'Direction STAF',
    createdAt: '2024-07-28T10:30:00Z',
    updatedAt: '2024-07-28T10:30:00Z'
  },
  {
    id: 'policy_203',
    companyId: 'company_002',
    companyName: 'STAF Express',
    type: 'delay',
    title: 'Retard STAF — Garantie ponctualité',
    description: 'STAF garantit un départ dans les 30 minutes. Au-delà, report gratuit ou bon de 1000 FCFA pour le prochain voyage.',
    rules: { maxDelayMinutes: 30, compensationType: 'voucher', voucherAmount: 1000 },
    source: 'company',
    status: 'active',
    complianceStatus: 'review_needed',
    complianceNote: 'Vérifier si le bon de 1000 FCFA est compatible avec les conditions de la plateforme',
    effectiveFrom: '2024-08-01T00:00:00Z',
    createdBy: 'operator_staf_001',
    createdByName: 'Direction STAF',
    createdAt: '2024-07-28T11:00:00Z',
    updatedAt: '2024-07-28T11:00:00Z'
  },
  {
    id: 'policy_301',
    companyId: 'company_003',
    companyName: 'Rakieta Transport',
    type: 'cancellation',
    title: 'Annulation Rakieta',
    description: 'Rakieta applique le standard plateforme. Annulation gratuite sous 24h, 50% entre 12h-24h, aucun remboursement après.',
    rules: { freeCancellationHours: 24, refundPercentage: { moreThan24h: 100, between12and24h: 50, lessThan12h: 0 } },
    source: 'company',
    status: 'active',
    complianceStatus: 'compliant',
    effectiveFrom: '2024-09-01T00:00:00Z',
    createdBy: 'operator_rakieta_001',
    createdByName: 'Direction Rakieta',
    createdAt: '2024-08-25T09:00:00Z',
    updatedAt: '2024-08-25T09:00:00Z'
  },
  {
    id: 'policy_302',
    companyId: 'company_003',
    companyName: 'Rakieta Transport',
    type: 'general',
    title: 'Conditions générales Rakieta',
    description: 'Les passagers doivent se présenter au moins 30 minutes avant le départ. Les mineurs non accompagnés doivent avoir une autorisation parentale signée.',
    rules: { minCheckInMinutes: 30, minorRequiresAuthorization: true, minAge: 5 },
    source: 'company',
    status: 'active',
    complianceStatus: 'compliant',
    effectiveFrom: '2024-09-01T00:00:00Z',
    createdBy: 'operator_rakieta_001',
    createdByName: 'Direction Rakieta',
    createdAt: '2024-08-25T09:30:00Z',
    updatedAt: '2024-08-25T09:30:00Z'
  },
  {
    id: 'policy_401',
    companyId: 'company_004',
    companyName: 'SOGEBAF',
    type: 'cancellation',
    title: 'Annulation SOGEBAF — Stricte',
    description: 'SOGEBAF n\'autorise aucun remboursement après achat. Seul le report gratuit est possible sous 48h avant le départ.',
    rules: { noRefund: true, freeRescheduleHours: 48, rescheduleOnly: true },
    source: 'company',
    status: 'active',
    complianceStatus: 'non_compliant',
    complianceNote: 'Non conforme au standard plateforme : le refus total de remboursement contrevient à la politique minimale FasoTravel',
    effectiveFrom: '2024-10-01T00:00:00Z',
    createdBy: 'operator_sogebaf_001',
    createdByName: 'Direction SOGEBAF',
    createdAt: '2024-09-20T14:00:00Z',
    updatedAt: '2024-09-20T14:00:00Z'
  },
  {
    id: 'policy_402',
    companyId: 'company_004',
    companyName: 'SOGEBAF',
    type: 'baggage',
    title: 'Bagages SOGEBAF',
    description: '1 bagage de 20kg maximum. Excédent : 300 FCFA/kg. Objets fragiles sous responsabilité du passager.',
    rules: { includedBagsCount: 1, maxWeightKg: 20, overweightFeePerKg: 300, fragileDisclaimer: true },
    source: 'company',
    status: 'active',
    complianceStatus: 'compliant',
    effectiveFrom: '2024-10-01T00:00:00Z',
    createdBy: 'operator_sogebaf_001',
    createdByName: 'Direction SOGEBAF',
    createdAt: '2024-09-20T14:30:00Z',
    updatedAt: '2024-09-20T14:30:00Z'
  },
];

// ==================== PLATFORM POLICIES (Pages légales FasoTravel) ====================

export const MOCK_PLATFORM_POLICIES: PlatformPolicy[] = [
  {
    id: 'plat_001',
    type: 'privacy',
    title: 'Politique de Confidentialité FasoTravel',
    summary: 'Comment FasoTravel collecte, utilise et protège vos données personnelles.',
    content: `# Politique de Confidentialité FasoTravel

**Dernière mise à jour : 1er janvier 2025**

## 1. Collecte des données
FasoTravel collecte les données suivantes lors de votre utilisation de la plateforme :
- Nom complet et numéro de téléphone (inscription)
- Adresse email (optionnelle)
- Historique des réservations et voyages
- Données de localisation (avec votre consentement)
- Informations de paiement (traitées par PayDunya)

## 2. Utilisation des données
Vos données sont utilisées pour :
- Traiter vos réservations et billets
- Vous envoyer des notifications relatives à vos voyages
- Améliorer nos services et l'expérience utilisateur
- Assurer la sécurité de votre compte

## 3. Partage des données
Vos données sont partagées avec :
- Les sociétés de transport (nom et numéro de siège uniquement)
- PayDunya (pour le traitement des paiements)
- WhatsApp Business (pour l'envoi de messages/OTP)

## 4. Sécurité
Nous utilisons le chiffrement SSL/TLS et stockons vos données sur des serveurs sécurisés AWS au niveau international.

## 5. Vos droits
Vous pouvez demander l'accès, la modification ou la suppression de vos données en contactant support@fasotravel.bf.`,
    version: '2.0',
    status: 'published',
    scope: 'global',
    publishedAt: '2025-01-01T00:00:00Z',
    lastPublishedVersion: '1.0',
    createdBy: 'admin_001',
    createdByName: 'Moussa Diarra',
    createdAt: '2024-05-15T10:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'plat_002',
    type: 'terms',
    title: 'Conditions Générales d\'Utilisation',
    summary: 'Les règles régissant l\'utilisation de la plateforme FasoTravel.',
    content: `# Conditions Générales d'Utilisation FasoTravel

**Dernière mise à jour : 1er janvier 2025**

## 1. Objet
Les présentes CGU régissent l'utilisation de la plateforme FasoTravel, service de réservation de billets de transport au Burkina Faso.

## 2. Inscription
- L'utilisateur doit fournir un numéro de téléphone valide
- La vérification par OTP est obligatoire
- L'âge minimum est de 16 ans (ou accompagné d'un tuteur)

## 3. Réservations et paiements
- Les prix affichés sont en FCFA et incluent toutes les taxes
- Des frais de service de 100 FCFA s'appliquent par billet
- Les frais PayDunya (1% Mobile Money, 3.5% Carte) sont à la charge du client
- FasoTravel ne gère aucun paiement en espèces

## 4. Annulations et remboursements
- Les politiques d'annulation varient selon les sociétés de transport
- Le standard minimum FasoTravel garantit un remboursement intégral sous 24h
- Les remboursements sont effectués via le même moyen de paiement

## 5. Responsabilités
- FasoTravel agit en tant qu'intermédiaire entre passagers et sociétés de transport
- La responsabilité du transport incombe à la société de transport
- FasoTravel ne peut être tenu responsable des retards ou annulations

## 6. Litiges
Tout litige sera soumis aux tribunaux compétents de Ouagadougou, Burkina Faso.`,
    version: '2.1',
    status: 'published',
    scope: 'global',
    publishedAt: '2025-01-15T00:00:00Z',
    lastPublishedVersion: '2.0',
    createdBy: 'admin_001',
    createdByName: 'Moussa Diarra',
    createdAt: '2024-05-15T10:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z'
  },
  {
    id: 'plat_003',
    type: 'platform_rule',
    title: 'Charte des sociétés partenaires',
    summary: 'Règles que chaque société partenaire doit respecter sur la plateforme FasoTravel.',
    content: `# Charte des Sociétés Partenaires FasoTravel

## 1. Standards de service minimum
- Départ dans les 30 minutes suivant l'heure prévue
- Véhicule en bon état, nettoyé avant chaque trajet
- Conducteur avec permis valide et attestation médicale

## 2. Obligations d'information
- Afficher clairement les politiques d'annulation et de bagages
- Informer les passagers en cas de retard via la plateforme
- Mettre à jour les capacités en temps réel

## 3. Commission et paiements
- Commission FasoTravel de 5% sur chaque billet
- Frais de service de 100 FCFA par billet (reversés à FasoTravel)
- Split Payment PayDunya automatique

## 4. Non-conformité
- Premier avertissement écrit
- Suspension temporaire après 3 avertissements
- Exclusion définitive en cas de manquement grave`,
    version: '1.2',
    status: 'published',
    scope: 'company_addon',
    publishedAt: '2025-02-01T00:00:00Z',
    lastPublishedVersion: '1.1',
    createdBy: 'admin_001',
    createdByName: 'Moussa Diarra',
    createdAt: '2024-06-01T10:00:00Z',
    updatedAt: '2025-02-01T00:00:00Z'
  },
  {
    id: 'plat_004',
    type: 'platform_rule',
    title: 'Protection des passagers — Règles minimales',
    summary: 'Garanties minimales que chaque société doit offrir aux passagers.',
    content: `# Protection des Passagers — Règles Minimales

## Remboursement minimum
Toute société doit offrir au minimum un remboursement de 50% pour une annulation effectuée plus de 12h avant le départ.

## Franchise bagages minimum
Au minimum 1 bagage de 20kg doit être inclus dans le prix du billet.

## Information préalable
Le passager doit recevoir un SMS de confirmation avec : numéro de billet, heure de départ, gare, et numéro de siège.`,
    version: '1.0',
    status: 'draft',
    scope: 'company_addon',
    createdBy: 'admin_002',
    createdByName: 'Aminata Traoré',
    createdAt: '2025-03-01T10:00:00Z',
    updatedAt: '2025-03-01T10:00:00Z'
  },
];

// ==================== OPERATOR SERVICES ====================

export const MOCK_OPERATOR_SERVICES: OperatorService[] = [
  {
    id: 'service_001',
    companyId: 'company_001',
    companyName: 'TSR Transport',
    type: 'luggage',
    name: 'Bagage supplémentaire',
    description: 'Bagage au-delà de la franchise de 20kg',
    price: 1000,
    currency: 'FCFA',
    status: 'active',
    createdAt: '2024-06-15T10:00:00Z',
    updatedAt: '2024-06-15T10:00:00Z'
  },
  {
    id: 'service_002',
    companyId: 'company_001',
    companyName: 'TSR Transport',
    type: 'wifi',
    name: 'Wi-Fi Premium',
    description: 'Accès Wi-Fi haut débit pendant le trajet',
    price: 500,
    currency: 'FCFA',
    status: 'active',
    createdAt: '2024-06-15T10:00:00Z',
    updatedAt: '2024-06-15T10:00:00Z'
  },
  {
    id: 'service_003',
    companyId: 'company_002',
    companyName: 'STAF Express',
    type: 'food',
    name: 'Repas à bord',
    description: 'Repas chaud servi pendant le voyage',
    price: 2000,
    currency: 'FCFA',
    status: 'active',
    createdAt: '2024-08-20T12:00:00Z',
    updatedAt: '2024-08-20T12:00:00Z'
  }
];

// ==================== USER STATS ====================

export const MOCK_USER_STATS: UserStats = {
  totalUsers: 8542,
  activeUsers: 7834,
  inactiveUsers: 567,
  suspendedUsers: 141,
  
  todayRegistrations: 12,
  weekRegistrations: 89,
  monthRegistrations: 342,
  
  verifiedUsers: 7123,
  unverifiedUsers: 1419
};

// ==================== TRIPS (TRAJETS) ====================
// Trajets créés par les sociétés de transport

export const MOCK_TRIPS: Trip[] = [
  // TSR Transport - Trajets actifs
  {
    id: 'trip_001',
    companyId: 'company_001',
    routeId: 'route_001',
    vehicleId: 'vehicle_001',
    driverId: 'operator_001',
    departureStationId: 'station_001',
    arrivalStationId: 'station_002',
    scheduledDeparture: '2026-02-20T08:00:00Z',
    scheduledArrival: '2026-02-20T12:00:00Z',
    actualDeparture: '2026-02-20T08:15:00Z',
    status: 'active',
    price: 5000,
    currency: 'FCFA',
    availableSeats: 8,
    totalSeats: 40,
    bookedSeats: 32,
    createdAt: '2026-02-15T10:00:00Z',
    updatedAt: '2026-02-20T08:15:00Z'
  },
  {
    id: 'trip_002',
    companyId: 'company_001',
    routeId: 'route_002',
    vehicleId: 'vehicle_002',
    driverId: 'operator_002',
    departureStationId: 'station_001',
    arrivalStationId: 'station_003',
    scheduledDeparture: '2026-02-20T14:00:00Z',
    scheduledArrival: '2026-02-20T17:00:00Z',
    status: 'scheduled',
    price: 4500,
    currency: 'FCFA',
    availableSeats: 12,
    totalSeats: 35,
    bookedSeats: 23,
    createdAt: '2026-02-15T10:30:00Z',
    updatedAt: '2026-02-19T16:00:00Z'
  },
  {
    id: 'trip_003',
    companyId: 'company_001',
    routeId: 'route_001',
    vehicleId: 'vehicle_003',
    driverId: 'operator_003',
    departureStationId: 'station_002',
    arrivalStationId: 'station_001',
    scheduledDeparture: '2026-02-20T06:00:00Z',
    scheduledArrival: '2026-02-20T10:00:00Z',
    actualDeparture: '2026-02-20T06:00:00Z',
    actualArrival: '2026-02-20T09:50:00Z',
    status: 'completed',
    price: 5000,
    currency: 'FCFA',
    availableSeats: 0,
    totalSeats: 40,
    bookedSeats: 40,
    createdAt: '2026-02-14T09:00:00Z',
    updatedAt: '2026-02-20T09:50:00Z'
  },
  
  // STAF Express - Trajets actifs
  {
    id: 'trip_004',
    companyId: 'company_002',
    routeId: 'route_003',
    vehicleId: 'vehicle_004',
    driverId: 'operator_004',
    departureStationId: 'station_002',
    arrivalStationId: 'station_004',
    scheduledDeparture: '2026-02-20T09:00:00Z',
    scheduledArrival: '2026-02-20T13:00:00Z',
    status: 'active',
    price: 6000,
    currency: 'FCFA',
    availableSeats: 5,
    totalSeats: 45,
    bookedSeats: 40,
    createdAt: '2026-02-16T11:00:00Z',
    updatedAt: '2026-02-20T09:00:00Z'
  },
  {
    id: 'trip_005',
    companyId: 'company_002',
    routeId: 'route_004',
    vehicleId: 'vehicle_005',
    driverId: 'operator_005',
    departureStationId: 'station_001',
    arrivalStationId: 'station_005',
    scheduledDeparture: '2026-02-20T15:00:00Z',
    scheduledArrival: '2026-02-20T18:00:00Z',
    status: 'scheduled',
    price: 4000,
    currency: 'FCFA',
    availableSeats: 18,
    totalSeats: 38,
    bookedSeats: 20,
    createdAt: '2026-02-17T14:00:00Z',
    updatedAt: '2026-02-19T10:00:00Z'
  },
  {
    id: 'trip_006',
    companyId: 'company_002',
    routeId: 'route_003',
    vehicleId: 'vehicle_006',
    driverId: 'operator_006',
    departureStationId: 'station_002',
    arrivalStationId: 'station_001',
    scheduledDeparture: '2026-02-19T16:00:00Z',
    scheduledArrival: '2026-02-19T20:00:00Z',
    actualDeparture: '2026-02-19T16:10:00Z',
    actualArrival: '2026-02-19T20:05:00Z',
    status: 'completed',
    price: 6000,
    currency: 'FCFA',
    availableSeats: 0,
    totalSeats: 45,
    bookedSeats: 45,
    createdAt: '2026-02-15T12:00:00Z',
    updatedAt: '2026-02-19T20:05:00Z'
  },
  
  // Rakieta Transport - Trajets avec annulation
  {
    id: 'trip_007',
    companyId: 'company_003',
    routeId: 'route_005',
    vehicleId: 'vehicle_007',
    driverId: 'operator_007',
    departureStationId: 'station_001',
    arrivalStationId: 'station_004',
    scheduledDeparture: '2026-02-20T10:00:00Z',
    scheduledArrival: '2026-02-20T14:00:00Z',
    status: 'cancelled',
    price: 5500,
    currency: 'FCFA',
    availableSeats: 30,
    totalSeats: 30,
    bookedSeats: 0,
    cancelledReason: 'Panne mécanique du véhicule',
    cancelledAt: '2026-02-20T07:00:00Z',
    createdAt: '2026-02-18T10:00:00Z',
    updatedAt: '2026-02-20T07:00:00Z'
  },
  {
    id: 'trip_008',
    companyId: 'company_003',
    routeId: 'route_006',
    vehicleId: 'vehicle_008',
    driverId: 'operator_008',
    departureStationId: 'station_003',
    arrivalStationId: 'station_005',
    scheduledDeparture: '2026-02-20T12:00:00Z',
    scheduledArrival: '2026-02-20T15:00:00Z',
    status: 'active',
    price: 3500,
    currency: 'FCFA',
    availableSeats: 20,
    totalSeats: 28,
    bookedSeats: 8,
    createdAt: '2026-02-18T15:00:00Z',
    updatedAt: '2026-02-19T11:00:00Z'
  }
];

// ==================== TRIP STATISTICS ====================
// Stats par société pour la page TripManagement (Admin)

export interface CompanyTripSummary {
  company_id: string;
  company_name: string;
  status: 'active' | 'inactive';
  
  // Trajets du jour
  active_trips: number;
  completed_today: number;
  cancelled_today: number;
  
  // Occupation
  total_seats: number;
  occupied_seats: number;
  occupancy_rate: number;
  
  // Revenus
  avg_revenue_per_trip: number;
  total_revenue_today: number;
}

export const MOCK_COMPANY_TRIP_SUMMARIES: CompanyTripSummary[] = [
  {
    company_id: 'company_001',
    company_name: 'TSR Transport',
    status: 'active',
    active_trips: 12,
    completed_today: 24,
    cancelled_today: 1,
    total_seats: 480,
    occupied_seats: 398,
    occupancy_rate: 82.9,
    avg_revenue_per_trip: 182000,
    total_revenue_today: 4368000
  },
  {
    company_id: 'company_002',
    company_name: 'STAF Express',
    status: 'active',
    active_trips: 8,
    completed_today: 18,
    cancelled_today: 0,
    total_seats: 360,
    occupied_seats: 289,
    occupancy_rate: 80.3,
    avg_revenue_per_trip: 215000,
    total_revenue_today: 3870000
  },
  {
    company_id: 'company_003',
    company_name: 'Rakieta Transport',
    status: 'active',
    active_trips: 5,
    completed_today: 11,
    cancelled_today: 3,
    total_seats: 180,
    occupied_seats: 98,
    occupancy_rate: 54.4,
    avg_revenue_per_trip: 142000,
    total_revenue_today: 1562000
  }
];

// Stats globales des trajets
export interface GlobalTripStats {
  totalActiveTrips: number;
  totalCompletedToday: number;
  totalCancelledToday: number;
  totalRevenueToday: number;
  avgOccupancyRate: number;
  topPerformingCompany: string;
}

export const MOCK_GLOBAL_TRIP_STATS: GlobalTripStats = {
  totalActiveTrips: 25,
  totalCompletedToday: 53,
  totalCancelledToday: 4,
  totalRevenueToday: 9800000,
  avgOccupancyRate: 72.5,
  topPerformingCompany: 'TSR Transport'
};

// ==================== BOOKINGS / RÉSERVATIONS ====================
// Réservations effectuées par les passagers (App Mobile)
// L'Admin supervise mais ne gère pas directement
// 
// LOGIQUE MÉTIER:
// 1. Passager crée une réservation → EN_ATTENTE (en attente de paiement)
// 2. Passager paie → CONFIRMÉ (génère un BILLET ACTIF)
// 3. Voyage terminé → TERMINÉ
// 4. Annulation → ANNULÉ

// Types importés depuis la source de vérité (ZÉRO duplication)
// Re-export pour compatibilité avec les fichiers qui importent depuis ici
export type { BookingStatus, Booking, BookingStats } from '../shared/types/standardized';
import type { Booking } from '../shared/types/standardized';

// Réservations Mock (Échantillon représentatif)
export const MOCK_BOOKINGS: Booking[] = [
  // EN_ATTENTE - Réservations en attente de paiement
  {
    booking_id: 'BKG-2026-001240',
    passenger_name: 'Moussa Sana',
    passenger_email: 'moussa.s@gmail.com',
    passenger_phone: '+22670999888',
    user_id: 'pass_040',
    trip_route: 'Ouagadougou → Kaya',
    company_name: 'TSR Transport',
    num_passengers: 2,
    selected_seats: ['A5', 'A6'],
    price_per_seat: 5000,
    total_amount: 10000,
    currency: 'FCFA',
    status: 'pending',
    created_at: '2026-02-20T14:30:00Z',
    departure_date: '2026-02-23',
    departure_time: '09:00'
  },
  {
    booking_id: 'BKG-2026-001241',
    passenger_name: 'Fatoumata Diarra',
    passenger_email: 'fatoumata.d@yahoo.fr',
    passenger_phone: '+22671888777',
    user_id: 'pass_041',
    trip_route: 'Bobo-Dioulasso → Banfora',
    company_name: 'STAF Express',
    num_passengers: 1,
    selected_seats: ['C7'],
    price_per_seat: 5500,
    total_amount: 5500,
    currency: 'FCFA',
    status: 'pending',
    created_at: '2026-02-20T15:00:00Z',
    departure_date: '2026-02-24',
    departure_time: '11:00'
  },

  // CONFIRMÉ - Réservations payées (génèrent des BILLETS ACTIFS)
  {
    booking_id: 'BKG-2026-001234',
    passenger_name: 'Jean Kouamé',
    passenger_email: 'jean.kouame@example.com',
    passenger_phone: '+22670123456',
    user_id: 'passenger_001',
    trip_id: 'trip_001',
    trip_route: 'Ouagadougou → Bobo-Dioulasso',
    company_id: 'company_001',
    company_name: 'TSR Transport',
    num_passengers: 1,
    selected_seats: ['A3'],
    price_per_seat: 8500,
    total_amount: 8500,
    currency: 'FCFA',
    status: 'confirmed',
    created_at: '2026-02-19T10:30:00Z',
    departure_date: '2026-02-22',
    departure_time: '08:00'
  },
  {
    booking_id: 'BKG-2026-001235',
    passenger_name: 'Ibrahim Compaoré',
    passenger_email: 'ibrahim.c@yahoo.fr',
    passenger_phone: '+22671234567',
    user_id: 'pass_002',
    trip_route: 'Bobo-Dioulasso → Banfora',
    company_name: 'STAF Express',
    num_passengers: 2,
    selected_seats: ['B5', 'B6'],
    price_per_seat: 5500,
    total_amount: 11000,
    currency: 'FCFA',
    status: 'confirmed',
    created_at: '2026-02-20T08:15:00Z',
    departure_date: '2026-02-23',
    departure_time: '14:00'
  },
  {
    booking_id: 'BKG-2026-001236',
    passenger_name: 'Aïcha Kaboré',
    passenger_email: 'aicha.k@outlook.com',
    passenger_phone: '+22672345678',
    user_id: 'pass_003',
    trip_route: 'Ouagadougou → Koudougou',
    company_name: 'TSR Transport',
    num_passengers: 1,
    selected_seats: ['D8'],
    price_per_seat: 4200,
    total_amount: 4200,
    currency: 'FCFA',
    status: 'confirmed',
    created_at: '2026-02-20T12:00:00Z',
    departure_date: '2026-02-21',
    departure_time: '10:00'
  },

  // TERMINÉ - Voyages terminés
  {
    booking_id: 'BKG-2026-001220',
    passenger_name: 'Abdoulaye Traoré',
    passenger_email: 'abdoulaye.t@gmail.com',
    passenger_phone: '+22673456789',
    user_id: 'pass_010',
    trip_route: 'Ouagadougou → Fada N\'Gourma',
    company_name: 'Rakieta Transport',
    num_passengers: 1,
    selected_seats: ['C4'],
    price_per_seat: 6500,
    total_amount: 6500,
    currency: 'FCFA',
    status: 'completed',
    created_at: '2026-02-20T06:00:00Z',
    departure_date: '2026-02-20',
    departure_time: '07:00'
  },
  {
    booking_id: 'BKG-2026-001221',
    passenger_name: 'Mariam Ouédraogo',
    passenger_email: 'mariam.o@yahoo.fr',
    passenger_phone: '+22674567890',
    user_id: 'pass_011',
    trip_route: 'Bobo-Dioulasso → Ouagadougou',
    company_name: 'STAF Express',
    num_passengers: 3,
    selected_seats: ['A1', 'A2', 'B1'],
    price_per_seat: 8000,
    total_amount: 24000,
    currency: 'FCFA',
    status: 'completed',
    created_at: '2026-02-20T05:30:00Z',
    departure_date: '2026-02-20',
    departure_time: '06:30'
  },
  {
    booking_id: 'BKG-2026-001150',
    passenger_name: 'Souleymane Diallo',
    passenger_email: 'souleymane.d@gmail.com',
    passenger_phone: '+22675678901',
    user_id: 'pass_020',
    trip_route: 'Ouagadougou → Bobo-Dioulasso',
    company_name: 'TSR Transport',
    num_passengers: 1,
    selected_seats: ['E7'],
    price_per_seat: 8500,
    total_amount: 8500,
    currency: 'FCFA',
    status: 'completed',
    created_at: '2026-02-15T14:20:00Z',
    departure_date: '2026-02-18',
    departure_time: '08:00'
  },
  {
    booking_id: 'BKG-2026-001145',
    passenger_name: 'Aminata Sanogo',
    passenger_email: 'aminata.s@outlook.com',
    passenger_phone: '+22676789012',
    user_id: 'pass_021',
    trip_route: 'Banfora → Bobo-Dioulasso',
    company_name: 'STAF Express',
    num_passengers: 2,
    selected_seats: ['C2', 'C3'],
    price_per_seat: 5200,
    total_amount: 10400,
    currency: 'FCFA',
    status: 'completed',
    created_at: '2026-02-14T09:00:00Z',
    departure_date: '2026-02-17',
    departure_time: '15:00'
  },

  // ANNULÉ - Réservations annulées
  {
    booking_id: 'BKG-2026-001180',
    passenger_name: 'Boukary Koné',
    passenger_email: 'boukary.k@gmail.com',
    passenger_phone: '+22677890123',
    user_id: 'pass_030',
    trip_route: 'Ouagadougou → Dori',
    company_name: 'Rakieta Transport',
    num_passengers: 1,
    selected_seats: ['A9'],
    price_per_seat: 7200,
    total_amount: 7200,
    currency: 'FCFA',
    status: 'cancelled',
    created_at: '2026-02-18T16:45:00Z',
    updated_at: '2026-02-19T10:20:00Z',
    departure_date: '2026-02-25',
    departure_time: '09:00'
  },
  {
    booking_id: 'BKG-2026-001175',
    passenger_name: 'Zalissa Ouattara',
    passenger_email: 'zalissa.o@yahoo.fr',
    passenger_phone: '+22678901234',
    user_id: 'pass_031',
    trip_route: 'Koudougou → Ouagadougou',
    company_name: 'TSR Transport',
    num_passengers: 1,
    selected_seats: ['D5'],
    price_per_seat: 4000,
    total_amount: 4000,
    currency: 'FCFA',
    status: 'cancelled',
    created_at: '2026-02-17T11:30:00Z',
    updated_at: '2026-02-18T14:00:00Z',
    departure_date: '2026-02-24',
    departure_time: '11:00'
  }
];

// Statistiques des réservations
export const MOCK_BOOKING_STATS: BookingStats = {
  total: 11,
  pending: 2,
  confirmed: 3,
  completed: 4,
  cancelled: 2,
  today: 5,
  conversionRate: 72.7, // (3+4) / 11 * 100
  totalRevenue: 84600, // Somme des réservations confirmed + completed
  averageBookingValue: 7700
};

// ==================== BILLETS (TICKETS) ====================
// ⚠️ RAPPEL: Billets ≠ Réservations !
// Statuts billets: ACTIF, EMBARQUÉ, EXPIRÉ, ANNULÉ
// Un billet est GÉNÉRÉ quand une réservation est CONFIRMÉE
// 
// ACTIF: Billet valide, date de départ pas encore passée
// EMBARQUÉ: Passager actuellement dans le car
// EXPIRÉ: Date de départ passée
// ANNULÉ: Billet annulé manuellement

export const MOCK_TICKETS: Ticket[] = [
  // ACTIF - Billets valides, voyage pas encore commencé
  {
    id: 'TKT-2026-001234',
    bookingId: 'BKG-2026-001234',
    tripId: 'trip_001',
    passengerId: 'passenger_001',
    passengerName: 'Jean Kouamé',
    seatNumber: 'A3',
    fare: 8500,
    totalAmount: 8500,
    status: 'active',
    paymentMethod: 'orange_money',
    paymentStatus: 'completed',
    transactionId: 'TXN_20260219_001',
    companyId: 'company_001',
    companyName: 'TSR Transport',
    departure: 'Ouagadougou',
    destination: 'Bobo-Dioulasso',
    departureDate: '2026-02-27',
    departureTime: '08:00',
    purchaseDate: '2026-02-19T10:30:00Z',
    createdAt: '2026-02-19T10:32:00Z',
    updatedAt: '2026-02-19T10:32:00Z'
  },
  {
    id: 'TKT-2026-001235-A',
    bookingId: 'BKG-2026-001235',
    tripId: 'trip_002',
    passengerId: 'pass_002',
    passengerName: 'Ibrahim Compaoré',
    seatNumber: 'B5',
    fare: 5500,
    totalAmount: 5500,
    status: 'active',
    paymentMethod: 'card',
    paymentStatus: 'completed',
    transactionId: 'TXN_20260220_001',
    companyId: 'company_002',
    companyName: 'STAF Express',
    departure: 'Bobo-Dioulasso',
    destination: 'Banfora',
    departureDate: '2026-02-28',
    departureTime: '14:00',
    purchaseDate: '2026-02-20T08:15:00Z',
    createdAt: '2026-02-20T08:17:00Z',
    updatedAt: '2026-02-20T08:17:00Z'
  },
  {
    id: 'TKT-2026-001235-B',
    bookingId: 'BKG-2026-001235',
    tripId: 'trip_002',
    passengerId: 'pass_002',
    passengerName: 'Ibrahim Compaoré',
    seatNumber: 'B6',
    fare: 5500,
    totalAmount: 5500,
    status: 'active',
    paymentMethod: 'card',
    paymentStatus: 'completed',
    transactionId: 'TXN_20260220_001',
    companyId: 'company_002',
    companyName: 'STAF Express',
    departure: 'Bobo-Dioulasso',
    destination: 'Banfora',
    departureDate: '2026-02-28',
    departureTime: '14:00',
    purchaseDate: '2026-02-20T08:15:00Z',
    createdAt: '2026-02-20T08:17:00Z',
    updatedAt: '2026-02-20T08:17:00Z'
  },
  {
    id: 'TKT-2026-001236',
    bookingId: 'BKG-2026-001236',
    tripId: 'trip_003',
    passengerId: 'pass_003',
    passengerName: 'Aïcha Kaboré',
    seatNumber: 'D8',
    fare: 4200,
    totalAmount: 4200,
    status: 'active',
    paymentMethod: 'cash',
    paymentStatus: 'completed',
    companyId: 'company_001',
    companyName: 'TSR Transport',
    departure: 'Ouagadougou',
    destination: 'Koudougou',
    departureDate: '2026-02-27',
    departureTime: '10:00',
    purchaseDate: '2026-02-20T12:00:00Z',
    createdAt: '2026-02-20T12:05:00Z',
    updatedAt: '2026-02-20T12:05:00Z'
  },
  // EMBARQUÉ - Passagers actuellement dans le car
  {
    id: 'TKT-2026-001220',
    bookingId: 'BKG-2026-001220',
    tripId: 'trip_004',
    passengerId: 'pass_010',
    passengerName: 'Abdoulaye Traoré',
    seatNumber: 'C4',
    fare: 6500,
    totalAmount: 6500,
    status: 'boarded',
    paymentMethod: 'orange_money',
    paymentStatus: 'completed',
    transactionId: 'TXN_20260220_002',
    companyId: 'company_003',
    companyName: 'Rakieta Transport',
    departure: 'Ouagadougou',
    destination: 'Fada N\'Gourma',
    departureDate: '2026-02-26',
    departureTime: '07:00',
    purchaseDate: '2026-02-20T06:00:00Z',
    boardedAt: '2026-02-26T06:50:00Z',
    createdAt: '2026-02-20T06:05:00Z',
    updatedAt: '2026-02-26T06:50:00Z'
  },
  {
    id: 'TKT-2026-001221-A',
    bookingId: 'BKG-2026-001221',
    tripId: 'trip_005',
    passengerId: 'pass_011',
    passengerName: 'Mariam Ouédraogo',
    seatNumber: 'A1',
    fare: 8000,
    totalAmount: 8000,
    status: 'boarded',
    paymentMethod: 'card',
    paymentStatus: 'completed',
    transactionId: 'TXN_20260220_003',
    companyId: 'company_002',
    companyName: 'STAF Express',
    departure: 'Bobo-Dioulasso',
    destination: 'Ouagadougou',
    departureDate: '2026-02-26',
    departureTime: '06:30',
    purchaseDate: '2026-02-20T05:30:00Z',
    boardedAt: '2026-02-26T06:25:00Z',
    createdAt: '2026-02-20T05:35:00Z',
    updatedAt: '2026-02-26T06:25:00Z'
  },
  // EXPIRÉ - Date de départ passée
  {
    id: 'TKT-2026-001150',
    bookingId: 'BKG-2026-001150',
    tripId: 'trip_006',
    passengerId: 'pass_020',
    passengerName: 'Souleymane Diallo',
    seatNumber: 'E7',
    fare: 8500,
    totalAmount: 8500,
    status: 'expired',
    paymentMethod: 'orange_money',
    paymentStatus: 'completed',
    transactionId: 'TXN_20260215_001',
    companyId: 'company_001',
    companyName: 'TSR Transport',
    departure: 'Ouagadougou',
    destination: 'Bobo-Dioulasso',
    departureDate: '2026-02-18',
    departureTime: '08:00',
    purchaseDate: '2026-02-15T14:20:00Z',
    boardedAt: '2026-02-18T07:50:00Z',
    createdAt: '2026-02-15T14:25:00Z',
    updatedAt: '2026-02-18T12:00:00Z'
  },
  {
    id: 'TKT-2026-001145-A',
    bookingId: 'BKG-2026-001145',
    tripId: 'trip_007',
    passengerId: 'pass_021',
    passengerName: 'Aminata Sanogo',
    seatNumber: 'C2',
    fare: 5200,
    totalAmount: 5200,
    status: 'expired',
    paymentMethod: 'orange_money',
    paymentStatus: 'completed',
    companyId: 'company_002',
    companyName: 'STAF Express',
    departure: 'Banfora',
    destination: 'Bobo-Dioulasso',
    departureDate: '2026-02-17',
    departureTime: '15:00',
    purchaseDate: '2026-02-14T09:00:00Z',
    boardedAt: '2026-02-17T14:55:00Z',
    createdAt: '2026-02-14T09:05:00Z',
    updatedAt: '2026-02-17T19:00:00Z'
  },
  {
    id: 'TKT-2026-001145-B',
    bookingId: 'BKG-2026-001145',
    tripId: 'trip_007',
    passengerId: 'pass_021',
    passengerName: 'Aminata Sanogo',
    seatNumber: 'C3',
    fare: 5200,
    totalAmount: 5200,
    status: 'expired',
    paymentMethod: 'orange_money',
    paymentStatus: 'completed',
    companyId: 'company_002',
    companyName: 'STAF Express',
    departure: 'Banfora',
    destination: 'Bobo-Dioulasso',
    departureDate: '2026-02-17',
    departureTime: '15:00',
    purchaseDate: '2026-02-14T09:00:00Z',
    boardedAt: '2026-02-17T14:55:00Z',
    createdAt: '2026-02-14T09:05:00Z',
    updatedAt: '2026-02-17T19:00:00Z'
  },
  // ANNULÉ - Billets annulés
  {
    id: 'TKT-2026-001180',
    bookingId: 'BKG-2026-001180',
    tripId: 'trip_008',
    passengerId: 'pass_030',
    passengerName: 'Boukary Koné',
    seatNumber: 'A9',
    fare: 7200,
    totalAmount: 7200,
    status: 'cancelled',
    paymentMethod: 'orange_money',
    paymentStatus: 'completed',
    transactionId: 'TXN_20260218_001',
    companyId: 'company_003',
    companyName: 'Rakieta Transport',
    departure: 'Ouagadougou',
    destination: 'Dori',
    departureDate: '2026-02-25',
    departureTime: '09:00',
    purchaseDate: '2026-02-18T16:45:00Z',
    cancelledAt: '2026-02-19T10:20:00Z',
    refundAmount: 7200,
    refundedAt: '2026-02-19T10:20:00Z',
    createdAt: '2026-02-18T16:50:00Z',
    updatedAt: '2026-02-19T10:20:00Z'
  },
  {
    id: 'TKT-2026-001175',
    bookingId: 'BKG-2026-001175',
    tripId: 'trip_009',
    passengerId: 'pass_031',
    passengerName: 'Zalissa Ouattara',
    seatNumber: 'D5',
    fare: 4000,
    totalAmount: 4000,
    status: 'cancelled',
    paymentMethod: 'cash',
    paymentStatus: 'completed',
    companyId: 'company_001',
    companyName: 'TSR Transport',
    departure: 'Koudougou',
    destination: 'Ouagadougou',
    departureDate: '2026-02-24',
    departureTime: '11:00',
    purchaseDate: '2026-02-17T11:30:00Z',
    cancelledAt: '2026-02-18T14:00:00Z',
    refundAmount: 4000,
    refundedAt: '2026-02-18T14:00:00Z',
    createdAt: '2026-02-17T11:35:00Z',
    updatedAt: '2026-02-18T14:00:00Z'
  }
];

// Statistiques des billets
export const MOCK_TICKET_STATS: TicketStats = {
  totalTickets: 12,
  confirmedTickets: 4,  // ACTIF
  cancelledTickets: 2,  // ANNULÉ
  usedTickets: 5,       // EMBARQUÉ + EXPIRÉ (voyages effectués)
  todayTickets: 2,
  weekTickets: 8,
  monthTickets: 12,
  averageTicketsPerDay: 3,
  peakHour: '08:00'
};

// ==================== STATION STATS (pré-calculées) ====================
// Données stables pour stationService - PAS de Math.random()

export interface MockStationStats {
  station_id: string;
  station_name: string;
  sales_today: number;
  sales_yesterday: number;
  sales_this_week: number;
  sales_this_month: number;
  sales_change_daily: number;
  sales_change_weekly: number;
  revenue_today: number;
  revenue_yesterday: number;
  revenue_this_week: number;
  revenue_this_month: number;
  active_departures_today: number;
  active_arrivals_today: number;
  peak_hour: string;
  avg_ticket_price: number;
}

export interface MockGlobalStationStats {
  total_stations: number;
  active_stations: number;
  inactive_stations: number;
  active_percentage: number;
  total_sales_today: number;
  total_sales_yesterday: number;
  total_revenue_today: number;
  total_revenue_yesterday: number;
  busiest_station: string;
  busiest_station_sales: number;
  avg_sales_per_station: number;
  avg_revenue_per_station: number;
}

export const MOCK_STATION_STATS: MockStationStats[] = [
  {
    station_id: 'station_001',
    station_name: 'Gare Routière de Ouagadougou',
    sales_today: 92, sales_yesterday: 87,
    sales_this_week: 612, sales_this_month: 2680,
    sales_change_daily: 5.7, sales_change_weekly: 3.2,
    revenue_today: 644000, revenue_yesterday: 609000,
    revenue_this_week: 4284000, revenue_this_month: 18760000,
    active_departures_today: 18, active_arrivals_today: 16,
    peak_hour: '07:00-08:00', avg_ticket_price: 7000,
  },
  {
    station_id: 'station_002',
    station_name: 'Gare Routière de Bobo-Dioulasso',
    sales_today: 64, sales_yesterday: 58,
    sales_this_week: 420, sales_this_month: 1820,
    sales_change_daily: 10.3, sales_change_weekly: 4.1,
    revenue_today: 416000, revenue_yesterday: 377000,
    revenue_this_week: 2730000, revenue_this_month: 11830000,
    active_departures_today: 12, active_arrivals_today: 11,
    peak_hour: '08:00-09:00', avg_ticket_price: 6500,
  },
  {
    station_id: 'station_003',
    station_name: 'Gare Routière de Koudougou',
    sales_today: 0, sales_yesterday: 0,
    sales_this_week: 0, sales_this_month: 0,
    sales_change_daily: 0, sales_change_weekly: 0,
    revenue_today: 0, revenue_yesterday: 0,
    revenue_this_week: 0, revenue_this_month: 0,
    active_departures_today: 0, active_arrivals_today: 0,
    peak_hour: 'N/A', avg_ticket_price: 0,
  },
  {
    station_id: 'station_004',
    station_name: 'Gare Routière de Ouahigouya',
    sales_today: 28, sales_yesterday: 25,
    sales_this_week: 185, sales_this_month: 790,
    sales_change_daily: 12.0, sales_change_weekly: 2.8,
    revenue_today: 126000, revenue_yesterday: 112500,
    revenue_this_week: 832500, revenue_this_month: 3555000,
    active_departures_today: 6, active_arrivals_today: 5,
    peak_hour: '06:00-07:00', avg_ticket_price: 4500,
  },
  {
    station_id: 'station_005',
    station_name: 'Gare Routière de Banfora',
    sales_today: 35, sales_yesterday: 32,
    sales_this_week: 230, sales_this_month: 1010,
    sales_change_daily: 9.4, sales_change_weekly: 3.5,
    revenue_today: 175000, revenue_yesterday: 160000,
    revenue_this_week: 1150000, revenue_this_month: 5050000,
    active_departures_today: 8, active_arrivals_today: 7,
    peak_hour: '14:00-15:00', avg_ticket_price: 5000,
  },
];

export const MOCK_GLOBAL_STATION_STATS: MockGlobalStationStats = {
  total_stations: 5,
  active_stations: 4,
  inactive_stations: 1,
  active_percentage: 80.0,
  total_sales_today: 219,
  total_sales_yesterday: 202,
  total_revenue_today: 1361000,
  total_revenue_yesterday: 1258500,
  busiest_station: 'Gare Routière de Ouagadougou',
  busiest_station_sales: 92,
  avg_sales_per_station: 55,
  avg_revenue_per_station: 340250,
};

// ==================== PLATFORM ANALYTICS (pré-calculées) ====================
// Données stables pour platformAnalyticsService

export interface MockWeeklyRegistration {
  date: Date;
  dayName: string;
  companies: number;
  passengers: number;
  totalUsers: number;
}

export interface MockStationActivity {
  stationId: string;
  stationName: string;
  city: string;
  dailyDepartures: number;
  dailyArrivals: number;
  totalActivity: number;
  peakHour: string;
  activeRoutes: number;
}

export const MOCK_WEEKLY_REGISTRATIONS: MockWeeklyRegistration[] = [
  { date: new Date('2026-02-26'), dayName: 'Jeu', companies: 1, passengers: 42, totalUsers: 43 },
  { date: new Date('2026-02-27'), dayName: 'Ven', companies: 0, passengers: 38, totalUsers: 38 },
  { date: new Date('2026-02-28'), dayName: 'Sam', companies: 1, passengers: 25, totalUsers: 26 },
  { date: new Date('2026-03-01'), dayName: 'Dim', companies: 0, passengers: 18, totalUsers: 18 },
  { date: new Date('2026-03-02'), dayName: 'Lun', companies: 2, passengers: 55, totalUsers: 57 },
  { date: new Date('2026-03-03'), dayName: 'Mar', companies: 1, passengers: 48, totalUsers: 49 },
  { date: new Date('2026-03-04'), dayName: 'Mer', companies: 1, passengers: 51, totalUsers: 52 },
];

export const MOCK_STATION_ACTIVITIES: MockStationActivity[] = [
  { stationId: 'station_001', stationName: 'Gare Routière de Ouagadougou', city: 'Ouagadougou', dailyDepartures: 145, dailyArrivals: 138, totalActivity: 283, peakHour: '08:00', activeRoutes: 10 },
  { stationId: 'station_002', stationName: 'Gare Routière de Bobo-Dioulasso', city: 'Bobo-Dioulasso', dailyDepartures: 98, dailyArrivals: 92, totalActivity: 190, peakHour: '10:00', activeRoutes: 8 },
  { stationId: 'station_005', stationName: 'Gare Routière de Banfora', city: 'Banfora', dailyDepartures: 62, dailyArrivals: 58, totalActivity: 120, peakHour: '14:00', activeRoutes: 5 },
  { stationId: 'station_004', stationName: 'Gare Routière de Ouahigouya', city: 'Ouahigouya', dailyDepartures: 55, dailyArrivals: 50, totalActivity: 105, peakHour: '16:00', activeRoutes: 4 },
];

// ==================== FINANCIAL MOCK DATA ====================
// Données financières statiques pour le dashboard financier (ZÉRO Math.random)
// Structurées par période : today, week, month, year

import type {
  DailyRevenue,
  PaymentMethodStats,
  CompanyRevenue,
} from '../types/financial';
import { PaymentMethod, TimePeriod } from '../types/financial';

// --- Revenus journaliers / horaires par période ---

const MOCK_DAILY_REVENUE_TODAY: DailyRevenue[] = [
  { date: new Date('2026-03-04T00:00:00'), revenue: 85000, transactionCount: 12, commission: 6800, activeCompanies: 2 },
  { date: new Date('2026-03-04T02:00:00'), revenue: 42000, transactionCount: 6, commission: 3360, activeCompanies: 1 },
  { date: new Date('2026-03-04T04:00:00'), revenue: 28000, transactionCount: 4, commission: 2240, activeCompanies: 1 },
  { date: new Date('2026-03-04T06:00:00'), revenue: 320000, transactionCount: 48, commission: 25600, activeCompanies: 8 },
  { date: new Date('2026-03-04T08:00:00'), revenue: 580000, transactionCount: 87, commission: 46400, activeCompanies: 10 },
  { date: new Date('2026-03-04T10:00:00'), revenue: 425000, transactionCount: 64, commission: 34000, activeCompanies: 9 },
  { date: new Date('2026-03-04T12:00:00'), revenue: 350000, transactionCount: 52, commission: 28000, activeCompanies: 8 },
  { date: new Date('2026-03-04T14:00:00'), revenue: 290000, transactionCount: 43, commission: 23200, activeCompanies: 7 },
  { date: new Date('2026-03-04T16:00:00'), revenue: 380000, transactionCount: 57, commission: 30400, activeCompanies: 9 },
  { date: new Date('2026-03-04T18:00:00'), revenue: 210000, transactionCount: 31, commission: 16800, activeCompanies: 6 },
  { date: new Date('2026-03-04T20:00:00'), revenue: 125000, transactionCount: 19, commission: 10000, activeCompanies: 4 },
  { date: new Date('2026-03-04T22:00:00'), revenue: 65000, transactionCount: 10, commission: 5200, activeCompanies: 2 },
];

const MOCK_DAILY_REVENUE_WEEK: DailyRevenue[] = [
  { date: new Date('2026-02-26'), revenue: 2450000, transactionCount: 368, commission: 196000, activeCompanies: 10 },
  { date: new Date('2026-02-27'), revenue: 2680000, transactionCount: 402, commission: 214400, activeCompanies: 11 },
  { date: new Date('2026-02-28'), revenue: 2320000, transactionCount: 348, commission: 185600, activeCompanies: 9 },
  { date: new Date('2026-03-01'), revenue: 2850000, transactionCount: 428, commission: 228000, activeCompanies: 11 },
  { date: new Date('2026-03-02'), revenue: 3120000, transactionCount: 468, commission: 249600, activeCompanies: 12 },
  { date: new Date('2026-03-03'), revenue: 2750000, transactionCount: 413, commission: 220000, activeCompanies: 10 },
  { date: new Date('2026-03-04'), revenue: 2900000, transactionCount: 433, commission: 232000, activeCompanies: 11 },
];

const MOCK_DAILY_REVENUE_MONTH: DailyRevenue[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date('2026-02-03');
  date.setDate(date.getDate() + i);
  // Données déterministes basées sur l'index (pas de Math.random)
  const baseRevenue = 2200000 + (i % 7) * 120000 + (i % 3) * 80000;
  const txCount = Math.floor(baseRevenue / 6650);
  return {
    date,
    revenue: baseRevenue,
    transactionCount: txCount,
    commission: Math.floor(baseRevenue * 0.08),
    activeCompanies: 8 + (i % 5),
  };
});

const MOCK_DAILY_REVENUE_YEAR: DailyRevenue[] = [
  { date: new Date('2025-04-01'), revenue: 52000000, transactionCount: 7800, commission: 4160000, activeCompanies: 8 },
  { date: new Date('2025-05-01'), revenue: 58000000, transactionCount: 8700, commission: 4640000, activeCompanies: 9 },
  { date: new Date('2025-06-01'), revenue: 63000000, transactionCount: 9450, commission: 5040000, activeCompanies: 9 },
  { date: new Date('2025-07-01'), revenue: 71000000, transactionCount: 10650, commission: 5680000, activeCompanies: 10 },
  { date: new Date('2025-08-01'), revenue: 68000000, transactionCount: 10200, commission: 5440000, activeCompanies: 10 },
  { date: new Date('2025-09-01'), revenue: 74000000, transactionCount: 11100, commission: 5920000, activeCompanies: 11 },
  { date: new Date('2025-10-01'), revenue: 79000000, transactionCount: 11850, commission: 6320000, activeCompanies: 11 },
  { date: new Date('2025-11-01'), revenue: 82000000, transactionCount: 12300, commission: 6560000, activeCompanies: 12 },
  { date: new Date('2025-12-01'), revenue: 91000000, transactionCount: 13650, commission: 7280000, activeCompanies: 12 },
  { date: new Date('2026-01-01'), revenue: 85000000, transactionCount: 12750, commission: 6800000, activeCompanies: 11 },
  { date: new Date('2026-02-01'), revenue: 88000000, transactionCount: 13200, commission: 7040000, activeCompanies: 12 },
  { date: new Date('2026-03-01'), revenue: 92000000, transactionCount: 13800, commission: 7360000, activeCompanies: 12 },
];

export const MOCK_DAILY_REVENUE_BY_PERIOD: Record<string, DailyRevenue[]> = {
  [TimePeriod.TODAY]: MOCK_DAILY_REVENUE_TODAY,
  [TimePeriod.WEEK]: MOCK_DAILY_REVENUE_WEEK,
  [TimePeriod.MONTH]: MOCK_DAILY_REVENUE_MONTH,
  [TimePeriod.YEAR]: MOCK_DAILY_REVENUE_YEAR,
};

// --- Statistiques par méthode de paiement ---

export const MOCK_PAYMENT_METHOD_STATS: PaymentMethodStats[] = [
  // ===== CANAUX PAYDUNYA — Billets vendus via l'app mobile FasoTravel =====
  // FasoTravel perçoit UNIQUEMENT sur ces canaux (commission 5% + frais 100F)
  // 6 canaux : Orange Money, Moov Money, Wave, Sank Money, Telecel Money, Carte Bancaire
  {
    method: PaymentMethod.ORANGE_MONEY,
    methodName: 'Orange Money',
    transactionCount: 1124,
    totalAmount: 7401600,
    percentage: 37.2,
    successRate: 97.4,
    averageAmount: 6585,
    color: '#f97316',
    isAuditOnly: false,
  },
  {
    method: PaymentMethod.MOOV_MONEY,
    methodName: 'Moov Money',
    transactionCount: 487,
    totalAmount: 3207000,
    percentage: 16.1,
    successRate: 96.8,
    averageAmount: 6585,
    color: '#3b82f6',
    isAuditOnly: false,
  },
  {
    method: PaymentMethod.WAVE,
    methodName: 'Wave',
    transactionCount: 412,
    totalAmount: 2712920,
    percentage: 13.6,
    successRate: 98.1,
    averageAmount: 6585,
    color: '#06b6d4',
    isAuditOnly: false,
  },
  {
    method: PaymentMethod.WAVE,
    methodName: 'Sank Money',
    transactionCount: 245,
    totalAmount: 1613325,
    percentage: 8.1,
    successRate: 97.0,
    averageAmount: 6585,
    color: '#10b981',
    isAuditOnly: false,
  },
  {
    method: PaymentMethod.WAVE,
    methodName: 'Telecel Money',
    transactionCount: 178,
    totalAmount: 1172130,
    percentage: 5.9,
    successRate: 96.5,
    averageAmount: 6585,
    color: '#eab308',
    isAuditOnly: false,
  },
  {
    method: PaymentMethod.CARD,
    methodName: 'Carte Bancaire (Visa / MC)',
    transactionCount: 575,
    totalAmount: 3786375,
    percentage: 19.1,
    successRate: 96.8,
    averageAmount: 6585,
    color: '#8b5cf6',
    isAuditOnly: false,
  },
  // ===== HORS PLATEFORME — Ventes physiques aux guichets des sociétés =====
  // FasoTravel ne perçoit RIEN — visibilité audit uniquement
  {
    method: PaymentMethod.CASH,
    methodName: 'Espèces (guichets sociétés)',
    transactionCount: 340,
    totalAmount: 2251200,
    percentage: 0,
    successRate: 100,
    averageAmount: 6621,
    color: '#9ca3af',
    isAuditOnly: true,
  },
];

// --- Top compagnies par revenus ---

export const MOCK_TOP_COMPANIES_REVENUE: CompanyRevenue[] = [
  {
    companyId: 'company_001',
    companyName: 'TSR Transport',
    totalRevenue: 1850000,
    transactionCount: 278,
    commissionGenerated: 148000,
    averageTransactionAmount: 6655,
    growth: 15.3,
  },
  {
    companyId: 'company_002',
    companyName: 'STAF',
    totalRevenue: 1620000,
    transactionCount: 243,
    commissionGenerated: 129600,
    averageTransactionAmount: 6667,
    growth: 12.1,
  },
  {
    companyId: 'company_003',
    companyName: 'Rakieta Transport',
    totalRevenue: 1380000,
    transactionCount: 207,
    commissionGenerated: 110400,
    averageTransactionAmount: 6667,
    growth: 8.7,
  },
  {
    companyId: 'company_004',
    companyName: 'SOGEBAF',
    totalRevenue: 1150000,
    transactionCount: 173,
    commissionGenerated: 92000,
    averageTransactionAmount: 6647,
    growth: 21.4,
  },
  {
    companyId: 'company_005',
    companyName: 'STC',
    totalRevenue: 980000,
    transactionCount: 147,
    commissionGenerated: 78400,
    averageTransactionAmount: 6667,
    growth: 5.2,
  },
  {
    companyId: 'company_006',
    companyName: 'SOGEBAF',
    totalRevenue: 820000,
    transactionCount: 123,
    commissionGenerated: 65600,
    averageTransactionAmount: 6667,
    growth: -2.1,
  },
  {
    companyId: 'company_007',
    companyName: 'Transport Sahel',
    totalRevenue: 690000,
    transactionCount: 104,
    commissionGenerated: 55200,
    averageTransactionAmount: 6635,
    growth: 18.9,
  },
  {
    companyId: 'company_008',
    companyName: 'Express Volta',
    totalRevenue: 580000,
    transactionCount: 87,
    commissionGenerated: 46400,
    averageTransactionAmount: 6667,
    growth: 9.3,
  },
];

// ==================== NOTIFICATION CENTER ====================
// Mock data pour le centre de notifications (automatisations, historique, templates, etc.)

export const MOCK_AUTOMATION_RULES: AutomationRule[] = [
  {
    id: 'auto_welcome',
    name: 'Bienvenue nouveau passager',
    description: 'Envoyée automatiquement à l\'inscription d\'un nouveau passager',
    triggerEvent: 'user.created',
    triggerLabel: 'Inscription passager',
    template: { title: 'Bienvenue sur FasoTravel !', message: 'Bonjour {prenom}, bienvenue sur FasoTravel ! Découvrez les meilleurs trajets au Burkina Faso.' },
    channels: ['push', 'email', 'inApp', 'whatsapp'],
    isActive: true,
    sentCount: 1204,
    lastTriggered: '2026-03-07T14:22:00Z',
    category: 'onboarding',
  },
  {
    id: 'auto_signup_otp_whatsapp',
    name: 'OTP inscription via WhatsApp',
    description: 'Envoi automatique du code OTP de création de compte sur WhatsApp',
    triggerEvent: 'auth.signup_otp_requested',
    triggerLabel: 'OTP inscription demandé',
    template: { title: 'Code OTP inscription', message: '{prenom}, votre code de vérification FasoTravel est {otp}. Il expire dans 5 minutes.' },
    channels: ['whatsapp', 'inApp'],
    isActive: true,
    sentCount: 3621,
    lastTriggered: '2026-03-07T15:45:00Z',
    category: 'onboarding',
  },
  {
    id: 'auto_login_otp_whatsapp',
    name: 'OTP connexion via WhatsApp',
    description: 'Envoi automatique du code OTP de connexion sur WhatsApp',
    triggerEvent: 'auth.login_otp_requested',
    triggerLabel: 'OTP connexion demandé',
    template: { title: 'Code OTP connexion', message: '{prenom}, votre code de connexion FasoTravel est {otp}. Il expire dans 5 minutes.' },
    channels: ['whatsapp', 'inApp'],
    isActive: true,
    sentCount: 5187,
    lastTriggered: '2026-03-07T16:18:00Z',
    category: 'transactional',
  },
  {
    id: 'auto_booking_confirmed',
    name: 'Confirmation de réservation',
    description: 'Envoyée à chaque réservation confirmée avec les détails du voyage',
    triggerEvent: 'booking.confirmed',
    triggerLabel: 'Réservation confirmée',
    template: { title: 'Réservation confirmée !', message: '{prenom}, votre réservation {trajet} du {date_depart} est confirmée. Billet n°{numero_billet}.' },
    channels: ['push', 'email', 'inApp', 'whatsapp'],
    isActive: true,
    sentCount: 8934,
    lastTriggered: '2026-03-07T16:05:00Z',
    category: 'transactional',
  },
  {
    id: 'auto_ticket_issued',
    name: 'Billet émis',
    description: 'Notification avec le billet électronique (PDF) quand le paiement est validé',
    triggerEvent: 'ticket.issued',
    triggerLabel: 'Billet émis',
    template: { title: 'Votre billet est prêt !', message: '{prenom}, votre billet {numero_billet} pour {trajet} est disponible. Téléchargez-le dans l\'app.' },
    channels: ['push', 'email', 'whatsapp'],
    isActive: true,
    sentCount: 8712,
    lastTriggered: '2026-03-07T16:05:00Z',
    category: 'transactional',
  },
  {
    id: 'auto_reminder_24h',
    name: 'Rappel voyage J-1',
    description: 'Rappel automatique 24h avant le départ avec les infos pratiques',
    triggerEvent: 'booking.departure_minus_24h',
    triggerLabel: '24h avant départ',
    template: { title: 'Rappel : Votre voyage approche !', message: '{prenom}, votre trajet {trajet} avec {compagnie} est demain à {heure_depart}. Gare de {gare_depart}, présentez-vous 30 min avant.' },
    channels: ['push', 'inApp', 'whatsapp'],
    isActive: true,
    sentCount: 6342,
    lastTriggered: '2026-03-07T08:00:00Z',
    category: 'reminder',
  },
  {
    id: 'auto_reminder_2h',
    name: 'Rappel voyage H-2',
    description: 'Rappel 2h avant le départ avec le QR code du billet',
    triggerEvent: 'booking.departure_minus_2h',
    triggerLabel: '2h avant départ',
    template: { title: 'Départ dans 2h !', message: '{prenom}, votre bus {trajet} part à {heure_depart}. N\'oubliez pas votre billet et vos bagages !' },
    channels: ['push', 'whatsapp'],
    isActive: true,
    sentCount: 5980,
    lastTriggered: '2026-03-07T14:00:00Z',
    category: 'reminder',
  },
  {
    id: 'auto_refund_processed',
    name: 'Remboursement traité',
    description: 'Notification quand un remboursement est effectué avec le montant',
    triggerEvent: 'refund.processed',
    triggerLabel: 'Remboursement effectué',
    template: { title: 'Remboursement effectué', message: '{prenom}, votre remboursement de {montant} FCFA pour le trajet {trajet} a été traité. Délai : 48-72h.' },
    channels: ['push', 'email', 'inApp', 'whatsapp'],
    isActive: true,
    sentCount: 423,
    lastTriggered: '2026-03-06T11:30:00Z',
    category: 'transactional',
  },
  {
    id: 'auto_trip_delayed',
    name: 'Retard de trajet',
    description: 'Alerte automatique quand un trajet est signalé en retard',
    triggerEvent: 'trip.delayed',
    triggerLabel: 'Trajet en retard',
    template: { title: 'Retard sur votre trajet', message: '{prenom}, le trajet {trajet} du {date_depart} a un retard estimé de {duree_retard}. Nouveau départ : {heure_depart}.' },
    channels: ['push', 'email', 'inApp', 'whatsapp'],
    isActive: true,
    sentCount: 187,
    lastTriggered: '2026-03-05T09:15:00Z',
    category: 'alert',
  },
  {
    id: 'auto_trip_cancelled',
    name: 'Annulation de trajet',
    description: 'Notification immédiate quand un trajet est annulé avec options',
    triggerEvent: 'trip.cancelled',
    triggerLabel: 'Trajet annulé',
    template: { title: 'Trajet annulé', message: '{prenom}, le trajet {trajet} du {date_depart} est annulé. Remboursement automatique ou report gratuit disponible.' },
    channels: ['push', 'email', 'inApp', 'whatsapp'],
    isActive: true,
    sentCount: 56,
    lastTriggered: '2026-03-02T07:45:00Z',
    category: 'alert',
  },
  {
    id: 'auto_review_request',
    name: 'Demande d\'avis post-voyage',
    description: 'Envoyée 2h après l\'arrivée pour collecter un avis passager',
    triggerEvent: 'trip.completed_plus_2h',
    triggerLabel: '2h après arrivée',
    template: { title: 'Comment était votre voyage ?', message: '{prenom}, votre trajet {trajet} avec {compagnie} est terminé. Donnez votre avis en 30 secondes !' },
    channels: ['push', 'inApp'],
    isActive: false,
    sentCount: 2890,
    lastTriggered: '2026-02-28T18:00:00Z',
    category: 'engagement',
  },
  {
    id: 'auto_inactive_30d',
    name: 'Réengagement inactif 30j',
    description: 'Envoyée aux passagers inactifs depuis 30 jours avec une promo',
    triggerEvent: 'user.inactive_30d',
    triggerLabel: '30 jours d\'inactivité',
    template: { title: 'Vous nous manquez !', message: '{prenom}, ça fait un moment ! Profitez de -15% sur votre prochain trajet avec le code RETOUR15.' },
    channels: ['push', 'email'],
    isActive: false,
    sentCount: 1456,
    lastTriggered: '2026-03-01T10:00:00Z',
    category: 'engagement',
  },
];

export const MOCK_SENT_HISTORY: SentCampaign[] = [
  { id: 'hist_016', title: 'Code OTP inscription', message: 'Moussa, votre code de vérification FasoTravel est 482931.', source: 'auto', sourceName: 'OTP inscription via WhatsApp', category: 'onboarding', audience: 'Passager individuel', audienceCount: 1, channels: ['whatsapp', 'inApp'], sentAt: '2026-03-07T15:45:00Z', deliveredCount: 1, openedCount: 1, clickedCount: 0, status: 'delivered' },
  { id: 'hist_017', title: 'Code OTP connexion', message: 'Moussa, votre code de connexion FasoTravel est 736204.', source: 'auto', sourceName: 'OTP connexion via WhatsApp', category: 'transactional', audience: 'Passager individuel', audienceCount: 1, channels: ['whatsapp', 'inApp'], sentAt: '2026-03-07T16:18:00Z', deliveredCount: 1, openedCount: 1, clickedCount: 0, status: 'delivered' },
  { id: 'hist_018', title: 'Votre billet électronique est prêt !', message: 'Fatimata, votre billet BIL-2026-8934 pour Ouaga→Bobo a été envoyé sur WhatsApp.', source: 'auto', sourceName: 'Billet émis', category: 'transactional', audience: 'Passager individuel', audienceCount: 1, channels: ['push', 'email', 'whatsapp'], sentAt: '2026-03-07T16:06:00Z', deliveredCount: 1, openedCount: 1, clickedCount: 0, status: 'delivered' },
  { id: 'hist_001', title: 'Réservation confirmée !', message: 'Fatimata, votre réservation Ouaga→Bobo du 07/03 est confirmée.', source: 'auto', sourceName: 'Confirmation de réservation', category: 'transactional', audience: 'Passager individuel', audienceCount: 1, channels: ['push', 'email', 'inApp', 'whatsapp'], sentAt: '2026-03-07T16:05:00Z', deliveredCount: 1, openedCount: 1, clickedCount: 1, status: 'delivered' },
  { id: 'hist_002', title: 'Votre billet est prêt !', message: 'Fatimata, votre billet BIL-2026-8934 pour Ouaga→Bobo est disponible.', source: 'auto', sourceName: 'Billet émis', category: 'transactional', audience: 'Passager individuel', audienceCount: 1, channels: ['push', 'email', 'whatsapp'], sentAt: '2026-03-07T16:06:00Z', deliveredCount: 1, openedCount: 1, clickedCount: 0, status: 'delivered' },
  { id: 'hist_003', title: 'Bienvenue sur FasoTravel !', message: 'Bonjour Moussa, bienvenue sur FasoTravel !', source: 'auto', sourceName: 'Bienvenue nouveau passager', category: 'onboarding', audience: 'Passager individuel', audienceCount: 1, channels: ['push', 'email', 'inApp', 'whatsapp'], sentAt: '2026-03-07T14:22:00Z', deliveredCount: 1, openedCount: 1, clickedCount: 1, status: 'delivered' },
  { id: 'hist_004', title: 'Rappel : Votre voyage approche !', message: 'Ibrahim, votre trajet Ouaga→Koudougou avec TSR est demain à 06h30.', source: 'auto', sourceName: 'Rappel voyage J-1', category: 'reminder', audience: 'Passagers avec départ le 08/03', audienceCount: 147, channels: ['push', 'inApp', 'whatsapp'], sentAt: '2026-03-07T08:00:00Z', deliveredCount: 145, openedCount: 112, clickedCount: 34, status: 'delivered' },
  { id: 'hist_005', title: 'Départ dans 2h !', message: 'Aïcha, votre bus Ouaga→Bobo part à 14h00.', source: 'auto', sourceName: 'Rappel voyage H-2', category: 'reminder', audience: 'Passagers avec départ 07/03 14h', audienceCount: 38, channels: ['push', 'whatsapp'], sentAt: '2026-03-07T12:00:00Z', deliveredCount: 37, openedCount: 35, clickedCount: 8, status: 'delivered' },
  { id: 'hist_006', title: 'Retard sur votre trajet', message: 'Le trajet Ouaga→Fada du 06/03 a un retard estimé de 45 min.', source: 'auto', sourceName: 'Retard de trajet', category: 'alert', audience: 'Passagers trajet TRJ-2026-0456', audienceCount: 42, channels: ['push', 'email', 'inApp', 'whatsapp'], sentAt: '2026-03-06T15:30:00Z', deliveredCount: 42, openedCount: 41, clickedCount: 12, status: 'delivered' },
  { id: 'hist_007', title: 'Remboursement effectué', message: 'Abdoulaye, votre remboursement de 8 500 FCFA a été traité.', source: 'auto', sourceName: 'Remboursement traité', category: 'transactional', audience: 'Passager individuel', audienceCount: 1, channels: ['push', 'email', 'inApp', 'whatsapp'], sentAt: '2026-03-06T11:30:00Z', deliveredCount: 1, openedCount: 1, clickedCount: 1, status: 'delivered' },
  { id: 'hist_008', title: 'Promo Tabaski -25% !', message: 'Profitez de -25% sur tous les trajets interurbains ce weekend ! Code TABASKI25.', source: 'manual', sourceName: 'Campagne admin', audience: 'Tous les passagers', audienceCount: 12450, channels: ['push', 'email', 'whatsapp'], sentAt: '2026-03-06T09:00:00Z', deliveredCount: 12234, openedCount: 8756, clickedCount: 3421, status: 'delivered' },
  { id: 'hist_009', title: 'Maintenance système', message: 'L\'app FasoTravel sera en maintenance le 05/03 de 02h à 05h.', source: 'manual', sourceName: 'Campagne admin', audience: 'Tous les passagers', audienceCount: 12450, channels: ['push', 'inApp'], sentAt: '2026-03-04T18:00:00Z', deliveredCount: 12320, openedCount: 9234, clickedCount: 1245, status: 'delivered' },
  { id: 'hist_010', title: 'Nouvelle ligne Ouaga→Dédougou !', message: 'Réservez dès maintenant sur la nouvelle ligne à partir de 5 000 FCFA.', source: 'manual', sourceName: 'Campagne admin', audience: 'Voyageurs fréquents', audienceCount: 1245, channels: ['push', 'email', 'inApp', 'whatsapp'], sentAt: '2026-03-03T10:00:00Z', deliveredCount: 1230, openedCount: 987, clickedCount: 456, status: 'delivered' },
  { id: 'hist_011', title: 'Trajet annulé', message: 'Le trajet Bobo→Banfora du 02/03 est annulé. Remboursement automatique.', source: 'auto', sourceName: 'Annulation de trajet', category: 'alert', audience: 'Passagers trajet TRJ-2026-0398', audienceCount: 28, channels: ['push', 'email', 'inApp'], sentAt: '2026-03-02T07:45:00Z', deliveredCount: 28, openedCount: 28, clickedCount: 22, status: 'delivered' },
  { id: 'hist_012', title: 'Vous nous manquez !', message: 'Ça fait un moment ! Profitez de -15% avec le code RETOUR15.', source: 'auto', sourceName: 'Réengagement inactif 30j', category: 'engagement', audience: 'Passagers inactifs 30j', audienceCount: 4380, channels: ['push', 'email'], sentAt: '2026-03-01T10:00:00Z', deliveredCount: 4102, openedCount: 1845, clickedCount: 523, status: 'delivered' },
  { id: 'hist_013', title: 'Alerte météo Sahel', message: 'Conditions météo difficiles : trajets vers Djibo et Dori suspendus.', source: 'manual', sourceName: 'Campagne admin', audience: 'Passagers récents (30j)', audienceCount: 3820, channels: ['push', 'email', 'inApp', 'whatsapp'], sentAt: '2026-02-27T14:00:00Z', deliveredCount: 3750, openedCount: 3456, clickedCount: 890, status: 'delivered' },
  { id: 'hist_014', title: 'Comment était votre voyage ?', message: 'Donnez votre avis sur votre trajet avec STAF Express.', source: 'auto', sourceName: 'Demande d\'avis post-voyage', category: 'engagement', audience: 'Passagers arrivés le 27/02', audienceCount: 89, channels: ['push', 'inApp'], sentAt: '2026-02-27T20:00:00Z', deliveredCount: 86, openedCount: 52, clickedCount: 31, status: 'delivered' },
  { id: 'hist_015', title: 'Offre flash 48h !', message: 'Jusqu\'à -30% sur les trajets longue distance. Réservez avant dimanche !', source: 'manual', sourceName: 'Campagne admin', audience: 'Tous les passagers', audienceCount: 12450, channels: ['push'], sentAt: '2026-02-21T08:00:00Z', deliveredCount: 11890, openedCount: 7234, clickedCount: 2890, status: 'delivered' },
];

export const MOCK_NOTIF_TEMPLATES: NotifTemplate[] = [
  { id: 'tpl_1', name: 'Promo weekend', title: 'Offre spéciale FasoTravel !', message: 'Profitez de -20% sur tous les trajets {trajet} ce weekend ! Réservez maintenant avec le code {code}.', category: 'Marketing', usageCount: 156, lastUsed: '2026-03-01' },
  { id: 'tpl_2', name: 'Maintenance', title: 'Maintenance programmée', message: 'L\'application FasoTravel sera en maintenance le {date} de 02h à 05h. Veuillez planifier vos réservations en conséquence.', category: 'Opérationnel', usageCount: 89, lastUsed: '2026-02-28' },
  { id: 'tpl_3', name: 'Nouvelle ligne', title: 'Nouvelle ligne disponible !', message: 'Réservez dès maintenant sur la nouvelle ligne {trajet} à partir de {prix} FCFA.', category: 'Marketing', usageCount: 45, lastUsed: '2026-03-05' },
  { id: 'tpl_4', name: 'Alerte météo', title: 'Conditions météo', message: 'En raison des conditions météo, certains trajets vers {destination} sont suspendus jusqu\'au {date}. Consultez vos réservations.', category: 'Urgence', usageCount: 12, lastUsed: '2026-02-15' },
];

export const MOCK_SCHEDULED_NOTIFICATIONS: ScheduledNotification[] = [
  { id: 'sch_1', title: 'Promo Tabaski -30%', message: 'Profitez de -30% sur tous les trajets interurbains pour la Tabaski !', scheduledAt: '2026-03-15T08:00:00Z', audience: 'Tous les passagers', audienceCount: 12450, channels: ['push', 'email', 'whatsapp'], status: 'pending', createdAt: '2026-03-07T10:00:00Z' },
  { id: 'sch_2', title: 'Maintenance système', message: 'L\'app FasoTravel sera en maintenance le 20/03 de 02h à 05h.', scheduledAt: '2026-03-20T02:00:00Z', audience: 'Tous les passagers', audienceCount: 12450, channels: ['push', 'inApp', 'whatsapp'], status: 'pending', createdAt: '2026-03-07T11:00:00Z' },
];

export const MOCK_NOTIF_STATS: NotifStats = {
  totalSent: 3971,
  deliveryRate: 98.4,
  openRate: 79.4,
  clickRate: 34.5,
  scheduledCount: 2,
  templatesCount: 4,
  autoSent: 3245,
  manualSent: 726,
  trends: {
    autoSentTrend: '+24%',
    manualSentTrend: '+8%',
    deliveryTrend: '+0.3%',
    openRateTrend: '+2.1%',
    clickRateTrend: '-0.5%',
  },
};

export const MOCK_AUDIENCE_SEGMENTS: AudienceSegment[] = [
  { value: 'all', label: 'Tous les passagers', count: 12450 },
  { value: 'recent', label: 'Passagers récents (30j)', count: 3820 },
  { value: 'frequent', label: 'Voyageurs fréquents', count: 1245 },
  { value: 'inactive', label: 'Passagers inactifs (>90j)', count: 4380 },
  { value: 'companies', label: 'Sociétés de transport', count: 12 },
];

export const MOCK_CHANNEL_STATS: ChannelStat[] = [
  { channel: 'push', label: 'Push', percentage: 78, totalSent: 3097 },
  { channel: 'email', label: 'Email', percentage: 52, totalSent: 2065 },
  { channel: 'whatsapp', label: 'WhatsApp', percentage: 74, totalSent: 2938 },
  { channel: 'inApp', label: 'In-App', percentage: 91, totalSent: 3614 },
];

export const MOCK_WEEKLY_NOTIF_STATS: WeeklyNotifStat[] = [
  { day: 'Lun', auto: 55, manual: 10 },
  { day: 'Mar', auto: 40, manual: 5 },
  { day: 'Mer', auto: 68, manual: 12 },
  { day: 'Jeu', auto: 45, manual: 7 },
  { day: 'Ven', auto: 80, manual: 15 },
  { day: 'Sam', auto: 30, manual: 8 },
  { day: 'Dim', auto: 15, manual: 5 },
];

// ==================== ADMIN SECURITY (Settings > Sécurité) ====================
// Sessions actives de l'admin connecté (Moussa Diarra - admin_001)
// DIFFÉRENT de MOCK_USER_SESSIONS qui est le monitoring platform-wide

export const MOCK_ADMIN_ACTIVE_SESSIONS: AdminActiveSession[] = [
  {
    id: 'admin_sess_001',
    deviceInfo: 'Windows 11 - Chrome 120',
    ipAddress: '196.28.245.12',
    location: 'Ouagadougou, Burkina Faso',
    loginAt: '2026-03-10T08:15:00Z',
    lastActivityAt: '2026-03-10T14:32:00Z',
    isCurrent: true,
  },
  {
    id: 'admin_sess_002',
    deviceInfo: 'iPhone 15 - Safari Mobile',
    ipAddress: '196.28.245.98',
    location: 'Ouagadougou, Burkina Faso',
    loginAt: '2026-03-09T19:45:00Z',
    lastActivityAt: '2026-03-09T22:10:00Z',
    isCurrent: false,
  },
  {
    id: 'admin_sess_003',
    deviceInfo: 'MacBook Pro - Firefox 124',
    ipAddress: '41.203.67.55',
    location: 'Bobo-Dioulasso, Burkina Faso',
    loginAt: '2026-03-08T10:00:00Z',
    lastActivityAt: '2026-03-08T17:30:00Z',
    isCurrent: false,
  },
];

// Événements de sécurité récents pour l'admin connecté
export const MOCK_SECURITY_EVENTS: SecurityEvent[] = [
  {
    id: 'sec_evt_001',
    type: 'login',
    description: 'Connexion réussie depuis Windows - Chrome',
    ipAddress: '196.28.245.12',
    location: 'Ouagadougou, Burkina Faso',
    createdAt: '2026-03-10T08:15:00Z',
  },
  {
    id: 'sec_evt_002',
    type: 'login',
    description: 'Connexion réussie depuis iPhone - Safari',
    ipAddress: '196.28.245.98',
    location: 'Ouagadougou, Burkina Faso',
    createdAt: '2026-03-09T19:45:00Z',
  },
  {
    id: 'sec_evt_003',
    type: 'password_change',
    description: 'Mot de passe modifié avec succès',
    ipAddress: '196.28.245.12',
    location: 'Ouagadougou, Burkina Faso',
    createdAt: '2026-03-05T11:20:00Z',
  },
  {
    id: 'sec_evt_004',
    type: 'failed_login',
    description: 'Tentative de connexion échouée (mot de passe incorrect)',
    ipAddress: '41.78.120.33',
    location: 'Koudougou, Burkina Faso',
    createdAt: '2026-03-04T03:15:00Z',
  },
  {
    id: 'sec_evt_005',
    type: 'session_revoked',
    description: 'Session révoquée manuellement (ancien appareil)',
    ipAddress: '196.28.245.12',
    location: 'Ouagadougou, Burkina Faso',
    createdAt: '2026-03-02T16:00:00Z',
  },
  {
    id: 'sec_evt_006',
    type: 'login',
    description: 'Connexion réussie depuis MacBook - Firefox',
    ipAddress: '41.203.67.55',
    location: 'Bobo-Dioulasso, Burkina Faso',
    createdAt: '2026-03-08T10:00:00Z',
  },
  {
    id: 'sec_evt_007',
    type: '2fa_enabled',
    description: 'Authentification à 2 facteurs activée',
    ipAddress: '196.28.245.12',
    location: 'Ouagadougou, Burkina Faso',
    createdAt: '2026-02-20T14:30:00Z',
  },
  {
    id: 'sec_evt_008',
    type: '2fa_disabled',
    description: 'Authentification à 2 facteurs désactivée',
    ipAddress: '196.28.245.12',
    location: 'Ouagadougou, Burkina Faso',
    createdAt: '2026-02-25T09:00:00Z',
  },
];

// ==================== INTEGRATION ALERTS ====================

export const MOCK_ALERT_RULES: IntegrationAlertRule[] = [
  { id: 'rule_001', integrationId: 'integration_005', type: 'quota_exceeded', label: 'Quota Google Maps > 70%', threshold: 70, currentValue: 43.5, unit: '%', severity: 'warning', enabled: true, notifyEmail: true, notifySms: false, createdAt: '2026-01-15T10:00:00Z' },
  { id: 'rule_002', integrationId: 'integration_006', type: 'cpu_high', label: 'CPU Lightsail > 80%', threshold: 80, currentValue: 18, unit: '%', severity: 'critical', enabled: true, notifyEmail: true, notifySms: true, createdAt: '2026-01-15T10:00:00Z' },
  { id: 'rule_003', integrationId: 'integration_006', type: 'memory_high', label: 'Memoire Lightsail > 75%', threshold: 75, currentValue: 42, unit: '%', severity: 'warning', enabled: true, notifyEmail: true, notifySms: false, createdAt: '2026-01-20T10:00:00Z' },
  { id: 'rule_004', integrationId: 'integration_006', type: 'storage_full', label: 'Stockage S3 > 80%', threshold: 80, currentValue: 5.6, unit: '%', severity: 'critical', enabled: true, notifyEmail: true, notifySms: true, createdAt: '2026-01-20T10:00:00Z' },
  { id: 'rule_005', integrationId: 'integration_003', type: 'error_rate', label: 'Taux echec SMS > 5%', threshold: 5, currentValue: 1.8, unit: '%', severity: 'warning', enabled: true, notifyEmail: true, notifySms: false, createdAt: '2026-02-01T10:00:00Z' },
  { id: 'rule_006', integrationId: 'integration_003', type: 'high_latency', label: 'Latence WhatsApp Business > 500ms', threshold: 500, currentValue: 340, unit: 'ms', severity: 'info', enabled: false, notifyEmail: false, notifySms: false, createdAt: '2026-02-01T10:00:00Z' },
  { id: 'rule_007', integrationId: 'integration_003', type: 'cost_spike', label: 'Cout SMS > 80 000 FCFA/mois', threshold: 80000, currentValue: 63000, unit: 'FCFA', severity: 'warning', enabled: true, notifyEmail: true, notifySms: false, createdAt: '2026-02-10T10:00:00Z' },
];

export const MOCK_INTEGRATION_ALERTS: IntegrationAlert[] = [
  { id: 'alert_001', ruleId: 'rule_002', integrationId: 'integration_006', integrationName: 'AWS S3 + CloudFront', type: 'cpu_high', severity: 'critical', message: 'CPU Lightsail a atteint 82% (seuil: 80%)', currentValue: 82, threshold: 80, unit: '%', acknowledged: true, triggeredAt: '2026-03-05T14:23:00Z', acknowledgedAt: '2026-03-05T14:35:00Z' },
  { id: 'alert_002', ruleId: 'rule_005', integrationId: 'integration_003', integrationName: 'WhatsApp Business', type: 'error_rate', severity: 'warning', message: 'Taux echec messages WA a atteint 6.2% (seuil: 5%)', currentValue: 6.2, threshold: 5, unit: '%', acknowledged: true, triggeredAt: '2026-03-02T09:10:00Z', acknowledgedAt: '2026-03-02T09:45:00Z' },
  { id: 'alert_003', ruleId: 'rule_001', integrationId: 'integration_005', integrationName: 'Google Maps', type: 'quota_exceeded', severity: 'warning', message: 'Quota Google Maps a atteint 73% (seuil: 70%)', currentValue: 73, threshold: 70, unit: '%', acknowledged: false, triggeredAt: '2026-03-08T16:00:00Z' },
];

// ==================== WHATSAPP BUSINESS ACCOUNT ====================

export const MOCK_WHATSAPP_ACCOUNT: WhatsAppAccountInfo = {
  balance: 187_500,
  currency: 'FCFA',
  messagesSentToday: 74,
  messagesSentThisMonth: 2100,
  deliveryRate: 97.5,
  avgDeliveryTimeSec: 4.2,
  templates: [
    { id: 'FASOTRAVEL_OTP', name: 'Code OTP', type: 'otp', enabled: true },
    { id: 'FASOTRAVEL_TICKET', name: 'Confirmation billet', type: 'transactional', enabled: true },
    { id: 'FASOTRAVEL_REMINDER', name: 'Rappel trajet', type: 'marketing', enabled: true },
    { id: 'FASOTRAVEL_CANCEL', name: 'Annulation trajet', type: 'transactional', enabled: false },
  ],
  supportedNetworks: ['Orange Burkina Faso', 'Moov Africa Burkina'],
};

// ==================== PAYDUNYA ====================

export const MOCK_PAYDUNYA_CHANNEL_STATS: PaydunyaChannelStats[] = [
  { channelKey: 'orange_money', label: 'Orange Money', transactionsCount: 4_231, transactionsTotal: 63_465_000, successRate: 97.2, avgTransactionAmount: 15_000, last24hCount: 87, last24hTotal: 1_305_000 },
  { channelKey: 'moov_money', label: 'Moov Money', transactionsCount: 2_814, transactionsTotal: 39_396_000, successRate: 95.8, avgTransactionAmount: 14_000, last24hCount: 52, last24hTotal: 728_000 },
  { channelKey: 'wave', label: 'Wave', transactionsCount: 3_567, transactionsTotal: 46_371_000, successRate: 98.5, avgTransactionAmount: 13_000, last24hCount: 71, last24hTotal: 923_000 },
  { channelKey: 'sank_money', label: 'Sank Money', transactionsCount: 892, transactionsTotal: 11_156_000, successRate: 94.3, avgTransactionAmount: 12_500, last24hCount: 18, last24hTotal: 225_000 },
  { channelKey: 'telecel_money', label: 'Telecel Money', transactionsCount: 0, transactionsTotal: 0, successRate: 0, avgTransactionAmount: 0, last24hCount: 0, last24hTotal: 0 },
  { channelKey: 'card', label: 'Carte Bancaire', transactionsCount: 1_456, transactionsTotal: 36_400_000, successRate: 92.1, avgTransactionAmount: 25_000, last24hCount: 34, last24hTotal: 850_000 },
];

export const MOCK_PAYDUNYA_WEBHOOK_LOGS: PaydunyaWebhookLog[] = [
  { id: 'wh_001', eventType: 'payment_success', channelKey: 'orange_money', transactionRef: 'TXN-2026-03-08-001', amount: 15000, currency: 'XOF', httpStatus: 200, responseTimeMs: 142, createdAt: '2026-03-08T09:45:00Z' },
  { id: 'wh_002', eventType: 'payment_success', channelKey: 'wave', transactionRef: 'TXN-2026-03-08-002', amount: 12500, currency: 'XOF', httpStatus: 200, responseTimeMs: 98, createdAt: '2026-03-08T09:32:00Z' },
  { id: 'wh_003', eventType: 'payment_failed', channelKey: 'moov_money', transactionRef: 'TXN-2026-03-08-003', amount: 18000, currency: 'XOF', httpStatus: 200, responseTimeMs: 156, createdAt: '2026-03-08T09:18:00Z' },
  { id: 'wh_004', eventType: 'payment_success', channelKey: 'card', transactionRef: 'TXN-2026-03-08-004', amount: 35000, currency: 'XOF', httpStatus: 200, responseTimeMs: 234, createdAt: '2026-03-08T08:55:00Z' },
  { id: 'wh_005', eventType: 'payment_success', channelKey: 'sank_money', transactionRef: 'TXN-2026-03-08-005', amount: 10000, currency: 'XOF', httpStatus: 200, responseTimeMs: 178, createdAt: '2026-03-08T08:41:00Z' },
  { id: 'wh_006', eventType: 'refund', channelKey: 'orange_money', transactionRef: 'TXN-2026-03-07-112', amount: 15000, currency: 'XOF', httpStatus: 200, responseTimeMs: 312, createdAt: '2026-03-08T08:22:00Z' },
  { id: 'wh_007', eventType: 'payment_success', channelKey: 'wave', transactionRef: 'TXN-2026-03-08-006', amount: 14000, currency: 'XOF', httpStatus: 200, responseTimeMs: 105, createdAt: '2026-03-08T08:10:00Z' },
  { id: 'wh_008', eventType: 'payment_success', channelKey: 'orange_money', transactionRef: 'TXN-2026-03-08-007', amount: 16500, currency: 'XOF', httpStatus: 200, responseTimeMs: 128, createdAt: '2026-03-08T07:58:00Z' },
  { id: 'wh_009', eventType: 'payment_failed', channelKey: 'card', transactionRef: 'TXN-2026-03-08-008', amount: 42000, currency: 'XOF', httpStatus: 200, responseTimeMs: 445, createdAt: '2026-03-08T07:35:00Z' },
  { id: 'wh_010', eventType: 'payment_success', channelKey: 'moov_money', transactionRef: 'TXN-2026-03-08-009', amount: 13500, currency: 'XOF', httpStatus: 200, responseTimeMs: 167, createdAt: '2026-03-08T07:22:00Z' },
];

export const MOCK_PAYDUNYA_HEALTH: PaydunyaHealthStatus = {
  apiReachable: true,
  latencyMs: 145,
  lastSuccessfulTransaction: '2026-03-08T09:45:00Z',
  channelHealth: {
    orange_money: { operational: true, lastCheckedAt: '2026-03-08T09:50:00Z' },
    moov_money: { operational: true, lastCheckedAt: '2026-03-08T09:50:00Z' },
    wave: { operational: true, lastCheckedAt: '2026-03-08T09:50:00Z' },
    sank_money: { operational: true, lastCheckedAt: '2026-03-08T09:50:00Z' },
    telecel_money: { operational: false, lastCheckedAt: '2026-03-08T09:50:00Z' },
    card: { operational: true, lastCheckedAt: '2026-03-08T09:50:00Z' },
  },
  updatedAt: '2026-03-08T09:50:00Z',
};

// ============================================================================
// AWS STORAGE MOCK DATA (S3 + CloudFront + Lightsail)
// ============================================================================

// ============================================================================
// WHATSAPP BUSINESS DELIVERY STATS & HEALTH CHECK MOCK DATA
// ============================================================================

export const MOCK_WHATSAPP_HEALTH_CHECK = {
  apiReachable: true,
  latencyMs: 185,
  accountStatus: 'active',
  senderIdActive: true,
};

export const MOCK_WHATSAPP_DELIVERY_STATS = {
  today: { sent: 74, delivered: 72, failed: 1, pending: 1 },
  thisWeek: { sent: 485, delivered: 471, failed: 9 },
  thisMonth: { sent: 2100, delivered: 2048, failed: 38 },
  costBreakdown: {
    otp: 43_500,
    tickets: 15_600,
    reminders: 3_900,
    total: 63_000,
  },
  hourlyDistribution: [
    { hour: '06h', count: 8 }, { hour: '07h', count: 15 }, { hour: '08h', count: 22 },
    { hour: '09h', count: 18 }, { hour: '10h', count: 12 }, { hour: '11h', count: 9 },
    { hour: '12h', count: 6 }, { hour: '13h', count: 7 }, { hour: '14h', count: 11 },
    { hour: '15h', count: 14 }, { hour: '16h', count: 16 }, { hour: '17h', count: 13 },
    { hour: '18h', count: 10 }, { hour: '19h', count: 5 }, { hour: '20h', count: 3 },
  ],
};

// ============================================================================
// AWS STORAGE MOCK DATA (S3 + CloudFront + Lightsail)
// ============================================================================

export const MOCK_AWS_HEALTH_REPORT: AwsHealthReport = {
  s3: {
    status: 'healthy',
    bucketName: 'fasotravel-media-bf',
    region: 'eu-west-3',
    storageUsedGb: 2.8,
    storageLimitGb: 50,
    objectsCount: 3420,
    bandwidthUsedGb: 12.4,
    latencyMs: 52,
  },
  cloudfront: {
    status: 'healthy',
    distributionId: 'E1XXXXXXXXX',
    domain: 'cdn.fasotravel.bf',
    cacheHitRate: 94.2,
    requestsThisMonth: 38000,
    bandwidthGb: 8.6,
    latencyMs: 18,
  },
  lightsail: {
    status: 'running',
    instanceName: 'fasotravel-api-prod',
    region: 'eu-west-3',
    cpuPercent: 18,
    memoryPercent: 42,
    diskPercent: 34,
    uptimeHours: 820,
    publicIp: '13.38.xxx.xxx',
  },
};

export const MOCK_AWS_STORAGE_STATS = {
  totalSizeGb: 2.8,
  objectsByType: {
    stories: { count: 1200, sizeMb: 980, lastModified: '2026-03-09T07:30:00Z' },
    tickets: { count: 1800, sizeMb: 420, lastModified: '2026-03-09T08:15:00Z' },
    logos: { count: 45, sizeMb: 12, lastModified: '2026-03-05T14:00:00Z' },
    promos: { count: 375, sizeMb: 650, lastModified: '2026-03-08T16:45:00Z' },
  },
  recentUploads: [
    { key: 'stories/story_2026_03_09_001.jpg', sizeMb: 1.2, type: 'stories', uploadedAt: '2026-03-09T07:30:00Z' },
    { key: 'tickets/TKT-2026-03-09-142.pdf', sizeMb: 0.3, type: 'tickets', uploadedAt: '2026-03-09T08:15:00Z' },
    { key: 'promos/promo_march_flash.mp4', sizeMb: 4.8, type: 'promos', uploadedAt: '2026-03-08T16:45:00Z' },
    { key: 'logos/logo_staf_v2.png', sizeMb: 0.08, type: 'logos', uploadedAt: '2026-03-05T14:00:00Z' },
  ],
  monthlyGrowthMb: 180,
};

export const MOCK_AWS_CDN_STATS = {
  cacheHitRate: 94.2,
  requestsByStatus: [
    { status: '200 OK', count: 35800 },
    { status: '304 Not Modified', count: 1600 },
    { status: '404 Not Found', count: 420 },
    { status: '500 Error', count: 12 },
  ],
  topPaths: [
    { path: '/stories/', requests: 15200, bandwidth: '3.2 Go' },
    { path: '/tickets/', requests: 12400, bandwidth: '1.8 Go' },
    { path: '/promos/', requests: 6800, bandwidth: '2.4 Go' },
    { path: '/logos/', requests: 3600, bandwidth: '0.4 Go' },
  ],
  errorsCount: 432,
  bandwidthGb: 8.6,
};

export const MOCK_AWS_LIGHTSAIL_METRICS = {
  cpu: { current: 18, avg1h: 21, peak24h: 38 },
  memory: { current: 42, avg1h: 44, peak24h: 57 },
  disk: { usedPercent: 34, usedGb: 6.8, totalGb: 20 },
  network: { inMb: 165, outMb: 420 },
  uptime: { hours: 820, lastRestart: '2026-02-07T03:00:00Z' },
  activeConnections: 35,
  apiEndpointsCount: 12,
};

// ==================== REFERRAL / PARRAINAGE ====================

export const MOCK_REFERRALS: Referral[] = [
  {
    id: 'ref_001',
    referrerUserId: 'passenger_001',
    referrerName: 'Jean Kouamé',
    referrerCode: 'FT-226-JK01',
    referredUserId: 'passenger_002',
    referredName: 'Marie Traoré',
    pointsAwarded: 10,
    status: 'validated',
    validatedAt: '2025-02-20T09:00:00Z',
    createdAt: '2025-02-20T09:00:00Z',
  },
  {
    id: 'ref_002',
    referrerUserId: 'passenger_001',
    referrerName: 'Jean Kouamé',
    referrerCode: 'FT-226-JK01',
    referredUserId: 'passenger_004',
    referredName: 'Fatima Kaboré',
    pointsAwarded: 10,
    status: 'validated',
    validatedAt: '2025-04-05T16:30:00Z',
    createdAt: '2025-04-05T16:30:00Z',
  },
  {
    id: 'ref_003',
    referrerUserId: 'passenger_003',
    referrerName: 'Abdoulaye Sana',
    referrerCode: 'FT-226-AS03',
    referredUserId: 'passenger_005',
    referredName: 'Aminata Belem',
    pointsAwarded: 10,
    status: 'validated',
    validatedAt: '2025-05-01T14:00:00Z',
    createdAt: '2025-05-01T14:00:00Z',
  },
  {
    id: 'ref_004',
    referrerUserId: 'passenger_001',
    referrerName: 'Jean Kouamé',
    referrerCode: 'FT-226-JK01',
    referredUserId: 'passenger_006',
    referredName: 'Ousmane Zoungrana',
    pointsAwarded: 10,
    status: 'validated',
    validatedAt: '2026-02-01T10:00:00Z',
    createdAt: '2026-02-01T10:00:00Z',
  },
  {
    id: 'ref_005',
    referrerUserId: 'passenger_002',
    referrerName: 'Marie Traoré',
    referrerCode: 'FT-226-MT02',
    referredUserId: 'passenger_007',
    referredName: 'Hamidou Compaoré',
    pointsAwarded: 10,
    status: 'validated',
    validatedAt: '2026-01-15T12:00:00Z',
    createdAt: '2026-01-15T12:00:00Z',
  },
  {
    id: 'ref_006',
    referrerUserId: 'passenger_001',
    referrerName: 'Jean Kouamé',
    referrerCode: 'FT-226-JK01',
    referredUserId: 'passenger_008',
    referredName: 'Salif Compaoré',
    pointsAwarded: 10,
    status: 'validated',
    validatedAt: '2026-03-10T08:00:00Z',
    createdAt: '2026-03-10T08:00:00Z',
  },
  {
    id: 'ref_007',
    referrerUserId: 'passenger_003',
    referrerName: 'Abdoulaye Sana',
    referrerCode: 'FT-226-AS03',
    referredUserId: 'passenger_009',
    referredName: 'Rasmata Ouédraogo',
    pointsAwarded: 10,
    status: 'validated',
    validatedAt: '2026-03-12T14:30:00Z',
    createdAt: '2026-03-12T14:30:00Z',
  },
];

export const MOCK_REFERRAL_COUPONS: ReferralCoupon[] = [
  {
    id: 'rcoupon_001',
    userId: 'passenger_001',
    userName: 'Jean Kouamé',
    code: 'FASO-JK5001',
    amount: 500,
    pointsCost: 100,
    status: 'used',
    createdAt: '2025-06-10T10:00:00Z',
    expiresAt: '2025-09-10T10:00:00Z',
    usedAt: '2025-07-15T09:30:00Z',
  },
  {
    id: 'rcoupon_002',
    userId: 'passenger_001',
    userName: 'Jean Kouamé',
    code: 'FASO-JK1002',
    amount: 1000,
    pointsCost: 200,
    status: 'active',
    createdAt: '2026-03-20T14:00:00Z',
    expiresAt: '2026-06-20T14:00:00Z',
  },
  {
    id: 'rcoupon_003',
    userId: 'passenger_003',
    userName: 'Abdoulaye Sana',
    code: 'FASO-AS5003',
    amount: 500,
    pointsCost: 100,
    status: 'active',
    createdAt: '2026-03-22T08:00:00Z',
    expiresAt: '2026-06-22T08:00:00Z',
  },
  {
    id: 'rcoupon_004',
    userId: 'passenger_002',
    userName: 'Marie Traoré',
    code: 'FASO-MT5004',
    amount: 500,
    pointsCost: 100,
    status: 'expired',
    createdAt: '2025-08-01T10:00:00Z',
    expiresAt: '2025-11-01T10:00:00Z',
  },
  {
    id: 'rcoupon_005',
    userId: 'passenger_001',
    userName: 'Jean Kouamé',
    code: 'FASO-JK5005',
    amount: 500,
    pointsCost: 100,
    status: 'active',
    createdAt: '2026-02-15T10:00:00Z',
    expiresAt: '2026-05-15T10:00:00Z',
  },
  {
    id: 'rcoupon_006',
    userId: 'passenger_003',
    userName: 'Abdoulaye Sana',
    code: 'FASO-AS1006',
    amount: 1000,
    pointsCost: 200,
    status: 'used',
    createdAt: '2026-01-10T10:00:00Z',
    expiresAt: '2026-04-10T10:00:00Z',
    usedAt: '2026-02-05T14:30:00Z',
  },
];

export const MOCK_REFERRAL_STATS: ReferralStats = {
  totalReferrals: 46,
  totalPointsDistributed: 460,
  totalCouponsGenerated: 10,
  totalCouponsUsed: 3,
  totalCouponsCost: 4000,
  activeReferrers: 12,
  config: {
    enabled: true,
    pointsPerReferral: 10,
    updatedAt: '2025-01-01T00:00:00Z',
    updatedBy: 'Admin FasoTravel',
  },
  badgeDistribution: {
    standard: 35,
    ambassadeur: 8,
    super_ambassadeur: 2,
    legende: 1,
  },
  topReferrers: [
    { userId: 'passenger_003', name: 'Abdoulaye Sana', referrals: 26, badge: 'super_ambassadeur' },
    { userId: 'passenger_001', name: 'Jean Kouamé', referrals: 12, badge: 'ambassadeur' },
    { userId: 'passenger_002', name: 'Marie Traoré', referrals: 5, badge: 'standard' },
    { userId: 'passenger_004', name: 'Fatima Kaboré', referrals: 3, badge: 'standard' },
  ],
};