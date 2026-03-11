/**
 * @file index.ts
 * @description Main export file for the Shared layer
 * 
 * This is the entry point for both Mobile and Societe apps
 * to import shared functionality.
 * 
 * Usage in Mobile:
 *   import { apiClient, Trip, formatCurrency } from '../shared';
 * 
 * Usage in Societe:
 *   import { apiClient, OperatorUser, formatDate } from '../shared';
 */

// Services
export * from './services';

// Types
export * from './types';

// Utils
export * from './utils';
