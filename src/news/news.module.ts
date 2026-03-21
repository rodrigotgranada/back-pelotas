import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NewsService } from './news.service';
import { NewsController } from './news.controller';
import { PublicNewsController } from './public-news.controller';
import { NewsEntity, NewsSchema } from './entities/news.entity';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: NewsEntity.name, schema: NewsSchema }]),
    UploadsModule,
  ],
  controllers: [NewsController, PublicNewsController],
  providers: [NewsService],
  exports: [NewsService],
})
export class NewsModule {}
