import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SquadEntity, SquadDocument } from './entities/squad.entity';
import { CreateSquadDto } from './dto/create-squad.dto';
import { UpdateSquadDto } from './dto/update-squad.dto';
import { ActivityLogsService } from '../logs/activity-logs.service';

@Injectable()
export class SquadsService {
  constructor(
    @InjectModel(SquadEntity.name)
    private readonly squadModel: Model<SquadDocument>,
    private readonly logsService: ActivityLogsService,
  ) {}

  async create(createDto: CreateSquadDto, subId: string): Promise<SquadDocument> {
    const squad = new this.squadModel({
      ...createDto,
      createdBy: new Types.ObjectId(subId),
    });
    const saved = await squad.save();

    await this.logsService.record({
      actorUserId: subId,
      action: 'CREATE',
      entity: 'squads',
      entityId: saved._id.toString(),
      message: `Elenco criado: ${saved.category} ${saved.year} (${saved.competition})`,
      status: 'success'
    });

    return saved;
  }

  async findAll(query: any = {}): Promise<SquadDocument[]> {
    const filter: any = { deletedAt: null };
    
    if (query.year) filter.year = parseInt(query.year);
    if (query.competition) filter.competition = query.competition;
    if (query.category) filter.category = query.category;

    return this.squadModel
      .find(filter)
      .populate({ path: 'members.athleteId', model: 'AthleteEntity' })
      .sort({ year: -1, order: 1 })
      .exec();
  }

  async findOne(id: string): Promise<SquadDocument> {
    const squad = await this.squadModel
      .findOne({ _id: id, deletedAt: null })
      .populate({ path: 'members.athleteId', model: 'AthleteEntity' })
      .exec();
    if (!squad) throw new NotFoundException('Elenco não encontrado');
    return squad;
  }

  async update(id: string, updateDto: UpdateSquadDto, subId: string): Promise<SquadDocument> {
    const squad = await this.squadModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { 
        $set: { 
          ...updateDto, 
          updatedBy: new Types.ObjectId(subId) 
        } 
      },
      { new: true },
    ).exec();

    if (!squad) throw new NotFoundException('Elenco não encontrado');

    await this.logsService.record({
      actorUserId: subId,
      action: 'UPDATE',
      entity: 'squads',
      entityId: id,
      message: `Elenco atualizado: ${squad.category} ${squad.year}`,
      status: 'success'
    });

    return squad;
  }

  async remove(id: string, subId: string): Promise<void> {
    const squad = await this.squadModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { 
        $set: { 
          deletedAt: new Date(),
          deletedBy: new Types.ObjectId(subId)
        } 
      },
    ).exec();

    if (!squad) throw new NotFoundException('Elenco não encontrado');

    await this.logsService.record({
      actorUserId: subId,
      action: 'DELETE',
      entity: 'squads',
      entityId: id,
      message: `Elenco removido: ${squad.category} ${squad.year}`,
      status: 'success'
    });
  }
}
