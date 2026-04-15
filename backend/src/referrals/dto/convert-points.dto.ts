import { IsInt, IsPositive } from 'class-validator';

export class ConvertPointsDto {
  @IsInt()
  @IsPositive()
  pointsCost: number;
}
