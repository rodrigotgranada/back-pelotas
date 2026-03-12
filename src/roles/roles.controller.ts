import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesService } from './roles.service';

@Controller('roles')
@UseGuards(JwtAuthGuard)
@ApiTags('Roles')
@ApiBearerAuth()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar roles ativas' })
  @ApiOkResponse({
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '69ad688617d7de52325e3b65' },
          code: { type: 'string', example: 'admin' },
          name: { type: 'string', example: 'Admin' },
          level: { type: 'number', example: 80 },
        },
      },
    },
  })
  findAllActive() {
    return this.rolesService.findAllActive();
  }
}
