import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { HistoryDocument, HistoryEntity } from './entities/history.entity';
import { CreateHistoryDto } from './dto/create-history.dto';
import { UpdateHistoryDto } from './dto/update-history.dto';

import { UploadsService } from '../uploads/uploads.service';
import { ActivityLogsService } from '../logs/activity-logs.service';

@Injectable()
export class HistoryService {
  constructor(
    @InjectModel(HistoryEntity.name)
    private readonly historyModel: Model<HistoryDocument>,
    private readonly uploadsService: UploadsService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  private async generateSlug(title: string): Promise<string> {
    const baseSlug = title
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    
    let slug = baseSlug;
    let count = 1;

    while (await this.historyModel.exists({ slug })) {
      slug = `${baseSlug}-${count}`;
      count++;
    }

    return slug;
  }

  async create(createDto: CreateHistoryDto, userId: string): Promise<HistoryEntity> {
    const slug = createDto.slug || (await this.generateSlug(createDto.title));
    
    const count = await this.historyModel.countDocuments();
    const order = createDto.order ?? count;

    let coverImageUrl = createDto.coverImageUrl;
    if (coverImageUrl && coverImageUrl.startsWith('data:image/')) {
      coverImageUrl = await this.uploadBase64Image(coverImageUrl, 'history-cover', slug);
    }

    const history = new this.historyModel({
      ...createDto,
      coverImageUrl,
      slug,
      order,
      createdBy: new Types.ObjectId(userId),
    });

    const savedHistory = await history.save();
    
    await this.activityLogsService.record({
      action: 'history.create',
      entity: 'history',
      entityId: savedHistory._id.toHexString(),
      status: 'success',
      actorUserId: userId,
      message: 'Secao historica criada',
      flags: ['history', 'create', 'success'],
      metadata: { slug, title: createDto.title },
    });

    return savedHistory;
  }

  async findAll(admin = false): Promise<HistoryEntity[]> {
    const query = admin ? {} : { isActive: true };
    return this.historyModel.find(query).sort({ order: 1 }).exec();
  }

  async findOne(idOrSlug: string): Promise<HistoryEntity> {
    let history;
    if (Types.ObjectId.isValid(idOrSlug)) {
      history = await this.historyModel.findById(idOrSlug).exec();
    } else {
      history = await this.historyModel.findOne({ slug: idOrSlug }).exec();
    }

    if (!history) {
      throw new NotFoundException('Seção da história não encontrada');
    }
    return history;
  }

  async update(id: string, updateDto: UpdateHistoryDto, userId: string): Promise<HistoryEntity> {
    const history = await this.historyModel.findById(id).exec();
    if (!history) {
      throw new NotFoundException('Seção da história não encontrada');
    }

    if (updateDto.title && !updateDto.slug) {
      updateDto.slug = await this.generateSlug(updateDto.title);
    }

    let coverImageUrl = updateDto.coverImageUrl;
    if (coverImageUrl && coverImageUrl.startsWith('data:image/')) {
      if (history.coverImageUrl) {
        // Optional: delete old file
      }
      coverImageUrl = await this.uploadBase64Image(coverImageUrl, 'history-cover', id);
    }

    Object.assign(history, {
      ...updateDto,
      coverImageUrl,
      updatedBy: new Types.ObjectId(userId),
    });

    const savedHistory = await history.save();

    await this.activityLogsService.record({
      action: 'history.update',
      entity: 'history',
      entityId: id,
      status: 'success',
      actorUserId: userId,
      message: 'Secao historica atualizada',
      flags: ['history', 'update', 'success'],
    });

    return savedHistory;
  }

  private async uploadBase64Image(base64: string, entity: string, entityId: string): Promise<string> {
    const matches = base64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new BadRequestException('Formato de imagem inválido');
    }

    const buffer = Buffer.from(matches[2], 'base64');
    const result = await this.uploadsService.uploadImageForEntity({
      entity,
      entityId,
      file: {
        buffer,
        mimetype: matches[1],
        originalname: `${entity}-${entityId}.${matches[1].split('/')[1]}`,
        size: buffer.length,
      },
    });

    return result.url;
  }

  async remove(id: string, deletedBy: string): Promise<void> {
    const result = await this.historyModel.deleteOne({ _id: new Types.ObjectId(id) }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Seção da história não encontrada');
    }

    await this.activityLogsService.record({
      action: 'history.delete',
      entity: 'history',
      entityId: id,
      status: 'success',
      actorUserId: deletedBy,
      message: 'Secao historica excluida',
      flags: ['history', 'delete', 'success'],
    });
  }

  async reorder(ids: string[]): Promise<void> {
    const operations = ids.map((id, index) => ({
      updateOne: {
        filter: { _id: new Types.ObjectId(id) },
        update: { $set: { order: index } },
      },
    }));

    await this.historyModel.bulkWrite(operations);

    // Logs the reorder without passing an actor since multiple could be involved, or pass "system"
    await this.activityLogsService.record({
      action: 'history.reorder',
      entity: 'history',
      status: 'success',
      message: 'Cronologia de secoes historicas reordenada',
      flags: ['history', 'reorder', 'success'],
    });
  }
}
