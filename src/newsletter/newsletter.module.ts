import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NewsletterService } from './newsletter.service';
import { NewsletterController } from './newsletter.controller';
import { Newsletter, NewsletterSchema } from './entities/newsletter.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Newsletter.name, schema: NewsletterSchema }]),
  ],
  controllers: [NewsletterController],
  providers: [NewsletterService],
  exports: [NewsletterService],
})
export class NewsletterModule {}
