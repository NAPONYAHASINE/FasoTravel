import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, WebSocket } from 'ws';
import { TrackingService, VehicleLocationPayload } from './tracking.service';
import { IncomingMessage } from 'http';

/**
 * WebSocket gateway for live vehicle tracking.
 *
 * One boarded passenger emits position → backend aggregates → broadcasts to all.
 *
 * Frontend connects with: ws://host/api/trips/{tripId}/location/subscribe
 * Also supports legacy: ws://host/ws/tracking?tripId=xxx
 *
 * Path is set to '/' so ALL ws upgrade requests are caught, then we route
 * based on the URL path/query to extract tripId.
 */
@WebSocketGateway({ path: '/ws/tracking', transports: ['websocket'] })
export class TrackingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TrackingGateway.name);

  /** Map: WebSocket client -> tripId subscribed to */
  private readonly clientTrips = new Map<WebSocket, string>();

  /** Map: WebSocket client -> unsubscribe function */
  private readonly clientUnsubscribers = new Map<WebSocket, () => void>();

  constructor(private readonly trackingService: TrackingService) {}

  handleConnection(client: WebSocket, ...args: unknown[]): void {
    const req = args[0] as IncomingMessage;
    const url = req?.url ?? '';

    // Support both URL patterns:
    // 1. /api/trips/{tripId}/location/subscribe (frontend pattern)
    // 2. /ws/tracking?tripId=xxx (legacy/direct)
    let tripId: string | undefined;

    // Try path-based pattern first: /api/trips/{tripId}/location/subscribe
    const pathMatch = url.match(
      /\/(?:api\/)?trips\/([^/]+)\/location\/subscribe/,
    );
    if (pathMatch) {
      tripId = pathMatch[1];
    }

    // Fallback to query param: ?tripId=xxx
    if (!tripId) {
      const queryMatch = url.match(/[?&]tripId=([^&]+)/);
      tripId = queryMatch?.[1];
    }

    if (!tripId) {
      this.logger.warn(
        `WebSocket connection without tripId (url: ${url}) - closing`,
      );
      client.close(4000, 'tripId required');
      return;
    }

    this.clientTrips.set(client, tripId);

    // Subscribe to position updates for this trip
    const unsubscribe = this.trackingService.subscribe(
      tripId,
      (payload: VehicleLocationPayload) => {
        try {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(payload));
          }
        } catch (e) {
          this.logger.warn(`Failed to send to client: ${e}`);
        }
      },
    );

    this.clientUnsubscribers.set(client, unsubscribe);
    this.logger.log(`Client connected to tracking for trip: ${tripId}`);
  }

  handleDisconnect(client: WebSocket): void {
    const tripId = this.clientTrips.get(client);
    const unsubscribe = this.clientUnsubscribers.get(client);

    if (unsubscribe) {
      unsubscribe();
    }

    this.clientTrips.delete(client);
    this.clientUnsubscribers.delete(client);

    this.logger.log(
      `Client disconnected from tracking for trip: ${tripId ?? 'unknown'}`,
    );
  }
}
