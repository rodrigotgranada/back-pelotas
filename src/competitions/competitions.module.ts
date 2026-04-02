import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompetitionsService } from './competitions.service';
import { CompetitionsController } from './competitions.controller';
import { CompetitionEntity, CompetitionSchema } from './entities/competition.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: CompetitionEntity.name, schema: CompetitionSchema }]),
  ],
  controllers: [CompetitionsController],
  providers: [CompetitionsService],
  exports: [CompetitionsService],
})
export class CompetitionsModule {}
