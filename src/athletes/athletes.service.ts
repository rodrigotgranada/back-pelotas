import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Express } from 'express';
import { AthleteEntity, AthleteDocument } from './entities/athlete.entity';
import { CreateAthleteDto } from './dto/create-athlete.dto';
import { UpdateAthleteDto } from './dto/update-athlete.dto';
import { ActivityLogsService } from '../logs/activity-logs.service';
import { UploadsService } from '../uploads/uploads.service';

@Injectable()
export class AthletesService {
  constructor(
    @InjectModel(AthleteEntity.name)
    private readonly athleteModel: Model<AthleteDocument>,
    private readonly logsService: ActivityLogsService,
    private readonly uploadsService: UploadsService,
  ) {}

  async uploadImage(file: Express.Multer.File): Promise<{ success: number; file: { url: string } }> {
    const result = await this.uploadsService.uploadImageForEntity({
      entity: 'athletes',
      entityId: new Types.ObjectId().toHexString(),
      file,
    });
    return {
      success: 1,
      file: {
        url: result.url,
      },
    };
  }

  async create(createDto: CreateAthleteDto, subId: string): Promise<AthleteDocument> {
    const athlete = new this.athleteModel({
      ...createDto,
      createdBy: new Types.ObjectId(subId),
    });
    const saved = await athlete.save();

    await this.logsService.record({
      actorUserId: subId,
      action: 'CREATE',
      entity: 'athletes',
      entityId: saved._id.toString(),
      message: `Atleta criado: ${saved.name}`,
      status: 'success'
    });

    return saved;
  }

  async findAll(query: any = {}): Promise<AthleteDocument[]> {
    return this.attributeSearch(query).exec();
  }

  private attributeSearch(query: any) {
    const filter: any = { deletedAt: null };
    
    if (query.isActive !== undefined) {
      filter.isActive = query.isActive === 'true';
    }
    
    if (query.isStaff !== undefined) {
      filter.isStaff = query.isStaff === 'true';
    }

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { nickname: { $regex: query.search, $options: 'i' } },
      ];
    }

    return this.athleteModel.find(filter).sort({ name: 1 });
  }

  async findOne(id: string): Promise<AthleteDocument> {
    const athlete = await this.athleteModel.findOne({ _id: id, deletedAt: null }).exec();
    if (!athlete) throw new NotFoundException('Atleta não encontrado');
    return athlete;
  }

  async update(id: string, updateDto: UpdateAthleteDto, subId: string): Promise<AthleteDocument> {
    const athlete = await this.athleteModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { 
        $set: { 
          ...updateDto, 
          updatedBy: new Types.ObjectId(subId) 
        } 
      },
      { new: true },
    ).exec();

    if (!athlete) throw new NotFoundException('Atleta não encontrado');

    await this.logsService.record({
      actorUserId: subId,
      action: 'UPDATE',
      entity: 'athletes',
      entityId: id,
      message: `Atleta atualizado: ${athlete.name}`,
      status: 'success'
    });

    return athlete;
  }

  async remove(id: string, subId: string): Promise<void> {
    const athlete = await this.athleteModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { 
        $set: { 
          deletedAt: new Date(),
          deletedBy: new Types.ObjectId(subId)
        } 
      },
    ).exec();

    if (!athlete) throw new NotFoundException('Atleta não encontrado');

    await this.logsService.record({
      actorUserId: subId,
      action: 'DELETE',
      entity: 'athletes',
      entityId: id,
      message: `Atleta removido (soft delete): ${athlete.name}`,
      status: 'success'
    });
  }
}
