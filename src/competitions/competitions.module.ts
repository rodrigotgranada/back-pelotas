import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompetitionsService } from './competitions.service';
import { CompetitionsController } from './competitions.controller';
import { CompetitionEntity, CompetitionSchema } from './entities/competition.entity';
import { UploadsModule } from '../uploads/uploads.module';
import { LogsModule } from '../logs/logs.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: CompetitionEntity.name, schema: CompetitionSchema }]),
    UploadsModule,
    LogsModule,
  ],
  controllers: [CompetitionsController],
  providers: [CompetitionsService],
  exports: [CompetitionsService],
})
export class CompetitionsModule {}
