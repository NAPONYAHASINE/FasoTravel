import { IsNumber, IsOptional, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Accepts both canonical names (latitude, longitude, radiusKm)
 * and legacy short aliases (lat, lon, radius) used by Mobile api.ts.
 */
export class NearbyStationsDto {
  @ApiProperty({ description: 'Latitude', example: 12.3714 })
  @Transform(({ obj }: { obj: Record<string, unknown> }) => {
    const v = obj.latitude ?? obj.lat;
    return v !== undefined ? Number(v) : undefined;
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ description: 'Longitude', example: -1.5197 })
  @Transform(({ obj }: { obj: Record<string, unknown> }) => {
    const v = obj.longitude ?? obj.lon;
    return v !== undefined ? Number(v) : undefined;
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiPropertyOptional({
    description: 'Radius in km (default: 10)',
    default: 10,
  })
  @IsOptional()
  @Transform(({ obj }: { obj: Record<string, unknown> }) => {
    const v = obj.radiusKm ?? obj.radius;
    return v !== undefined ? Number(v) : 10;
  })
  @IsNumber()
  @Min(1)
  @Max(200)
  radiusKm: number = 10;
}
