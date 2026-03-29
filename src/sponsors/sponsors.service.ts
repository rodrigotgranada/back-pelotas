import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ActivityLogsService } from '../logs/activity-logs.service';
import { CreateSponsorDto } from './dto/create-sponsor.dto';
import { UpdateSponsorDto } from './dto/update-sponsor.dto';
import { SponsorDocument, SponsorEntity } from './entities/sponsor.entity';

@Injectable()
export class SponsorsService {
  constructor(
    @InjectModel(SponsorEntity.name)
    private readonly sponsorModel: Model<SponsorDocument>,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async create(createSponsorDto: CreateSponsorDto, adminId: string): Promise<SponsorEntity> {
    const sponsor = await this.sponsorModel.create({
      ...createSponsorDto,
      createdBy: new Types.ObjectId(adminId),
    });

    await this.activityLogsService.record({
      action: 'create',
      entity: 'sponsors',
      entityId: sponsor._id.toString(),
      status: 'success',
      actorUserId: adminId,
      message: `Admin created sponsor ${sponsor.name}`,
    });

    return sponsor.toObject();
  }

  async findAll(onlyActive: boolean = false): Promise<SponsorEntity[]> {
    const query: any = { deletedAt: null };
    if (onlyActive) {
      query.isActive = true;
    }
    return this.sponsorModel.find(query).sort({ order: 1, createdAt: -1 }).lean();
  }

  async findOne(id: string): Promise<SponsorEntity> {
    const sponsor = await this.sponsorModel.findOne({ _id: new Types.ObjectId(id), deletedAt: null }).lean();
    if (!sponsor) {
      throw new NotFoundException('Patrocinador não encontrado');
    }
    return sponsor;
  }

  async update(id: string, updateSponsorDto: UpdateSponsorDto, adminId: string): Promise<SponsorEntity> {
    const sponsor = await this.sponsorModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), deletedAt: null },
        {
          $set: {
            ...updateSponsorDto,
            updatedBy: new Types.ObjectId(adminId),
          },
        },
        { new: true, lean: true },
      );

    if (!sponsor) {
      throw new NotFoundException('Patrocinador não encontrado');
    }

    await this.activityLogsService.record({
      action: 'update',
      entity: 'sponsors',
      entityId: sponsor._id.toString(),
      status: 'success',
      actorUserId: adminId,
      message: `Admin updated sponsor ${sponsor.name}`,
      metadata: { fields: Object.keys(updateSponsorDto) },
    });

    return sponsor;
  }

  async remove(id: string, adminId: string): Promise<void> {
    const sponsor = await this.sponsorModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), deletedAt: null },
      {
        $set: {
          deletedAt: new Date(),
          deletedBy: new Types.ObjectId(adminId),
        },
      },
      { new: true },
    );

    if (!sponsor) {
      throw new NotFoundException('Patrocinador não encontrado');
    }

    await this.activityLogsService.record({
      action: 'delete',
      entity: 'sponsors',
      entityId: sponsor._id.toString(),
      status: 'success',
      actorUserId: adminId,
      message: `Admin logically deleted sponsor ${sponsor.name}`,
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
      await this.sponsorModel.bulkWrite(bulkOps);

      await this.activityLogsService.record({
        action: 'update',
        entity: 'sponsors',
        status: 'success',
        actorUserId: adminId,
        message: 'Admin reordered sponsors',
      });
    }
  }
}
