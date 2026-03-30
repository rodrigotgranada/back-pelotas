import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IdolsService } from './idols.service';
import { IdolsController } from './idols.controller';
import { PublicIdolsController } from './public-idols.controller';
import { IdolEntity, IdolSchema } from './entities/idol.entity';
import { LogsModule } from '../logs/logs.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: IdolEntity.name, schema: IdolSchema },
    ]),
    LogsModule,
  ],
  controllers: [IdolsController, PublicIdolsController],
  providers: [IdolsService],
  exports: [IdolsService],
})
export class IdolsModule {}
