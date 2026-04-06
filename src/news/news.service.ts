import { Injectable, ForbiddenException, BadRequestException, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Express } from 'express';
import { NewsDocument, NewsEntity } from './entities/news.entity';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { QueryNewsDto } from './dto/query-news.dto';
import { PaginatedNewsResponseDto } from './dto/paginated-news-response.dto';
import { NewsResponseDto } from './dto/news-response.dto';
import { UploadsService } from '../uploads/uploads.service';
import { CommentDocument, CommentEntity, CommentStatus } from './entities/comment.entity';
import { NewsLikeDocument, NewsLikeEntity } from './entities/news-like.entity';
import { ActivityLogsService } from '../logs/activity-logs.service';
import { NewsCategoryDocument, NewsCategoryEntity } from './entities/news-category.entity';
import { NewsViewTraceDocument, NewsViewTraceEntity } from './entities/news-view-trace.entity';
import { UserDocument, UserEntity } from '../users/entities/user.entity';
import { ROLE_CODES } from '../auth/authorization/role-codes';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class NewsService implements OnModuleInit {
  private readonly logger = new Logger(NewsService.name);
  constructor(
    @InjectModel(NewsEntity.name)
    private readonly newsModel: Model<NewsDocument>,
    @InjectModel(CommentEntity.name)
    private readonly commentModel: Model<CommentDocument>,
    @InjectModel(NewsLikeEntity.name)
    private readonly newsLikeModel: Model<NewsLikeDocument>,
    @InjectModel(NewsCategoryEntity.name)
    private readonly categoryModel: Model<NewsCategoryDocument>,
    @InjectModel(NewsViewTraceEntity.name)
    private readonly newsViewTraceModel: Model<NewsViewTraceDocument>,
    @InjectModel(UserEntity.name)
    private readonly userModel: Model<UserDocument>,
    private readonly uploadsService: UploadsService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async onModuleInit() {
    this.logger.log('🐺 Iniciando sincronização do faro inteligente da Alcateia...');
    try {
      const newsWithoutSearchFields = await this.newsModel.find({
        $or: [
          { searchTitle: { $exists: false } },
          { searchTitle: '' },
          { searchSubtitle: { $exists: false } },
        ],
        deletedAt: null
      }).exec();

      if (newsWithoutSearchFields.length > 0) {
        this.logger.log(`🐺 Sincronizando ${newsWithoutSearchFields.length} matérias do histórico...`);
        
        for (const news of newsWithoutSearchFields) {
          news.searchTitle = this.normalizeForSearch(news.title);
          news.searchSubtitle = this.normalizeForSearch(news.subtitle || '');
          await news.save();
        }
        
        this.logger.log('🐺 Sincronização concluída! A Alcateia está com o rastro afiado.');
      } else {
        this.logger.log('🐺 Faro já está em dia! Nenhuma sincronização necessária.');
      }
    } catch (error) {
      this.logger.error('❌ Erro ao sincronizar histórico de notícias:', error);
    }
  }

  private async generateSlug(title: string): Promise<string> {
    const baseSlug = title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    let slug = baseSlug;
    let count = 1;

    while (await this.newsModel.exists({ slug })) {
      slug = `${baseSlug}-${count}`;
      count++;
    }

    return slug;
  }
  
  private normalizeForSearch(text: string): string {
    if (!text) return '';
    return text.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  async create(createNewsDto: CreateNewsDto, authorId: string): Promise<NewsResponseDto> {
    const slug = await this.generateSlug(createNewsDto.title);

    const news = new this.newsModel({
      ...createNewsDto,
      slug,
      searchTitle: this.normalizeForSearch(createNewsDto.title),
      searchSubtitle: this.normalizeForSearch(createNewsDto.subtitle || ''),
      authorId: new Types.ObjectId(authorId),
      createdBy: new Types.ObjectId(authorId),
    });

    if (news.status === 'PUBLISHED') {
        news.publishedAt = new Date();
    }

    const savedNews = await news.save();

    await this.activityLogsService.record({
      action: 'news.create',
      entity: 'news',
      entityId: savedNews._id.toHexString(),
      status: 'success',
      actorUserId: authorId,
      message: 'Notícia criada pelo painel admin',
      flags: ['news', 'create', 'success'],
    });

    return new NewsResponseDto(savedNews);
  }

  async findAll(query: QueryNewsDto): Promise<PaginatedNewsResponseDto> {
    const filter: Record<string, any> = { deletedAt: null };

    if (query.status) {
      filter.status = query.status;
    }

    if (query.search) {
      const normalizedQuery = this.normalizeForSearch(query.search);
      filter.$or = [
        { searchTitle: { $regex: normalizedQuery, $options: 'i' } },
        { searchSubtitle: { $regex: normalizedQuery, $options: 'i' } },
      ];
    }

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.newsModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'firstName lastName')
        .populate('updatedBy', 'firstName lastName')
        .exec(),
      this.newsModel.countDocuments(filter).exec(),
    ]);

    return {
      items: items.map((item) => new NewsResponseDto(item)),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async findAllPublic(query: QueryNewsDto): Promise<PaginatedNewsResponseDto> {
    const filter: Record<string, any> = { deletedAt: null, status: 'PUBLISHED' };

    if (query.isFeatured !== undefined) {
      filter.isFeatured = query.isFeatured;
    }

    if (query.search) {
      const normalizedQuery = this.normalizeForSearch(query.search);
      filter.$or = [
        { searchTitle: { $regex: normalizedQuery, $options: 'i' } },
        { searchSubtitle: { $regex: normalizedQuery, $options: 'i' } },
      ];
    }

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.newsModel.find(filter).sort({ publishedAt: -1, createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.newsModel.countDocuments(filter).exec(),
    ]);

    return {
      items: items.map((item) => new NewsResponseDto(item)),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<NewsResponseDto> {
    const news = await this.newsModel.findOne({ _id: new Types.ObjectId(id), deletedAt: null }).exec();
    if (!news) {
      throw new NotFoundException('Notícia não encontrada');
    }
    return new NewsResponseDto(news);
  }

  async findOnePublic(slugOrId: string, user?: any): Promise<NewsResponseDto> {
    let filter: any = { slug: slugOrId, deletedAt: null };
    if (Types.ObjectId.isValid(slugOrId)) {
      filter = { $or: [{ slug: slugOrId }, { _id: new Types.ObjectId(slugOrId) }], deletedAt: null };
    }

    const news = await this.newsModel.findOne(filter)
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName')
      .exec();

    if (!news) {
      throw new NotFoundException('Notícia não encontrada ou indisponível');
    }

    if (news.status !== 'PUBLISHED') {
      let canAccessDraft = false;
      if (user) {
        if (news.authorId?.toHexString() === user.sub) canAccessDraft = true;
        if (user.roleCodes && ['owner', 'admin', 'socio'].some((r: string) => user.roleCodes.includes(r))) {
          canAccessDraft = true;
        }
      }
      
      if (!canAccessDraft) {
        throw new NotFoundException('Notícia não encontrada ou indisponível');
      }
      return new NewsResponseDto(news);
    }

    return new NewsResponseDto(news);
  }

  async findRelated(slugOrId: string, limit: number = 3): Promise<NewsResponseDto[]> {
    let filter: any = { slug: slugOrId, deletedAt: null };
    if (Types.ObjectId.isValid(slugOrId)) {
      filter = { $or: [{ slug: slugOrId }, { _id: new Types.ObjectId(slugOrId) }], deletedAt: null };
    }

    const currentNews = await this.newsModel.findOne(filter).select('categories _id').exec();
    if (!currentNews) return [];

    const relatedFilter: any = {
      _id: { $ne: currentNews._id },
      status: 'PUBLISHED',
      deletedAt: null,
      categories: { $in: currentNews.categories || [] },
    };

    const related = await this.newsModel.find(relatedFilter)
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(limit)
      .exec();

    return related.map(item => new NewsResponseDto(item));
  }

  async incrementViewCount(slugOrId: string, identifier: string): Promise<void> {
    let filter: any = { slug: slugOrId, deletedAt: null };
    if (Types.ObjectId.isValid(slugOrId)) {
      filter = { $or: [{ slug: slugOrId }, { _id: new Types.ObjectId(slugOrId) }], deletedAt: null };
    }

    const news = await this.newsModel.findOne(filter).select('_id').exec();
    if (!news) return;

    try {
      // Tenta criar o rastro. O índice composto (newsId + identifier) único impedirá duplicidade em 24h
      await this.newsViewTraceModel.create({
        newsId: news._id,
        identifier,
      });

      // Se o rastro foi criado com sucesso, incrementa atômico no contador
      await this.newsModel.updateOne({ _id: news._id }, { $inc: { views: 1 } }).exec();
    } catch (e) {
      // Silencia erro de duplicidade: significa que o rastro já existe (visualização recente)
    }
  }

  async findAllCategories(): Promise<any[]> {
    const categories = await this.categoryModel.find({ isActive: true }).sort({ name: 1 }).exec();
    if (categories.length === 0) {
      // Fallback to legacy behavior if no categories are managed yet
      const distinct = await this.newsModel.distinct('categories', { deletedAt: null }).exec();
      return distinct.filter(c => c && c.trim().length > 0).sort().map(name => ({
        name,
        slug: name.toLowerCase().replace(/ /g, '-').replace(/(^-|-$)+/g, ""),
        isActive: true
      }));
    }
    return categories.map(c => ({
      id: c._id.toHexString(),
      name: c.name,
      slug: c.slug,
      isActive: c.isActive,
      description: c.description
    }));
  }

  async createCategory(dto: CreateCategoryDto, actorId: string): Promise<any> {
    const slug = dto.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    
    const existing = await this.categoryModel.findOne({ $or: [{ name: dto.name }, { slug }] }).exec();
    if (existing) throw new BadRequestException('Categoria já existe com este nome ou slug');

    const cat = await this.categoryModel.create({
      ...dto,
      slug
    });

    await this.activityLogsService.record({
      action: 'news.category.create',
      entity: 'news-category',
      entityId: cat._id.toHexString(),
      status: 'success',
      actorUserId: actorId,
      message: `Categoria de notícia criada: ${dto.name}`,
      flags: ['news', 'category', 'create'],
    });

    return cat;
  }

  async deleteCategory(id: string, actorId: string): Promise<void> {
    const cat = await this.categoryModel.findByIdAndDelete(id).exec();
    if (!cat) throw new NotFoundException('Categoria não encontrada');

    await this.activityLogsService.record({
      action: 'news.category.delete',
      entity: 'news-category',
      entityId: id,
      status: 'success',
      actorUserId: actorId,
      message: `Categoria de notícia removida: ${cat.name}`,
      flags: ['news', 'category', 'delete'],
    });
  }

  async toggleLike(slugOrId: string, userId: string): Promise<{ liked: boolean; totalLikes: number }> {
    let filter: any = { slug: slugOrId, deletedAt: null };
    if (Types.ObjectId.isValid(slugOrId)) {
      filter = { $or: [{ slug: slugOrId }, { _id: new Types.ObjectId(slugOrId) }], deletedAt: null };
    }
    const news = await this.newsModel.findOne(filter).exec();
    if (!news) throw new NotFoundException('Notícia não encontrada');
    if (!news.allowLikes) throw new BadRequestException('Curtidas estão desativadas para esta matéria');

    const uid = new Types.ObjectId(userId);
    const existingLike = await this.newsLikeModel.findOne({ newsId: news._id, userId: uid }).exec();

    if (existingLike) {
      await this.newsLikeModel.deleteOne({ _id: existingLike._id }).exec();
      const updated = await this.newsModel.findOneAndUpdate(
        { _id: news._id },
        { $inc: { likesCount: -1 } },
        { returnDocument: 'after' }
      ).exec();
      return { liked: false, totalLikes: updated?.likesCount || 0 };
    } else {
      await this.newsLikeModel.create({ newsId: news._id, userId: uid });
      const updated = await this.newsModel.findOneAndUpdate(
        { _id: news._id },
        { $inc: { likesCount: 1 } },
        { returnDocument: 'after' }
      ).exec();
      return { liked: true, totalLikes: updated?.likesCount || 0 };
    }
  }

  async getLikeStatus(slugOrId: string, userId: string): Promise<{ liked: boolean }> {
    let filter: any = { slug: slugOrId, deletedAt: null };
    if (Types.ObjectId.isValid(slugOrId)) {
      filter = { $or: [{ slug: slugOrId }, { _id: new Types.ObjectId(slugOrId) }], deletedAt: null };
    }
    const news = await this.newsModel.findOne(filter, { _id: 1 }).exec();
    if (!news) return { liked: false };

    const existingLike = await this.newsLikeModel.exists({ newsId: news._id, userId: new Types.ObjectId(userId) });
    return { liked: existingLike !== null };
  }

  async addComment(slugOrId: string, userId: string, content: string) {
    // 1. Verificar se o usuário existe e tem permissão
    const user = await this.userModel.findById(userId).populate('roleId').exec();
    if (!user) throw new NotFoundException('Usuário não encontrado');
    
    // Trava de moderação individual
    if (user.canComment === false) {
      throw new ForbiddenException(`Você está impedido de comentar. Motivo: ${user.commentBlockReason || 'Não especificado'}`);
    }

    // Trava de Exclusividade: Apenas Sócios (ou Admins/Owners)
    const roleCode = (user.roleId as any)?.code;
    const allowedRoles = [ROLE_CODES.SOCIO, ROLE_CODES.ADMIN, ROLE_CODES.OWNER, ROLE_CODES.EDITOR];
    if (!allowedRoles.includes(roleCode)) {
      throw new ForbiddenException('A resenha nos comentários é exclusiva para Sócios da Alcateia!');
    }

    let filter: any = { slug: slugOrId, deletedAt: null };
    if (Types.ObjectId.isValid(slugOrId)) {
      filter = { $or: [{ slug: slugOrId }, { _id: new Types.ObjectId(slugOrId) }], deletedAt: null };
    }
    const news = await this.newsModel.findOne(filter, { _id: 1, allowComments: 1 }).exec();
    if (!news) throw new NotFoundException('Notícia não encontrada');
    if (!news.allowComments) throw new BadRequestException('Comentários desativados para esta matéria');

    const comment = await this.commentModel.create({
      newsId: news._id,
      authorId: new Types.ObjectId(userId),
      content,
      status: 'APPROVED'
    });
    
    const populated = await comment.populate('authorId', 'firstName lastName photoUrl');
    return {
      id: populated._id.toHexString(),
      content: populated.content,
      createdAt: populated.createdAt,
      author: populated.authorId ? {
        id: (populated.authorId as any)._id.toHexString(),
        name: `${(populated.authorId as any).firstName} ${(populated.authorId as any).lastName || ''}`.trim(),
        photoUrl: (populated.authorId as any).photoUrl
      } : null
    };
  }

  async getComments(slugOrId: string, currentUserId?: string) {
    let filter: any = { slug: slugOrId, deletedAt: null };
    if (Types.ObjectId.isValid(slugOrId)) {
      filter = { $or: [{ slug: slugOrId }, { _id: new Types.ObjectId(slugOrId) }], deletedAt: null };
    }
    const news = await this.newsModel.findOne(filter, { _id: 1 }).exec();
    if (!news) throw new NotFoundException('Notícia não encontrada');

    const comments = await this.commentModel.find({ newsId: news._id, status: 'APPROVED' })
      .sort({ createdAt: -1 })
      .populate('authorId', 'firstName lastName photoUrl')
      .exec();
      
    return comments.map(c => {
      const authorIdObj = c.authorId as any;
      const authorIdStr = authorIdObj ? (authorIdObj._id ? authorIdObj._id.toHexString() : authorIdObj.toString()) : null;
      const isAuthor = currentUserId && authorIdStr === currentUserId;
      
      // Se moderado, esconde conteúdo original
      let displayContent = c.content;
      let moderationInfo: string | null = null;

      if (c.isModerated) {
        displayContent = 'Este comentário foi moderado pela administração.';
        if (isAuthor && c.moderationReason) {
          moderationInfo = `Motivo: ${c.moderationReason}`;
        }
      }

      return {
        id: c._id.toHexString(),
        content: displayContent,
        moderationInfo,
        isModerated: c.isModerated,
        createdAt: c.createdAt,
        author: c.authorId ? {
          id: (c.authorId as any)._id.toHexString(),
          name: `${(c.authorId as any).firstName} ${(c.authorId as any).lastName || ''}`.trim(),
          photoUrl: (c.authorId as any).photoUrl
        } : null
      };
    });
  }

  async getLatestGlobalComments(limit: number = 6) {
    const comments = await this.commentModel.find({ status: 'APPROVED' })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('authorId', 'firstName lastName photoUrl')
      .populate('newsId', 'slug')
      .exec();
      
    return comments.map(c => {
      let displayContent = c.content;
      if (c.isModerated) displayContent = 'Este comentário foi moderado pela administração.';
      
      const newsSlug = c.newsId ? (c.newsId as any).slug : 'undefined';

      return {
        id: c._id.toHexString(),
        content: displayContent,
        isModerated: c.isModerated,
        createdAt: c.createdAt,
        newsSlug: newsSlug,
        authorName: c.authorId ? `${(c.authorId as any).firstName} ${(c.authorId as any).lastName || ''}`.trim() : 'Torcedor Anônimo',
        authorPhoto: c.authorId ? (c.authorId as any).photoUrl : null
      };
    });
  }

  async moderateComment(commentId: string, reason: string, adminId: string) {
    const comment = await this.commentModel.findById(commentId);
    if (!comment) throw new NotFoundException('Comentário não encontrado');

    comment.isModerated = true;
    comment.moderationReason = reason;
    comment.moderatedAt = new Date();
    comment.moderatedBy = new Types.ObjectId(adminId);
    
    await comment.save();

    await this.activityLogsService.record({
      action: 'news.comment.moderate',
      entity: 'comment',
      entityId: commentId,
      status: 'success',
      actorUserId: adminId,
      message: `Comentário moderado. Motivo: ${reason}`,
      flags: ['news', 'comment', 'moderation', 'success'],
    });

    return { success: true };
  }

  async update(id: string, updateNewsDto: UpdateNewsDto, updatedBy: string): Promise<NewsResponseDto> {
    const news = await this.newsModel.findOne({ _id: new Types.ObjectId(id), deletedAt: null }).exec();
    if (!news) {
      throw new NotFoundException('Notícia não encontrada');
    }

    if (updateNewsDto.status === 'PUBLISHED' && news.status !== 'PUBLISHED') {
        news.publishedAt = new Date();
    }

    Object.assign(news, updateNewsDto);
    
    if (updateNewsDto.title) {
        news.searchTitle = this.normalizeForSearch(updateNewsDto.title);
    }
    if (updateNewsDto.subtitle !== undefined) {
        news.searchSubtitle = this.normalizeForSearch(updateNewsDto.subtitle || '');
    }

    if (updateNewsDto.coverImageUrl === null) {
      (news as any).coverImageStorageKey = null;
    }
    news.updatedBy = new Types.ObjectId(updatedBy);

    const savedNews = await news.save();

    await this.activityLogsService.record({
      action: 'news.update',
      entity: 'news',
      entityId: id,
      status: 'success',
      actorUserId: updatedBy,
      message: 'Notícia editada',
      flags: ['news', 'update', 'success'],
    });

    return new NewsResponseDto(savedNews);
  }

  async remove(id: string, deletedBy: string): Promise<void> {
    const news = await this.newsModel.findOne({ _id: new Types.ObjectId(id), deletedAt: null }).exec();
    if (!news) {
      throw new NotFoundException('Notícia não encontrada');
    }

    news.deletedAt = new Date();
    news.deletedBy = new Types.ObjectId(deletedBy);
    await news.save();

    await this.activityLogsService.record({
      action: 'news.delete',
      entity: 'news',
      entityId: id,
      status: 'success',
      actorUserId: deletedBy,
      message: 'Notícia movida para lixeira (soft delete)',
      flags: ['news', 'delete', 'soft-delete', 'success'],
    });
  }

  async hardRemove(id: string): Promise<void> {
    const news = await this.newsModel.findOneAndDelete({ _id: new Types.ObjectId(id) }).exec();
    if (!news) {
      throw new NotFoundException('Notícia não encontrada');
    }

    await this.activityLogsService.record({
      action: 'news.hard-delete',
      entity: 'news',
      entityId: id,
      status: 'success',
      message: 'Notícia removida permanentemente',
      flags: ['news', 'delete', 'hard-delete', 'success'],
    });
  }

  async uploadImage(file: Express.Multer.File): Promise<{ success: number; file: { url: string } }> {
    const result = await this.uploadsService.uploadImageForEntity({
      entity: 'news-images',
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
}
