/**
 * @file awsStorageService.ts
 * @description Service dedie AWS S3 + CloudFront + Lightsail
 * 
 * Architecture backend-ready :
 * - Mode mock : donnees depuis adminMockData.ts (ZÉRO inline)
 * - Mode production : appels API vers /admin/aws/*
 * 
 * ENDPOINTS MAPPES :
 * GET    /admin/aws/health             → getHealthReport()
 * GET    /admin/aws/s3/stats           → getStorageStats()
 * GET    /admin/aws/cloudfront/stats   → getCdnStats()
 * GET    /admin/aws/lightsail/metrics  → getLightsailMetrics()
 * POST   /admin/aws/cloudfront/purge   → purgeCdnCache()
 * POST   /admin/aws/lightsail/restart  → restartInstance()
 */

import { AppConfig } from '../config/app.config';
import { apiService } from './apiService';
import type { AwsHealthReport } from '../shared/types/standardized';
import {
  MOCK_AWS_HEALTH_REPORT,
  MOCK_AWS_STORAGE_STATS,
  MOCK_AWS_CDN_STATS,
  MOCK_AWS_LIGHTSAIL_METRICS,
} from '../lib/adminMockData';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================================
// SERVICE
// ============================================================================

class AwsStorageService {
  /**
   * Rapport de sante complet (S3 + CloudFront + Lightsail)
   */
  async getHealthReport(): Promise<ApiResponse<AwsHealthReport>> {
    if (AppConfig.isMock) {
      await new Promise(r => setTimeout(r, 700));
      // Overlay dynamic values on static mock template
      return {
        success: true,
        data: {
          ...MOCK_AWS_HEALTH_REPORT,
          s3: {
            ...MOCK_AWS_HEALTH_REPORT.s3,
            latencyMs: Math.round(30 + Math.random() * 40),
          },
          cloudfront: {
            ...MOCK_AWS_HEALTH_REPORT.cloudfront,
            latencyMs: Math.round(10 + Math.random() * 20),
          },
          lightsail: {
            ...MOCK_AWS_HEALTH_REPORT.lightsail,
            cpuPercent: Math.round(12 + Math.random() * 15),
            memoryPercent: Math.round(38 + Math.random() * 10),
            uptimeHours: Math.round(720 + Math.random() * 200),
          },
        },
      };
    }
    return await apiService.get('/admin/aws/health');
  }

  /**
   * Stats S3 detaillees
   */
  async getStorageStats(): Promise<ApiResponse<typeof MOCK_AWS_STORAGE_STATS>> {
    if (AppConfig.isMock) {
      await new Promise(r => setTimeout(r, 500));
      return { success: true, data: { ...MOCK_AWS_STORAGE_STATS } };
    }
    return await apiService.get('/admin/aws/s3/stats');
  }

  /**
   * Stats CloudFront detaillees
   */
  async getCdnStats(): Promise<ApiResponse<typeof MOCK_AWS_CDN_STATS>> {
    if (AppConfig.isMock) {
      await new Promise(r => setTimeout(r, 400));
      return { success: true, data: { ...MOCK_AWS_CDN_STATS } };
    }
    return await apiService.get('/admin/aws/cloudfront/stats');
  }

  /**
   * Metriques Lightsail en temps reel
   */
  async getLightsailMetrics(): Promise<ApiResponse<typeof MOCK_AWS_LIGHTSAIL_METRICS>> {
    if (AppConfig.isMock) {
      await new Promise(r => setTimeout(r, 600));
      const cpuCurrent = Math.round(12 + Math.random() * 15);
      const memCurrent = Math.round(38 + Math.random() * 10);
      return {
        success: true,
        data: {
          ...MOCK_AWS_LIGHTSAIL_METRICS,
          cpu: { current: cpuCurrent, avg1h: cpuCurrent + 3, peak24h: Math.min(cpuCurrent + 20, 85) },
          memory: { current: memCurrent, avg1h: memCurrent + 2, peak24h: Math.min(memCurrent + 15, 78) },
          network: { inMb: Math.round(120 + Math.random() * 80), outMb: Math.round(340 + Math.random() * 200) },
          uptime: { ...MOCK_AWS_LIGHTSAIL_METRICS.uptime, hours: Math.round(720 + Math.random() * 200) },
          activeConnections: Math.round(20 + Math.random() * 30),
        },
      };
    }
    return await apiService.get('/admin/aws/lightsail/metrics');
  }

  /**
   * Purger le cache CDN (CloudFront invalidation)
   */
  async purgeCdnCache(paths?: string[]): Promise<ApiResponse<{ invalidationId: string; paths: string[]; estimatedTimeSec: number }>> {
    if (AppConfig.isMock) {
      await new Promise(r => setTimeout(r, 1500));
      const purgedPaths = paths || ['/*'];
      return {
        success: true,
        data: {
          invalidationId: `INV_${Date.now()}`,
          paths: purgedPaths,
          estimatedTimeSec: 180,
        },
      };
    }
    return await apiService.post('/admin/aws/cloudfront/purge', { paths: paths || ['/*'] });
  }

  /**
   * Redemarrer l'instance Lightsail
   */
  async restartInstance(): Promise<ApiResponse<{ success: boolean; message: string; estimatedDowntimeSec: number }>> {
    if (AppConfig.isMock) {
      await new Promise(r => setTimeout(r, 2000));
      return {
        success: true,
        data: {
          success: true,
          message: 'Instance fasotravel-api-prod en cours de redemarrage',
          estimatedDowntimeSec: 45,
        },
      };
    }
    return await apiService.post('/admin/aws/lightsail/restart');
  }
}

export const awsStorageService = new AwsStorageService();
