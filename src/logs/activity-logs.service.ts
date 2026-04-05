import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { QueryActivityLogsDto } from './dto/query-activity-logs.dto';
import { ActivityLogDocument, ActivityLogEntity } from './entities/activity-log.entity';

export interface RecordActivityLogInput {
  action: string;
  entity: string;
  entityId?: string;
  status: 'success' | 'failure';
  actorUserId?: string;
  actorEmail?: string;
  message?: string;
  flags?: string[];
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
}

@Injectable()
export class ActivityLogsService {
  constructor(
    @InjectModel(ActivityLogEntity.name)
    private readonly activityLogModel: Model<ActivityLogDocument>,
  ) {}

  async record(input: RecordActivityLogInput): Promise<void> {
    const friendlyMessage = input.message || this.getFriendlyAction(input.action);

    await this.activityLogModel.create({
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      status: input.status,
      actorUserId: this.toObjectIdOrNull(input.actorUserId),
      actorEmail: input.actorEmail?.toLowerCase() ?? null,
      message: friendlyMessage ?? null,
      flags: input.flags ?? [],
      metadata: input.metadata ?? {},
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      correlationId: input.correlationId ?? null,
    });
  }

  private getFriendlyAction(action: string): string {
    const dictionary: Record<string, string> = {
      'USER.UPDATE': 'Usuário modificado',
      'USER.PHOTO.UPDATE': 'Foto de perfil atualizada',
      'USER.CREATE': 'Novo usuário criado',
      'USER.DELETE': 'Usuário removido da alcateia',
      'NEWS.CREATE': 'Nova matéria publicada',
      'NEWS.UPDATE': 'Matéria editada',
      'NEWS.DELETE': 'Matéria removida',
      'MATCH.CREATE': 'Próxima batalha agendada',
      'MATCH.UPDATE': 'Dados da batalha alterados',
      'MATCH.FINISH': 'Batalha encerrada',
      'AUTH.LOGIN': 'Entrada no comando (Login)',
      'AUTH.LOGOUT': 'Saída do comando (Logout)',
      'UPDATE': 'Sistema atualizado',
      'INTEREST.CREATED': 'Nova intenção de sócio recebida',
      'INTEREST.READ': 'Interesse de sócio visualizado',
      'SPONSOR.CREATE': 'Novo patrocinador adicionado',
      'IDOL.CREATE': 'Novo ídolo imortalizado',
    };

    return dictionary[action] || action;
  }

  async findAll(query: QueryActivityLogsDto): Promise<ActivityLogEntity[]> {
    const filter: Record<string, unknown> = {};

    if (query.action) filter.action = query.action;
    if (query.entity) filter.entity = query.entity;
    if (query.entityId) filter.entityId = query.entityId;
    if (query.status) filter.status = query.status;
    if (query.flag) filter.flags = query.flag;
    if (query.actorUserId && Types.ObjectId.isValid(query.actorUserId)) {
      filter.actorUserId = new Types.ObjectId(query.actorUserId);
    }

    if (query.from || query.to) {
      const createdAtFilter: { $gte?: Date; $lte?: Date } = {};
      if (query.from) createdAtFilter.$gte = new Date(query.from);
      if (query.to) createdAtFilter.$lte = new Date(query.to);
      filter.createdAt = createdAtFilter;
    }

    return this.activityLogModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(query.limit ?? 50)
      .lean();
  }

  async clearAll(): Promise<void> {
    await this.activityLogModel.deleteMany({}).exec();
  }

  private toObjectIdOrNull(id?: string): Types.ObjectId | null {
    if (!id || !Types.ObjectId.isValid(id)) {
      return null;
    }

    return new Types.ObjectId(id);
  }
}
