import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WebhookPaymentDto {
  @ApiProperty({ description: 'Provider event type' })
  @IsString()
  event: string;

  @ApiProperty({ description: 'Provider reference / invoice token' })
  @IsString()
  @MaxLength(255)
  token: string;

  @ApiPropertyOptional({ description: 'Provider status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Custom data passed during create' })
  @IsOptional()
  custom_data?: Record<string, any>;
}
