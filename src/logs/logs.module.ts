import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ActivityLogsService } from './activity-logs.service';
import { ActivityLogEntity, ActivityLogSchema } from './entities/activity-log.entity';
import { LogsController } from './logs.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ActivityLogEntity.name, schema: ActivityLogSchema }]),
  ],
  controllers: [LogsController],
  providers: [ActivityLogsService],
  exports: [ActivityLogsService],
})
export class LogsModule {}
