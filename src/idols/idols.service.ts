import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ActivityLogsService } from '../logs/activity-logs.service';
import { CreateIdolDto } from './dto/create-idol.dto';
import { UpdateIdolDto } from './dto/update-idol.dto';
import { IdolDocument, IdolEntity } from './entities/idol.entity';

@Injectable()
export class IdolsService {
  constructor(
    @InjectModel(IdolEntity.name)
    private readonly idolModel: Model<IdolDocument>,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async create(createIdolDto: CreateIdolDto, adminId: string): Promise<IdolEntity> {
    const idol = await this.idolModel.create({
      ...createIdolDto,
      createdBy: new Types.ObjectId(adminId),
    });

    await this.activityLogsService.record({
      action: 'create',
      entity: 'idols',
      entityId: idol._id.toString(),
      status: 'success',
      actorUserId: adminId,
      message: `Admin created idol ${idol.name}`,
    });

    return idol.toObject();
  }

  async findAll(onlyActive: boolean = false): Promise<IdolEntity[]> {
    const query: any = { deletedAt: null };
    if (onlyActive) {
      query.isActive = true;
    }
    return this.idolModel.find(query).sort({ order: 1, createdAt: -1 }).lean();
  }

  async findOne(id: string): Promise<IdolEntity> {
    const idol = await this.idolModel.findOne({ _id: new Types.ObjectId(id), deletedAt: null }).lean();
    if (!idol) {
      throw new NotFoundException('Ídolo não encontrado');
    }
    return idol;
  }

  async update(id: string, updateIdolDto: UpdateIdolDto, adminId: string): Promise<IdolEntity> {
    const idol = await this.idolModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), deletedAt: null },
        {
          $set: {
            ...updateIdolDto,
            updatedBy: new Types.ObjectId(adminId),
          },
        },
        { new: true, lean: true },
      );

    if (!idol) {
      throw new NotFoundException('Ídolo não encontrado');
    }

    await this.activityLogsService.record({
      action: 'update',
      entity: 'idols',
      entityId: idol._id.toString(),
      status: 'success',
      actorUserId: adminId,
      message: `Admin updated idol ${idol.name}`,
      metadata: { fields: Object.keys(updateIdolDto) },
    });

    return idol;
  }

  async remove(id: string, adminId: string): Promise<void> {
    const idol = await this.idolModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), deletedAt: null },
      {
        $set: {
          deletedAt: new Date(),
          deletedBy: new Types.ObjectId(adminId),
        },
      },
      { new: true },
    );

    if (!idol) {
      throw new NotFoundException('Ídolo não encontrado');
    }

    await this.activityLogsService.record({
      action: 'delete',
      entity: 'idols',
      entityId: idol._id.toString(),
      status: 'success',
      actorUserId: adminId,
      message: `Admin logically deleted idol ${idol.name}`,
    });
  }

  async reorder(ids: string[], adminId: string): Promise<void> {
    const bulkOps = ids.map((id, index) => ({
      updateOne: {
        filter: { _id: new Types.ObjectId(id) },
        update: { $set: { order: index, updatedBy: new Types.ObjectId(adminId) } },
      },
    }));

    if (bulkOps.length > 0) {
      await this.idolModel.bulkWrite(bulkOps);

      await this.activityLogsService.record({
        action: 'update',
        entity: 'idols',
        status: 'success',
        actorUserId: adminId,
        message: 'Admin reordered idols',
      });
    }
  }
}
