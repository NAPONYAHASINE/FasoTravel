import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppSettings } from '../database/entities';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(AppSettings)
    private readonly settingsRepo: Repository<AppSettings>,
  ) {}

  async getAll() {
    const settings = await this.settingsRepo.find({
      order: { category: 'ASC', key: 'ASC' },
    });
    // Return as key-value map grouped by category
    const result: Record<string, Record<string, any>> = {};
    for (const s of settings) {
      if (!result[s.category]) result[s.category] = {};
      result[s.category][s.key] = s.value;
    }
    return result;
  }

  async getByCategory(category: string) {
    const settings = await this.settingsRepo.find({
      where: { category },
      order: { key: 'ASC' },
    });
    const result: Record<string, any> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }
    return result;
  }

  async update(body: Record<string, any>, updatedBy?: string) {
    const results: AppSettings[] = [];
    for (const [key, value] of Object.entries(body)) {
      let setting = await this.settingsRepo.findOneBy({ key });
      if (setting) {
        setting.value = value as Record<string, any>;
        if (updatedBy) setting.updatedBy = updatedBy;
      } else {
        setting = this.settingsRepo.create({
          key,
          value: value as Record<string, any>,
          category: 'general',
          updatedBy,
        });
      }
      results.push(await this.settingsRepo.save(setting));
    }
    return results;
  }

  async uploadLogo(_fileUrl: string, updatedBy?: string) {
    let setting = await this.settingsRepo.findOneBy({ key: 'app_logo' });
    if (setting) {
      setting.value = { url: _fileUrl };
      if (updatedBy) setting.updatedBy = updatedBy;
    } else {
      setting = this.settingsRepo.create({
        key: 'app_logo',
        value: { url: _fileUrl },
        category: 'branding',
        updatedBy,
      });
    }
    return this.settingsRepo.save(setting);
  }

  async exportSettings() {
    const settings = await this.settingsRepo.find();
    return {
      exportedAt: new Date().toISOString(),
      settings: settings.map((s) => ({
        key: s.key,
        value: s.value,
        category: s.category,
      })),
    };
  }

  async importSettings(
    data: { key: string; value: unknown; category?: string }[],
  ) {
    let imported = 0;
    for (const item of data) {
      let setting = await this.settingsRepo.findOneBy({ key: item.key });
      if (setting) {
        setting.value = item.value as Record<string, unknown>;
        if (item.category) setting.category = item.category;
      } else {
        setting = this.settingsRepo.create({
          key: item.key,
          value: item.value as Record<string, unknown>,
          category: item.category ?? 'general',
        });
      }
      await this.settingsRepo.save(setting);
      imported++;
    }
    return { imported };
  }
}
