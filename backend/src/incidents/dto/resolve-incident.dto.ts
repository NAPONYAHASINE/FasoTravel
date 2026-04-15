import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResolveIncidentDto {
  @ApiProperty({ example: 'admin-uuid' })
  @IsString()
  resolvedBy: string;

  @ApiProperty({ example: 'Admin Diallo' })
  @IsString()
  @MaxLength(255)
  resolvedByName: string;

  @ApiPropertyOptional({ example: 'Résolu après contact avec le chauffeur' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}
