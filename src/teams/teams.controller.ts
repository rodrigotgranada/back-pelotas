import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, UseInterceptors, UploadedFile, BadRequestException, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Express } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { TeamsService } from './teams.service';
import { CreateTeamDto, UpdateTeamDto } from './dto/team.dto';
import { TeamEntity } from './entities/team.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/authorization/roles.guard';
import { RequireRoleCodes } from '../auth/authorization/require-role-codes.decorator';
import { ROLE_CODES } from '../auth/authorization/role-codes';

@ApiTags('Admin / Teams')
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoleCodes(ROLE_CODES.OWNER, ROLE_CODES.ADMIN)
  async create(@Body() createTeamDto: CreateTeamDto, @Req() req: any): Promise<TeamEntity> {
    const adminId = req.user?.id;
    return this.teamsService.create(createTeamDto, adminId);
  }

  @Get()
  async findAll(): Promise<TeamEntity[]> {
    return this.teamsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<TeamEntity> {
    return this.teamsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoleCodes(ROLE_CODES.OWNER, ROLE_CODES.ADMIN)
  async update(@Param('id') id: string, @Body() updateTeamDto: UpdateTeamDto, @Req() req: any): Promise<TeamEntity> {
    const adminId = req.user?.id;
    return this.teamsService.update(id, updateTeamDto, adminId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoleCodes(ROLE_CODES.OWNER, ROLE_CODES.ADMIN)
  async remove(@Param('id') id: string, @Req() req: any): Promise<void> {
    const adminId = req.user?.id;
    return this.teamsService.remove(id, adminId);
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
  @ApiOperation({ summary: 'Upload de escudo do clube' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { image: { type: 'string', format: 'binary' } },
    },
  })
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Imagem não enviada');
    return this.teamsService.uploadImage(file);
  }
}
