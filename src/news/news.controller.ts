import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Express } from 'express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NewsService } from './news.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { QueryNewsDto } from './dto/query-news.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/authorization/roles.guard';
import { RequireRoleCodes } from '../auth/authorization/require-role-codes.decorator';
import { ROLE_CODES } from '../auth/authorization/role-codes';
import { PaginatedNewsResponseDto } from './dto/paginated-news-response.dto';
import { NewsResponseDto } from './dto/news-response.dto';
import { CreateCategoryDto } from './dto/create-category.dto';

@ApiTags('News')
@Controller('news')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @RequireRoleCodes(ROLE_CODES.OWNER, ROLE_CODES.ADMIN, ROLE_CODES.EDITOR)
  @ApiOperation({ summary: 'Criar notícia' })
  @ApiResponse({ status: 201, type: NewsResponseDto })
  create(@Body() createNewsDto: CreateNewsDto, @Req() req: { user?: { sub?: string } }) {
    if (!req.user?.sub) throw new BadRequestException('Não autenticado');
    return this.newsService.create(createNewsDto, req.user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Listar notícias paginadas' })
  @ApiResponse({ status: 200, type: PaginatedNewsResponseDto })
  findAll(@Query() query: QueryNewsDto) {
    return this.newsService.findAll(query);
  }

  @Get('public-news')
  @ApiOperation({ summary: 'Listar notícias públicas paginadas' })
  @ApiResponse({ status: 200, type: PaginatedNewsResponseDto })
  findAllPublic(@Query() queryParams: QueryNewsDto) {
    return this.newsService.findAllPublic(queryParams);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Buscar todas as categorias gerenciadas' })
  @ApiResponse({ status: 200, type: [Object] })
  findAllCategories() {
    return this.newsService.findAllCategories();
  }

  @Post('categories')
  @UseGuards(RolesGuard)
  @RequireRoleCodes(ROLE_CODES.OWNER)
  @ApiOperation({ summary: 'Criar nova categoria de notícia (Apenas Owner)' })
  @ApiResponse({ status: 201 })
  createCategory(@Body() createCategoryDto: CreateCategoryDto, @Req() req: { user?: { sub?: string } }) {
    if (!req.user?.sub) throw new BadRequestException('Não autenticado');
    return this.newsService.createCategory(createCategoryDto, req.user.sub);
  }

  @Delete('categories/:id')
  @UseGuards(RolesGuard)
  @RequireRoleCodes(ROLE_CODES.OWNER)
  @ApiOperation({ summary: 'Remover categoria de notícia (Apenas Owner)' })
  @ApiResponse({ status: 204 })
  removeCategory(@Param('id') id: string, @Req() req: { user?: { sub?: string } }) {
    if (!req.user?.sub) throw new BadRequestException('Não autenticado');
    return this.newsService.deleteCategory(id, req.user.sub);
  }

  @Get('public-news/:slug')
  @ApiOperation({ summary: 'Buscar notícia pública por slug' })
  @ApiResponse({ status: 200, type: NewsResponseDto })
  findOnePublic(@Param('slug') slug: string) {
    return this.newsService.findOnePublic(slug);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar notícia por ID' })
  @ApiResponse({ status: 200, type: NewsResponseDto })
  findOne(@Param('id') id: string) {
    return this.newsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @RequireRoleCodes(ROLE_CODES.OWNER, ROLE_CODES.ADMIN, ROLE_CODES.EDITOR)
  @ApiOperation({ summary: 'Atualizar notícia' })
  @ApiResponse({ status: 200, type: NewsResponseDto })
  update(@Param('id') id: string, @Body() updateNewsDto: UpdateNewsDto, @Req() req: { user?: { sub?: string } }) {
    if (!req.user?.sub) throw new BadRequestException('Não autenticado');
    return this.newsService.update(id, updateNewsDto, req.user.sub);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @RequireRoleCodes(ROLE_CODES.OWNER, ROLE_CODES.ADMIN, ROLE_CODES.EDITOR)
  @ApiOperation({ summary: 'Remover notícia (soft delete)' })
  @ApiResponse({ status: 204 })
  remove(@Param('id') id: string, @Req() req: { user?: { sub?: string } }) {
    if (!req.user?.sub) throw new BadRequestException('Não autenticado');
    return this.newsService.remove(id, req.user.sub);
  }

  @Delete(':id/hard')
  @UseGuards(RolesGuard)
  @RequireRoleCodes(ROLE_CODES.OWNER)
  @ApiOperation({ summary: 'Remover notícia definitivamente (hard delete)' })
  @ApiResponse({ status: 204 })
  hardRemove(@Param('id') id: string) {
    return this.newsService.hardRemove(id);
  }

  @Post('upload-image')
  @UseGuards(RolesGuard)
  @RequireRoleCodes(ROLE_CODES.OWNER, ROLE_CODES.ADMIN, ROLE_CODES.EDITOR)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @ApiOperation({ summary: 'Upload de imagem para dentro do corpo da notícia (Editor.js)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { image: { type: 'string', format: 'binary' } },
    },
  })
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Imagem não enviada');
    return this.newsService.uploadImage(file);
  }
}
