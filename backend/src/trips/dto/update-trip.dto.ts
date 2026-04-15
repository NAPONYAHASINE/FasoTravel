import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateTripDto } from './create-trip.dto';

export class UpdateTripDto extends PartialType(
  OmitType(CreateTripDto, ['id'] as const),
) {}
