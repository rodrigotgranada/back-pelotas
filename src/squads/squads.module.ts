import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SquadsController } from './squads.controller';
import { SquadsService } from './squads.service';
import { SquadEntity, SquadSchema } from './entities/squad.entity';
import { LogsModule } from '../logs/logs.module';

import { AthletesModule } from '../athletes/athletes.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: SquadEntity.name, schema: SquadSchema }]),
    AthletesModule,
    LogsModule,
  ],
  controllers: [SquadsController],
  providers: [SquadsService],
  exports: [SquadsService],
})
export class SquadsModule {}
