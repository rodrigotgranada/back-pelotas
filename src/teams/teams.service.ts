import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TeamDocument, TeamEntity } from './entities/team.entity';
import { CreateTeamDto, UpdateTeamDto } from './dto/team.dto';
import { UploadsService } from '../uploads/uploads.service';
import { ActivityLogsService } from '../logs/activity-logs.service';

@Injectable()
export class TeamsService {
  constructor(
    @InjectModel(TeamEntity.name)
    private readonly teamModel: Model<TeamDocument>,
    private readonly uploadsService: UploadsService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async create(dto: CreateTeamDto): Promise<TeamEntity> {
    const team = new this.teamModel(dto);
    return team.save();
  }

  async findAll(): Promise<any[]> {
    const teams = await this.teamModel.find({ deletedAt: null }).sort({ name: 1 }).exec();
    return teams.map(t => {
      const obj = t.toObject();
      return { ...obj, id: t._id.toString() };
    });
  }

  async findOne(id: string): Promise<TeamEntity> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid ID: ${id}`);
    }
    const team = await this.teamModel.findById(id).exec();
    if (!team || team.deletedAt) {
      throw new NotFoundException(`Team with ID ${id} not found`);
    }
    return team;
  }

  async findByName(name: string): Promise<TeamEntity | null> {
    return this.teamModel.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') }, deletedAt: null }).exec();
  }

  async update(id: string, dto: UpdateTeamDto): Promise<TeamEntity> {
    const team = await this.teamModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .exec();
    if (!team) {
      throw new NotFoundException(`Team with ID ${id} not found`);
    }
    return team;
  }

  async remove(id: string): Promise<void> {
    const result = await this.teamModel
      .findByIdAndUpdate(id, { deletedAt: new Date() })
      .exec();
    if (!result) {
      throw new NotFoundException(`Team with ID ${id} not found`);
    }
  }

  async uploadImage(file: Express.Multer.File): Promise<{ url: string }> {
    const result = await this.uploadsService.uploadImageForEntity({
      entity: 'teams',
      entityId: new Types.ObjectId().toHexString(),
      file,
    });
    return { url: result.url };
  }
}
