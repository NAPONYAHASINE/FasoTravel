import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  IsEnum,
  IsArray,
  IsBoolean,
  Min,
} from 'class-validator';

// ─── API Key Management ─────────────────────────────────────

export class CreateApiKeyDto {
  @IsString()
  name: string;

  @IsArray()
  @IsOptional()
  scopes?: string[];

  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  rateLimit?: number;
}

// ─── Trip Injection ─────────────────────────────────────────

export class ExternalCreateTripDto {
  @IsString()
  fromStationId: string;

  @IsString()
  toStationId: string;

  @IsDateString()
  departureTime: string;

  @IsDateString()
  @IsOptional()
  arrivalTime?: string;

  @IsNumber()
  price: number;

  @IsNumber()
  @IsOptional()
  totalSeats?: number;

  @IsString()
  @IsOptional()
  vehicleId?: string;

  @IsString()
  @IsOptional()
  routeId?: string;
}

export class ExternalUpdateTripStatusDto {
  @IsEnum([
    'scheduled',
    'boarding',
    'departed',
    'in_transit',
    'arrived',
    'cancelled',
    'delayed',
  ])
  status: string;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsNumber()
  @IsOptional()
  delayMinutes?: number;
}

// ─── Ticket Injection ───────────────────────────────────────

export class ExternalCreateTicketDto {
  @IsString()
  tripId: string;

  @IsString()
  passengerName: string;

  @IsString()
  @IsOptional()
  passengerPhone?: string;

  @IsString()
  @IsOptional()
  seatNumber?: string;

  @IsNumber()
  price: number;
}

// ─── Location Push ──────────────────────────────────────────

export class ExternalLocationDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsNumber()
  @IsOptional()
  speed?: number;

  @IsNumber()
  @IsOptional()
  heading?: number;
}

// ─── Cash Transaction Injection ─────────────────────────────

export class ExternalCashTransactionDto {
  @IsEnum(['sale', 'refund', 'deposit', 'withdrawal'])
  type: string;

  @IsNumber()
  amount: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  stationId?: string;

  @IsString()
  @IsOptional()
  cashierId?: string;
}

// ─── Query DTOs ─────────────────────────────────────────────

export class ExternalQueryDto {
  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

// ─── Webhook Config ─────────────────────────────────────────

export class WebhookConfigDto {
  @IsString()
  url: string;

  @IsArray()
  events: string[]; // booking_created, payment_confirmed, ticket_cancelled, trip_status_changed

  @IsString()
  @IsOptional()
  secret?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
