import { IsString, IsArray, IsIn, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class NotifyPassengersDto {
  @ApiProperty({
    example: 'delay',
    enum: ['delay', 'cancellation', 'info', 'update', 'resolution'],
  })
  @IsString()
  @IsIn(['delay', 'cancellation', 'info', 'update', 'resolution'])
  notificationType: string;

  @ApiProperty({ example: 'Le trajet est retardé de 30 minutes.' })
  @IsString()
  @MaxLength(500)
  message: string;

  @ApiProperty({ example: ['push', 'sms'] })
  @IsArray()
  @IsString({ each: true })
  channels: string[];
}
