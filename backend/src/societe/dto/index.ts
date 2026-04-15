import {
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  IsNumber,
} from 'class-validator';

export class CreateStaffDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsString()
  password?: string;
}

export class UpdateStaffDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class StaffQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsEnum(['1', '5', '10', '20', '50'])
  limit?: string;

  @IsOptional()
  @IsString()
  page?: string;
}

export class TripQueryDto {
  @IsOptional() @IsString() routeId?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() dateFrom?: string;
  @IsOptional() @IsString() dateTo?: string;
}

export class TicketQueryDto {
  @IsOptional() @IsString() tripId?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() salesChannel?: string;
  @IsOptional() @IsString() dateFrom?: string;
  @IsOptional() @IsString() dateTo?: string;
}

export class CashTransactionQueryDto {
  @IsOptional() @IsString() cashierId?: string;
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() dateFrom?: string;
  @IsOptional() @IsString() dateTo?: string;
}

export class CreateCashSaleDto {
  @IsString() tripId: string;
  @IsString() passengerName: string;
  @IsOptional() @IsString() passengerPhone?: string;
  @IsOptional() @IsString() seatNumber?: string;
  @IsNumber() price: number;
  @IsOptional() @IsString() paymentMethod?: string;
}

export class CreateCashTransactionDto {
  @IsOptional() @IsString() type?: string;
  @IsNumber() amount: number;
  @IsOptional() @IsString() paymentMethod?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() stationId?: string;
}

export class CreateRouteDto {
  @IsString() fromStationId: string;
  @IsString() toStationId: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsNumber() distanceKm?: number;
  @IsOptional() @IsNumber() basePrice?: number;
  @IsOptional() @IsString() operatorId?: string;
}

export class UpdateRouteDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsNumber() distanceKm?: number;
  @IsOptional() @IsNumber() basePrice?: number;
  @IsOptional() @IsString() status?: string;
}

export class CreateScheduleTemplateDto {
  @IsOptional() @IsString() fromStopId?: string;
  @IsOptional() @IsString() toStopId?: string;
  @IsOptional() @IsString() departureTime?: string;
  @IsOptional() @IsNumber() durationMinutes?: number;
  @IsOptional() @IsNumber() basePrice?: number;
  @IsOptional() @IsString() vehicleId?: string;
}

export class UpdateScheduleTemplateDto {
  @IsOptional() @IsString() departureTime?: string;
  @IsOptional() @IsNumber() durationMinutes?: number;
  @IsOptional() @IsNumber() basePrice?: number;
  @IsOptional() @IsString() vehicleId?: string;
  @IsOptional() @IsString() status?: string;
}

export class UpdateTicketDto {
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() seatNumber?: string;
  @IsOptional() @IsString() passengerName?: string;
  @IsOptional() @IsString() passengerPhone?: string;
}
