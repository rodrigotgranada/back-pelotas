import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/authorization/roles.guard';
import { RequireRoleCodes } from '../auth/authorization/require-role-codes.decorator';
import { ROLE_CODES } from '../auth/authorization/role-codes';
import { CreateSponsorDto } from './dto/create-sponsor.dto';
import { UpdateSponsorDto } from './dto/update-sponsor.dto';
import { SponsorsService } from './sponsors.service';

@ApiTags('Admin / Sponsors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@RequireRoleCodes(ROLE_CODES.ADMIN, ROLE_CODES.OWNER)
@Controller('sponsors')
export class SponsorsController {
  constructor(private readonly sponsorsService: SponsorsService) {}

  @Post()
  @ApiOperation({ summary: 'Creates a new Sponsor' })
  @ApiResponse({ status: 201, description: 'Sponsor created correctly' })
  create(@Body() createSponsorDto: CreateSponsorDto, @Req() req: { user?: { sub?: string } }) {
    if (!req.user?.sub) throw new BadRequestException('Não autenticado');
    return this.sponsorsService.create(createSponsorDto, req.user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Returns all sponsors including active and inactive' })
  findAll() {
    return this.sponsorsService.findAll(false);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Returns a single sponsor by its id' })
  findOne(@Param('id') id: string) {
    return this.sponsorsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Updates an existing Sponsor' })
  update(@Param('id') id: string, @Body() updateSponsorDto: UpdateSponsorDto, @Req() req: { user?: { sub?: string } }) {
    if (!req.user?.sub) throw new BadRequestException('Não autenticado');
    return this.sponsorsService.update(id, updateSponsorDto, req.user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft deletes a sponsor' })
  remove(@Param('id') id: string, @Req() req: { user?: { sub?: string } }) {
    if (!req.user?.sub) throw new BadRequestException('Não autenticado');
    return this.sponsorsService.remove(id, req.user.sub);
  }

  @Patch('reorder')
  @ApiOperation({ summary: 'Reorders sponsors based on the list of IDs' })
  reorder(@Body('ids') ids: string[], @Req() req: { user?: { sub?: string } }) {
    if (!req.user?.sub) throw new BadRequestException('Não autenticado');
    return this.sponsorsService.reorder(ids, req.user.sub);
  }
}
