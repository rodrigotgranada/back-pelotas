import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LogsModule } from '../logs/logs.module';
import { SponsorEntity, SponsorSchema } from './entities/sponsor.entity';
import { PublicSponsorsController } from './public-sponsors.controller';
import { SponsorsController } from './sponsors.controller';
import { SponsorsService } from './sponsors.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: SponsorEntity.name, schema: SponsorSchema }]),
    LogsModule,
  ],
  controllers: [SponsorsController, PublicSponsorsController],
  providers: [SponsorsService],
})
export class SponsorsModule {}
