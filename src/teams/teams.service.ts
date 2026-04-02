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

  async create(dto: CreateTeamDto, adminId?: string): Promise<TeamEntity> {
    const team = new this.teamModel(dto);
    await team.save();

    await this.activityLogsService.record({
      action: 'create',
      entity: 'teams',
      entityId: team._id.toString(),
      status: 'success',
      actorUserId: adminId,
      message: `Admin criou o time ${team.name}`,
    });

    return team;
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

  async update(id: string, dto: UpdateTeamDto, adminId?: string): Promise<TeamEntity> {
    const oldTeam = await this.teamModel.findById(id).exec();
    if (!oldTeam) {
      throw new NotFoundException(`Team with ID ${id} not found`);
    }

    // Se a logo mudou, deletar a antiga do storage
    if (dto.logoUrl && oldTeam.logoUrl && dto.logoUrl !== oldTeam.logoUrl) {
      try {
        const url = new URL(oldTeam.logoUrl);
        const key = decodeURIComponent(url.pathname.split('/o/')[1].split('?')[0]);
        await this.uploadsService.deleteFileByKey(key);
      } catch (e) {
        // Ignorar erro na deleção
      }
    }

    const team = await this.teamModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .exec();

    await this.activityLogsService.record({
      action: 'update',
      entity: 'teams',
      entityId: id,
      status: 'success',
      actorUserId: adminId,
      message: `Admin atualizou o time ${team?.name}`,
      metadata: { fields: Object.keys(dto) }
    });

    return team!;
  }

  async remove(id: string, adminId?: string): Promise<void> {
    const team = await this.teamModel.findById(id).exec();
    if (!team) {
        throw new NotFoundException(`Team with ID ${id} not found`);
    }

    // Deletar logo do storage ao remover
    if (team.logoUrl) {
      try {
        const url = new URL(team.logoUrl);
        const key = decodeURIComponent(url.pathname.split('/o/')[1].split('?')[0]);
        await this.uploadsService.deleteFileByKey(key);
      } catch (e) { }
    }

    await this.teamModel.findByIdAndUpdate(id, { deletedAt: new Date() }).exec();

    await this.activityLogsService.record({
      action: 'delete',
      entity: 'teams',
      entityId: id,
      status: 'success',
      actorUserId: adminId,
      message: `Admin excluiu o time ${team.name}`
    });
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
