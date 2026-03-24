import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Newsletter } from './entities/newsletter.entity';
import { SubscribeDto } from './dto/subscribe.dto';

@Injectable()
export class NewsletterService {
  constructor(@InjectModel(Newsletter.name) private newsletterModel: Model<Newsletter>) {}

  async subscribe(subscribeDto: SubscribeDto): Promise<{ message: string }> {
    const { email } = subscribeDto;
    
    const existing = await this.newsletterModel.findOne({ email }).exec();
    if (existing) {
      throw new ConflictException('Este e-mail já está inscrito em nossa newsletter.');
    }

    const newSubscription = new this.newsletterModel({ email });
    await newSubscription.save();

    return { message: 'Inscrição realizada com sucesso! Obrigado por acompanhar o Pelotas.' };
  }

  // Admin method to list subscribers (optional but good for future)
  async findAll() {
    return this.newsletterModel.find().sort({ subscribedAt: -1 }).exec();
  }
}
