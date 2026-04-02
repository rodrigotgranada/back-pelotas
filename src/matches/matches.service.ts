import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MatchDocument, MatchEntity } from './entities/match.entity';
import { CreateMatchDto, UpdateMatchDto } from './dto/match.dto';
import { MatchesGateway } from './matches.gateway';
import { ActivityLogsService } from '../logs/activity-logs.service';

@Injectable()
export class MatchesService {
  constructor(
    @InjectModel(MatchEntity.name)
    private readonly matchModel: Model<MatchDocument>,
    private readonly gateway: MatchesGateway,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async create(dto: CreateMatchDto, adminId?: string): Promise<MatchEntity> {
    const match = new this.matchModel(dto);
    const saved = await match.save();
    
    await this.activityLogsService.record({
      action: 'create',
      entity: 'matches',
      entityId: saved._id.toString(),
      status: 'success',
      actorUserId: adminId,
      message: `Admin agendou nova partida: vs ${dto.opponentId}`,
    });

    this.gateway.emitMatchUpdate(saved);
    return saved;
  }

  async findAll(): Promise<MatchEntity[]> {
    return this.matchModel
      .find({ deletedAt: null })
      .populate('competitionId')
      .populate('opponentId')
      .sort({ date: -1 })
      .exec();
  }

  async findNext(): Promise<MatchEntity | null> {
    return this.matchModel
      .findOne({
        date: { $gte: new Date() },
        status: { $in: ['SCHEDULED', 'LIVE'] },
        deletedAt: null,
      })
      .populate('competitionId')
      .populate('opponentId')
      .sort({ date: 1 })
      .exec();
  }

  async findLastResult(): Promise<MatchEntity | null> {
    return this.matchModel
      .findOne({
        status: 'FINISHED',
        deletedAt: null,
      })
      .populate('competitionId')
      .populate('opponentId')
      .sort({ date: -1 })
      .exec();
  }

  async findOne(id: string): Promise<MatchEntity> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid ID: ${id}`);
    }
    const match = await this.matchModel
      .findById(id)
      .populate('competitionId')
      .populate('opponentId')
      .exec();
    if (!match || match.deletedAt) {
      throw new NotFoundException(`Match with ID ${id} not found`);
    }
    return match;
  }

  async update(id: string, dto: UpdateMatchDto, adminId?: string): Promise<MatchEntity> {
    const match = await this.matchModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .populate('competitionId')
      .populate('opponentId')
      .exec();
    
    if (!match) {
      throw new NotFoundException(`Match with ID ${id} not found`);
    }

    await this.activityLogsService.record({
      action: 'update',
      entity: 'matches',
      entityId: id,
      status: 'success',
      actorUserId: adminId,
      message: `Admin atualizou partida ID ${id} (Placar: ${match.homeScore}x${match.awayScore})`,
    });

    this.gateway.emitMatchUpdate(match);
    return match;
  }

  async finish(id: string, newsId?: string, adminId?: string): Promise<MatchEntity> {
    const match = await this.matchModel
      .findByIdAndUpdate(id, { $set: { status: 'FINISHED', newsId } }, { new: true })
      .populate('competitionId')
      .populate('opponentId')
      .exec();
    
    if (!match) {
      throw new NotFoundException(`Match with ID ${id} not found`);
    }

    await this.activityLogsService.record({
      action: 'update',
      entity: 'matches',
      entityId: id,
      status: 'success',
      actorUserId: adminId,
      message: `Admin finalizou partida ID ${id}. Resultado: ${match.homeScore}x${match.awayScore}`,
    });

    this.gateway.emitMatchUpdate(match);
    return match;
  }

  async remove(id: string, adminId?: string): Promise<void> {
    const result = await this.matchModel
      .findByIdAndUpdate(id, { deletedAt: new Date() })
      .exec();
    
    if (!result) {
      throw new NotFoundException(`Match with ID ${id} not found`);
    }

    await this.activityLogsService.record({
      action: 'delete',
      entity: 'matches',
      entityId: id,
      status: 'success',
      actorUserId: adminId,
      message: `Admin removeu partida ID ${id}`,
    });

    this.gateway.emitMatchUpdate({ id, deleted: true });
  }
}
