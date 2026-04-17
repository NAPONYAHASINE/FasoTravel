import { IsOptional, IsString, IsArray, IsDateString } from 'class-validator';

export class SendBulkDto {
  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsArray()
  channels: string[];

  @IsString()
  audience: string;

  @IsOptional()
  @IsString()
  actionUrl?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}

export class CreateAutomationRuleDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  triggerEvent: string;

  @IsOptional()
  @IsString()
  triggerLabel?: string;

  template: { title: string; message: string };

  @IsArray()
  channels: string[];

  @IsOptional()
  @IsString()
  category?: string;
}

export class UpdateAutomationRuleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  triggerEvent?: string;

  @IsOptional()
  @IsString()
  triggerLabel?: string;

  @IsOptional()
  template?: { title: string; message: string };

  @IsOptional()
  @IsArray()
  channels?: string[];

  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  category?: string;
}

export class CreateTemplateDto {
  @IsString()
  name: string;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  category?: string;
}

export class UpdateTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  category?: string;
}

export class CreateNotificationDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsString()
  type: string;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  actionUrl?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
