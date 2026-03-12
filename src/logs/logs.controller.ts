import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ROLE_CODES } from '../auth/authorization/role-codes';
import { RequireRoleCodes } from '../auth/authorization/require-role-codes.decorator';
import { RolesGuard } from '../auth/authorization/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActivityLogsService } from './activity-logs.service';
import { QueryActivityLogsDto } from './dto/query-activity-logs.dto';
import { ActivityLogEntity } from './entities/activity-log.entity';

@Controller('logs')
@UseGuards(JwtAuthGuard)
@ApiTags('Logs')
@ApiBearerAuth()
export class LogsController {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoleCodes(ROLE_CODES.OWNER, ROLE_CODES.ADMIN)
  @ApiOperation({ summary: 'Listar logs de atividade com filtros' })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'entity', required: false })
  @ApiQuery({ name: 'entityId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['success', 'failure'] })
  @ApiQuery({ name: 'flag', required: false })
  @ApiQuery({ name: 'actorUserId', required: false })
  @ApiQuery({ name: 'from', required: false, description: 'Data ISO inicial' })
  @ApiQuery({ name: 'to', required: false, description: 'Data ISO final' })
  @ApiQuery({ name: 'limit', required: false, description: 'Quantidade maxima' })
  @ApiOkResponse({ type: ActivityLogEntity, isArray: true })
  findAll(@Query() query: QueryActivityLogsDto): Promise<ActivityLogEntity[]> {
    return this.activityLogsService.findAll(query);
  }
}
