import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MatchesService } from './matches.service';
import { MatchesController } from './matches.controller';
import { MatchEntity, MatchSchema } from './entities/match.entity';
import { TeamsModule } from '../teams/teams.module';
import { CompetitionsModule } from '../competitions/competitions.module';

import { MatchesGateway } from './matches.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: MatchEntity.name, schema: MatchSchema }]),
    TeamsModule,
    CompetitionsModule,
  ],
  controllers: [MatchesController],
  providers: [MatchesService, MatchesGateway],
})
export class MatchesModule {}
