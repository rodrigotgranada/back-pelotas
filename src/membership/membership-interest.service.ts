import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MembershipInterest, MembershipInterestDocument } from './entities/membership-interest.entity';
import { CreateMembershipInterestDto } from './dto/create-interest.dto';
import { UpdateInterestDto } from './dto/update-interest.dto';

@Injectable()
export class MembershipInterestService {
  constructor(
    @InjectModel(MembershipInterest.name)
    private readonly interestModel: Model<MembershipInterestDocument>,
  ) {}

  async create(dto: CreateMembershipInterestDto) {
    const created = new this.interestModel({
      ...dto,
      userId: dto.userId ? new Types.ObjectId(dto.userId) : null,
      planId: new Types.ObjectId(dto.planId),
    });
    return created.save();
  }

  async findAll() {
    return this.interestModel
      .find()
      .populate('userId', 'firstName lastName email')
      .populate('planId', 'name price')
      .sort({ createdAt: -1 })
      .exec();
  }

  async countUnread() {
    const count = await this.interestModel.countDocuments({ isRead: false }).exec();
    return { count };
  }

  async update(id: string, dto: UpdateInterestDto) {
    const updated = await this.interestModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .exec();
    
    if (!updated) {
      throw new NotFoundException('Interesse não encontrado');
    }

    return updated;
  }

  async markAsRead(id: string) {
    return this.update(id, { isRead: true });
  }
}
