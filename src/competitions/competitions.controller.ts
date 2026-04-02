import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, UseInterceptors, UploadedFile, BadRequestException, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Express } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { CompetitionsService } from './competitions.service';
import { CreateCompetitionDto, UpdateCompetitionDto } from './dto/competition.dto';
import { CompetitionEntity } from './entities/competition.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/authorization/roles.guard';
import { RequireRoleCodes } from '../auth/authorization/require-role-codes.decorator';
import { ROLE_CODES } from '../auth/authorization/role-codes';

@ApiTags('Admin / Competitions')
@Controller('competitions')
export class CompetitionsController {
  constructor(private readonly competitionsService: CompetitionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoleCodes(ROLE_CODES.OWNER, ROLE_CODES.ADMIN)
  async create(@Body() createDto: CreateCompetitionDto, @Req() req: any): Promise<CompetitionEntity> {
    const adminId = req.user?.id;
    return this.competitionsService.create(createDto, adminId);
  }

  @Get()
  async findAll(): Promise<CompetitionEntity[]> {
    return this.competitionsService.findAll();
  }

  @Get('active')
  async findActive(): Promise<CompetitionEntity[]> {
    return this.competitionsService.findActive();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<CompetitionEntity> {
    return this.competitionsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoleCodes(ROLE_CODES.OWNER, ROLE_CODES.ADMIN)
  async update(@Param('id') id: string, @Body() updateDto: UpdateCompetitionDto, @Req() req: any): Promise<CompetitionEntity> {
    const adminId = req.user?.id;
    return this.competitionsService.update(id, updateDto, adminId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoleCodes(ROLE_CODES.OWNER, ROLE_CODES.ADMIN)
  async remove(@Param('id') id: string, @Req() req: any): Promise<void> {
    const adminId = req.user?.id;
    return this.competitionsService.remove(id, adminId);
  }

  @Post('upload-image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoleCodes(ROLE_CODES.OWNER, ROLE_CODES.ADMIN)
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    }),
  )
  @ApiOperation({ summary: 'Upload de escudo do campeonato' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { image: { type: 'string', format: 'binary' } },
    },
  })
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Imagem não enviada');
    return this.competitionsService.uploadImage(file);
  }
}
