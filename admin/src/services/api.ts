/**
 * API CLIENT RE-EXPORT - Point d'entrée unique pour apiClient (ZÉRO DUPLICATION)
 * Ce fichier ré-exporte apiClient depuis /shared pour faciliter les imports
 */

export { apiClient, ApiError } from '../shared/services/apiClient';
export type { default as AxiosInstance } from 'axios';
