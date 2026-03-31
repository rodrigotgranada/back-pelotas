import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Req, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SquadsService } from './squads.service';
import { CreateSquadDto } from './dto/create-squad.dto';
import { UpdateSquadDto } from './dto/update-squad.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/authorization/roles.guard';
import { RequireRoleCodes } from '../auth/authorization/require-role-codes.decorator';
import { ROLE_CODES } from '../auth/authorization/role-codes';

@ApiTags('Admin / Squads')
@Controller('squads')
export class SquadsController {
  constructor(private readonly squadsService: SquadsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoleCodes(ROLE_CODES.ADMIN, ROLE_CODES.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar um novo elenco' })
  create(@Body() createSquadDto: CreateSquadDto, @Req() req: { user?: { sub?: string } }) {
    if (!req.user?.sub) throw new BadRequestException('Não autenticado');
    return this.squadsService.create(createSquadDto, req.user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Listar elencos com filtros (ano, competição, categoria)' })
  findAll(@Query() query: any) {
    return this.squadsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter detalhes de um elenco específico' })
  findOne(@Param('id') id: string) {
    return this.squadsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoleCodes(ROLE_CODES.ADMIN, ROLE_CODES.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar um elenco existente' })
  update(@Param('id') id: string, @Body() updateSquadDto: UpdateSquadDto, @Req() req: { user?: { sub?: string } }) {
    if (!req.user?.sub) throw new BadRequestException('Não autenticado');
    return this.squadsService.update(id, updateSquadDto, req.user.sub);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoleCodes(ROLE_CODES.ADMIN, ROLE_CODES.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover um elenco (soft delete)' })
  remove(@Param('id') id: string, @Req() req: { user?: { sub?: string } }) {
    if (!req.user?.sub) throw new BadRequestException('Não autenticado');
    return this.squadsService.remove(id, req.user.sub);
  }
}
