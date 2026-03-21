import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NewsService } from './news.service';
import { QueryNewsDto } from './dto/query-news.dto';
import { PaginatedNewsResponseDto } from './dto/paginated-news-response.dto';
import { NewsResponseDto } from './dto/news-response.dto';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

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
}
