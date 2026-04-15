import {
  IsString,
  IsInt,
  IsOptional,
  IsEnum,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '../../common/constants';

export class CreatePaymentDto {
  @ApiProperty({ example: 'bk-uuid-1' })
  @IsString()
  bookingId: string;

  @ApiProperty({ example: 10000, description: 'Amount in XOF' })
  @IsInt()
  @Min(1)
  amount: number;

  @ApiPropertyOptional({ example: 'XOF', default: 'XOF' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @ApiProperty({
    example: 'orange_money',
    enum: PaymentMethod,
    description: 'Payment method',
  })
  @IsEnum(PaymentMethod)
  method: string;

  @ApiPropertyOptional({
    description: 'Idempotency key to prevent duplicate payments',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  idempotencyKey?: string;
}
