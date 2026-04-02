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
  isSponsorsEnabled: boolean;
  isSquadsEnabled: boolean;
  isNewsletterEnabled: boolean;
  isIdolsEnabled: boolean;
  isMatchesEnabled: boolean;

  // Footer / Contacts
  footerPhone?: string;
  footerIsWhatsapp?: boolean;
  footerEmail?: string;
  footerAddress?: string;
  footerMapsEmbedUrl?: string;
  footerSocialLinks?: string;
  footerLinks?: string; // JSON string associated with the footer links
  footerDevName?: string;
  footerDevUrl?: string;
}

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(SettingEntity.name)
    private readonly settingModel: Model<SettingEntity>,
  ) {}

  async getPublicSettings(): Promise<PublicSettings> {
    const keys = [
      'badgeUrl', 'themePreset', 'defaultNewsImageUrl', 'isMembershipEnabled', 'isSponsorsEnabled',
      'isSquadsEnabled', 'isNewsletterEnabled', 'isIdolsEnabled',
      'footerPhone', 'footerIsWhatsapp', 'footerEmail', 'footerAddress', 'footerMapsEmbedUrl',
      'footerSocialLinks', 'footerLinks',
      'footerFacebook', 'footerInstagram', 'footerTwitter', 'footerYoutube', 'footerTiktok',
      'footerDevName', 'footerDevUrl', 'isMatchesEnabled'
    ];

    const settings = await this.settingModel.find({
      key: { $in: keys },
    });

    const map: Record<string, string> = {};
    for (const s of settings) {
      map[s.key] = s.value;
    }

    let socialLinksJson = map['footerSocialLinks'];
    
    // Compatibility: If NEW dynamic field is empty, try to build it from OLD legacy fields
    if (!socialLinksJson || socialLinksJson === '[]') {
      const legacySocials: { type: string; url: string }[] = [];
      if (map['footerInstagram']) legacySocials.push({ type: 'instagram', url: map['footerInstagram'] });
      if (map['footerFacebook']) legacySocials.push({ type: 'facebook', url: map['footerFacebook'] });
      if (map['footerTwitter']) legacySocials.push({ type: 'twitter', url: map['footerTwitter'] });
      if (map['footerYoutube']) legacySocials.push({ type: 'youtube', url: map['footerYoutube'] });
      if (map['footerTiktok']) legacySocials.push({ type: 'tiktok', url: map['footerTiktok'] });
      
      if (legacySocials.length > 0) {
        socialLinksJson = JSON.stringify(legacySocials);
      }
    }

    return {
      badgeUrl: map['badgeUrl'] || null,
      themePreset: map['themePreset'] ?? 'default',
      defaultNewsImageUrl: map['defaultNewsImageUrl'] || null,
      isMembershipEnabled: (map['isMembershipEnabled'] ?? 'true') === 'true',
      isSponsorsEnabled: (map['isSponsorsEnabled'] ?? 'true') === 'true',
      isSquadsEnabled: (map['isSquadsEnabled'] ?? 'true') === 'true',
      isNewsletterEnabled: (map['isNewsletterEnabled'] ?? 'true') === 'true',
      isIdolsEnabled: (map['isIdolsEnabled'] ?? 'true') === 'true',
      isMatchesEnabled: (map['isMatchesEnabled'] ?? 'true') === 'true',
      
      footerPhone: map['footerPhone'] ?? '',
      footerIsWhatsapp: (map['footerIsWhatsapp'] ?? 'false') === 'true',
      footerEmail: map['footerEmail'] ?? '',
      footerAddress: map['footerAddress'] ?? '',
      footerMapsEmbedUrl: map['footerMapsEmbedUrl'] ?? '',
      footerSocialLinks: socialLinksJson ?? '[]',
      footerLinks: map['footerLinks'] ?? '[]',
      footerDevName: map['footerDevName'] ?? 'Rodrigo Granada',
      footerDevUrl: map['footerDevUrl'] ?? 'https://www.linkedin.com/in/rtgranada-desenvolvedor/',
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
