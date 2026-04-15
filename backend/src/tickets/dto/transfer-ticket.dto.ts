import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TransferTicketDto {
  @ApiProperty({
    description: 'Phone number of the recipient',
    example: '+22670999888',
  })
  @IsString()
  @MaxLength(20)
  recipientPhone: string;

  @ApiPropertyOptional({ description: 'Name of recipient' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  recipientName?: string;
}
