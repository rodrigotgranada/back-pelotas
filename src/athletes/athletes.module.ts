import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AthletesController } from './athletes.controller';
import { AthletesService } from './athletes.service';
import { AthleteEntity, AthleteSchema } from './entities/athlete.entity';
import { LogsModule } from '../logs/logs.module';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: AthleteEntity.name, schema: AthleteSchema }]),
    LogsModule,
    UploadsModule,
  ],
  controllers: [AthletesController],
  providers: [AthletesService],
  exports: [AthletesService],
})
export class AthletesModule {}
