import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NewsService } from './news.service';
import { NewsController } from './news.controller';
import { PublicNewsController } from './public-news.controller';
import { NewsEntity, NewsSchema } from './entities/news.entity';
import { NewsLikeEntity, NewsLikeSchema } from './entities/news-like.entity';
import { CommentEntity, CommentSchema } from './entities/comment.entity';
import { UploadsModule } from '../uploads/uploads.module';
import { LogsModule } from '../logs/logs.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NewsEntity.name, schema: NewsSchema },
      { name: NewsLikeEntity.name, schema: NewsLikeSchema },
      { name: CommentEntity.name, schema: CommentSchema },
    ]),
    UploadsModule,
    LogsModule,
  ],
  controllers: [NewsController, PublicNewsController],
  providers: [NewsService],
  exports: [NewsService],
})
export class NewsModule {}
