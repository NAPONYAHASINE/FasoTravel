/**
 * SERVICES BARREL EXPORT
 * 
 * ⚠️ IMPORTANT: Ce fichier re-exporte authService depuis son service dédié.
 * Tous les autres services sont des singletons dédiés importés directement :
 * 
 * - authService.ts → authService (authentification mock+production)
 * - entitiesService.ts → transportCompaniesService, passengersService, etc.
 * - bookingService.ts → bookingService (réservations)
 * - ticketService.ts → ticketService (billets)
 * - paymentService.ts → paymentService (paiements)
 * - financialService.ts → financialService (métriques financières)
 * - sessionService.ts → sessionService (sessions utilisateurs)
 * - securityService.ts → securityService (sécurité admin)
 * - promotionService.ts → promotionService (promotions)
 * - policyService.ts → policyService (politiques)
 * - stationService.ts → stationService (stats gares)
 * - infobipService.ts → infobipService (SMS/OTP)
 * - awsStorageService.ts → awsStorageService (S3/CloudFront/Lightsail)
 * - paydunyaService.ts → paydunyaService (PayDunya)
 * - platformAnalyticsService.ts → platformAnalyticsService (analytics)
 * 
 * Les hooks importent directement les services dédiés (pas ce barrel).
 */

export { authService } from './authService';
export type { LoginResult, OtpVerifyResult } from './authService';
