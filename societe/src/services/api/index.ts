/**
 * Export centralisé de tous les services API
 * 
 * Utilisation :
 * import { ticketService, authService } from '@/services/api';
 */

export { ticketService } from './ticket.service';
export { tripService } from './trip.service';
export { authService } from './auth.service';
export { managerService } from './manager.service';
export { cashierService } from './cashier.service';
export { routeService } from './route.service';
export { stationService } from './station.service';
export { scheduleService } from './schedule.service';
export { pricingService } from './pricing.service';
export { storyService } from './story.service';

// Export aussi les types
export type * from '../types';
