import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CompetitionDocument, CompetitionEntity } from './entities/competition.entity';
import { CreateCompetitionDto, UpdateCompetitionDto } from './dto/competition.dto';

@Injectable()
export class CompetitionsService {
  constructor(
    @InjectModel(CompetitionEntity.name)
    private readonly competitionModel: Model<CompetitionDocument>,
  ) {}

  async create(dto: CreateCompetitionDto): Promise<CompetitionEntity> {
    const competition = new this.competitionModel(dto);
    return competition.save();
  }

  async findAll(): Promise<CompetitionEntity[]> {
    return this.competitionModel.find().sort({ season: -1, name: 1 }).exec();
  }

  async findActive(): Promise<CompetitionEntity[]> {
    return this.competitionModel.find({ isActive: true }).sort({ name: 1 }).exec();
  }

  async findOne(id: string): Promise<CompetitionEntity> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid ID: ${id}`);
    }
    const competition = await this.competitionModel.findById(id).exec();
    if (!competition) {
      throw new NotFoundException(`Competition with ID ${id} not found`);
    }
    return competition;
  }

  async update(id: string, dto: UpdateCompetitionDto): Promise<CompetitionEntity> {
    const competition = await this.competitionModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .exec();
    if (!competition) {
      throw new NotFoundException(`Competition with ID ${id} not found`);
    }
    return competition;
  }

  async remove(id: string): Promise<void> {
    const result = await this.competitionModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Competition with ID ${id} not found`);
    }
  }
}
