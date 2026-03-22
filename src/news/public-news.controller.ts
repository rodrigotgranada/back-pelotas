import { Controller, Get, Param, Query, Req, UseGuards, Post, Body, BadRequestException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NewsService } from './news.service';
import { QueryNewsDto } from './dto/query-news.dto';
import { PaginatedNewsResponseDto } from './dto/paginated-news-response.dto';
import { NewsResponseDto } from './dto/news-response.dto';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Public News')
@Controller('public-news')
export class PublicNewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar notícias publicadas (Site Público)' })
  @ApiResponse({ status: 200, type: PaginatedNewsResponseDto })
  findAllPublic(@Query() query: QueryNewsDto) {
    return this.newsService.findAllPublic(query);
  }

  @Get(':slug')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Buscar matéria pública por Slug ou ID (Permite Preview de Drafts p/ Autores)' })
  @ApiResponse({ status: 200, type: NewsResponseDto })
  findOnePublic(@Param('slug') slug: string, @Req() req: any) {
    return this.newsService.findOnePublic(slug, req.user);
  }

  @Post(':slug/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Curtir ou descurtir uma matéria (Toggle)' })
  toggleLike(@Param('slug') slug: string, @Req() req: any) {
    if (!req.user?.sub) throw new BadRequestException('Não autenticado');
    return this.newsService.toggleLike(slug, req.user.sub);
  }

  @Get(':slug/like-status')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Verifica se o usuário atual já curtiu a matéria' })
  getLikeStatus(@Param('slug') slug: string, @Req() req: any) {
    if (!req.user?.sub) return { liked: false };
    return this.newsService.getLikeStatus(slug, req.user.sub);
  }

  @Get(':slug/comments')
  @ApiOperation({ summary: 'Listar comentários de uma matéria' })
  getComments(@Param('slug') slug: string) {
    return this.newsService.getComments(slug);
  }

  @Post(':slug/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Adicionar comentário em uma matéria' })
  addComment(
    @Param('slug') slug: string, 
    @Body('content') content: string, 
    @Req() req: any
  ) {
    if (!req.user?.sub) throw new BadRequestException('Não autenticado');
    if (!content || content.trim().length === 0) throw new BadRequestException('Comentário vazio');
    return this.newsService.addComment(slug, req.user.sub, content);
  }
}
