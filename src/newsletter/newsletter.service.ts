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
  async findAll(query: { page?: number; limit?: number; search?: string } = {}) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = query.search || '';

    const filter: any = {};
    if (search) {
      filter.email = { $regex: search, $options: 'i' };
    }

    const [data, total] = await Promise.all([
      this.newsletterModel
        .find(filter)
        .sort({ subscribedAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.newsletterModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getStats() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const stats = await this.newsletterModel.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    return stats.map(s => ({
      label: `${s._id.month}/${s._id.year}`,
      count: s.count,
    }));
  }
}
