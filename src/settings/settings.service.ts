import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SettingEntity } from './entities/setting.entity';
import { UpdateSettingDto } from './dto/update-setting.dto';

export interface PublicSettings {
  badgeUrl: string | null;
  themePreset: string;
  defaultNewsImageUrl: string | null;
  isMembershipEnabled: boolean;
}

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(SettingEntity.name)
    private readonly settingModel: Model<SettingEntity>,
  ) {}

  async getPublicSettings(): Promise<PublicSettings> {
    const settings = await this.settingModel.find({
      key: { $in: ['badgeUrl', 'themePreset', 'defaultNewsImageUrl', 'isMembershipEnabled'] },
    });

    const map: Record<string, string> = {};
    for (const s of settings) {
      map[s.key] = s.value;
    }

    return {
      badgeUrl: map['badgeUrl'] ?? null,
      themePreset: map['themePreset'] ?? 'default',
      defaultNewsImageUrl: map['defaultNewsImageUrl'] ?? null,
      isMembershipEnabled: (map['isMembershipEnabled'] ?? 'true') === 'true',
    };
  }

  async updateSetting(dto: UpdateSettingDto): Promise<{ key: string; value: string }> {
    const setting = await this.settingModel.findOneAndUpdate(
      { key: dto.key },
      { $set: { value: dto.value } },
      { upsert: true, returnDocument: 'after' },
    );
    return { key: setting.key, value: setting.value };
  }
}
