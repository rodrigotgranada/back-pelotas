import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Req, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Express } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { AthletesService } from './athletes.service';
import { CreateAthleteDto } from './dto/create-athlete.dto';
import { UpdateAthleteDto } from './dto/update-athlete.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/authorization/roles.guard';
import { RequireRoleCodes } from '../auth/authorization/require-role-codes.decorator';
import { ROLE_CODES } from '../auth/authorization/role-codes';

@ApiTags('Admin / Athletes')
@Controller('athletes')
export class AthletesController {
  constructor(private readonly athletesService: AthletesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoleCodes(ROLE_CODES.ADMIN, ROLE_CODES.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar um novo atleta/membro da comissão' })
  create(@Body() createAthleteDto: CreateAthleteDto, @Req() req: any) {
    return this.athletesService.create(createAthleteDto, req.user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os atletas' })
  @ApiResponse({ status: 200, description: 'Lista de atletas retornada com sucesso' })
  findAll(@Query() query: any) {
    return this.athletesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter detalhes de um atleta específico' })
  findOne(@Param('id') id: string) {
    return this.athletesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoleCodes(ROLE_CODES.ADMIN, ROLE_CODES.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar um atleta existente' })
  update(@Param('id') id: string, @Body() updateAthleteDto: UpdateAthleteDto, @Req() req: any) {
    return this.athletesService.update(id, updateAthleteDto, req.user.sub);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoleCodes(ROLE_CODES.ADMIN, ROLE_CODES.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover um atleta (soft delete)' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.athletesService.remove(id, req.user.sub);
  }

  @Post('upload-image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoleCodes(ROLE_CODES.ADMIN, ROLE_CODES.OWNER)
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    }),
  )
  @ApiOperation({ summary: 'Upload de foto do atleta' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { image: { type: 'string', format: 'binary' } },
    },
  })
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Imagem não enviada');
    return this.athletesService.uploadImage(file);
  }
}
