import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CompetitionDocument, CompetitionEntity } from './entities/competition.entity';
import { CreateCompetitionDto, UpdateCompetitionDto } from './dto/competition.dto';
import { UploadsService } from '../uploads/uploads.service';
import { ActivityLogsService } from '../logs/activity-logs.service';

@Injectable()
export class CompetitionsService {
  constructor(
    @InjectModel(CompetitionEntity.name)
    private readonly competitionModel: Model<CompetitionDocument>,
    private readonly uploadsService: UploadsService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async create(dto: CreateCompetitionDto, adminId?: string): Promise<CompetitionEntity> {
    const competition = new this.competitionModel(dto);
    await competition.save();

    await this.activityLogsService.record({
      action: 'create',
      entity: 'competitions',
      entityId: competition._id.toString(),
      status: 'success',
      actorUserId: adminId,
      message: `Admin criou o campeonato ${competition.name}`,
    });

    return competition;
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

  async update(id: string, dto: UpdateCompetitionDto, adminId?: string): Promise<CompetitionEntity> {
    const oldComp = await this.competitionModel.findById(id).exec();
    if (!oldComp) {
      throw new NotFoundException(`Competition with ID ${id} not found`);
    }

    // Se a logo mudou, deletar a antiga do storage
    if (dto.logoUrl && oldComp.logoUrl && dto.logoUrl !== oldComp.logoUrl) {
      try {
        const url = new URL(oldComp.logoUrl);
        const key = decodeURIComponent(url.pathname.split('/o/')[1].split('?')[0]);
        await this.uploadsService.deleteFileByKey(key);
      } catch (e) {
        // Ignorar erro na deleção
      }
    }

    const competition = await this.competitionModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .exec();

    await this.activityLogsService.record({
      action: 'update',
      entity: 'competitions',
      entityId: id,
      status: 'success',
      actorUserId: adminId,
      message: `Admin atualizou o campeonato ${competition?.name}`,
      metadata: { fields: Object.keys(dto) }
    });

    return competition!;
  }

  async remove(id: string, adminId?: string): Promise<void> {
    const competition = await this.competitionModel.findById(id).exec();
    if (!competition) {
      throw new NotFoundException(`Competition with ID ${id} not found`);
    }

    // Deletar logo do storage ao remover
    if (competition.logoUrl) {
      try {
        const url = new URL(competition.logoUrl);
        const key = decodeURIComponent(url.pathname.split('/o/')[1].split('?')[0]);
        await this.uploadsService.deleteFileByKey(key);
      } catch (e) { }
    }

    await this.competitionModel.findByIdAndDelete(id).exec();

    await this.activityLogsService.record({
      action: 'delete',
      entity: 'competitions',
      entityId: id,
      status: 'success',
      actorUserId: adminId,
      message: `Admin excluiu o campeonato ${competition.name}`
    });
  }

  async uploadImage(file: Express.Multer.File): Promise<{ url: string }> {
    const result = await this.uploadsService.uploadImageForEntity({
      entity: 'competitions',
      entityId: new Types.ObjectId().toHexString(),
      file,
    });
    return { url: result.url };
  }
}
