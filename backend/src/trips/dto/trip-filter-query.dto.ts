import { IsOptional, IsString } from 'class-validator';

export class TripFilterQuery {
  @IsOptional() @IsString() operatorId?: string;
  @IsOptional() @IsString() routeId?: string;
  @IsOptional() @IsString() gareId?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() dateFrom?: string;
  @IsOptional() @IsString() dateTo?: string;
}
