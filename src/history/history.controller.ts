import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/authorization/roles.guard';
import { RequireRoleCodes } from '../auth/authorization/require-role-codes.decorator';
import { ROLE_CODES } from '../auth/authorization/role-codes';
import { HistoryService } from './history.service';
import { CreateHistoryDto } from './dto/create-history.dto';
import { UpdateHistoryDto } from './dto/update-history.dto';
import { HistoryEntity } from './entities/history.entity';

@ApiTags('History')
@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get()
  @ApiOperation({ summary: 'Listar seções da história (Público)' })
  findAllPublic() {
    return this.historyService.findAll(false);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoleCodes(ROLE_CODES.OWNER, ROLE_CODES.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar seções da história (Admin)' })
  findAllAdmin() {
    return this.historyService.findAll(true);
  }

  @Get(':idOrSlug')
  @ApiOperation({ summary: 'Buscar seção por ID ou Slug' })
  findOne(@Param('idOrSlug') idOrSlug: string) {
    return this.historyService.findOne(idOrSlug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoleCodes(ROLE_CODES.OWNER, ROLE_CODES.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar seção histórica' })
  create(@Body() createDto: CreateHistoryDto, @Req() req: any) {
    return this.historyService.create(createDto, req.user.sub);
  }

  @Put('reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoleCodes(ROLE_CODES.OWNER, ROLE_CODES.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reordenar seções históricas' })
  @ApiBody({ schema: { properties: { ids: { type: 'array', items: { type: 'string' } } } } })
  reorder(@Body('ids') ids: string[]) {
    return this.historyService.reorder(ids);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoleCodes(ROLE_CODES.OWNER, ROLE_CODES.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar seção histórica' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateHistoryDto,
    @Req() req: any,
  ) {
    return this.historyService.update(id, updateDto, req.user.sub);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoleCodes(ROLE_CODES.OWNER, ROLE_CODES.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover seção histórica' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.historyService.remove(id, req.user.sub);
  }
}
