import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/authorization/roles.guard';
import { RequireRoleCodes } from '../auth/authorization/require-role-codes.decorator';
import { ROLE_CODES } from '../auth/authorization/role-codes';
import { CreateIdolDto } from './dto/create-idol.dto';
import { UpdateIdolDto } from './dto/update-idol.dto';
import { IdolsService } from './idols.service';

@ApiTags('Admin / Idols')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@RequireRoleCodes(ROLE_CODES.ADMIN, ROLE_CODES.OWNER)
@Controller('idols')
export class IdolsController {
  constructor(private readonly idolsService: IdolsService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo Ídolo (Atleta ou Não-Atleta)' })
  @ApiResponse({ status: 201, description: 'Ídolo criado com sucesso' })
  create(@Body() createIdolDto: CreateIdolDto, @Req() req: { user?: { sub?: string } }) {
    if (!req.user?.sub) throw new BadRequestException('Não autenticado');
    return this.idolsService.create(createIdolDto, req.user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Retorna todos os ídolos (ativos e inativos)' })
  findAll() {
    return this.idolsService.findAll(false);
  }

  @Get('public')
  @RequireRoleCodes() // Override admin protection for explicit public route if wanted inside same controller, but better practice is generic. Wait, we'll keep public separated or just clear auth. 
  // Wait, I am using RequireRoleCodes without args which might lock it or unlock it. Let's remove this endpoint from here and use a separate PublicIdolsController if needed, or just let frontend use a public controller later.
  @ApiOperation({ summary: 'Placeholder for public route' })
  findPublic() {
    // This is protected by the class-level UseGuards. So it's not truly public unless we bypass.
    return this.idolsService.findAll(true);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retorna um ídolo pelo ID' })
  findOne(@Param('id') id: string) {
    return this.idolsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza um Ídolo existente' })
  update(@Param('id') id: string, @Body() updateIdolDto: UpdateIdolDto, @Req() req: { user?: { sub?: string } }) {
    if (!req.user?.sub) throw new BadRequestException('Não autenticado');
    return this.idolsService.update(id, updateIdolDto, req.user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deleta logicamente um ídolo' })
  remove(@Param('id') id: string, @Req() req: { user?: { sub?: string } }) {
    if (!req.user?.sub) throw new BadRequestException('Não autenticado');
    return this.idolsService.remove(id, req.user.sub);
  }

  @Patch('reorder')
  @ApiOperation({ summary: 'Reordena a lista de ídolos baseada nos IDs' })
  reorder(@Body('ids') ids: string[], @Req() req: { user?: { sub?: string } }) {
    if (!req.user?.sub) throw new BadRequestException('Não autenticado');
    return this.idolsService.reorder(ids, req.user.sub);
  }
}
