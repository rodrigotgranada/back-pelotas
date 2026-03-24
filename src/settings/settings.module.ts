import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { SettingEntity, SettingSchema } from './entities/setting.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SettingEntity.name, schema: SettingSchema },
    ]),
  ],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
