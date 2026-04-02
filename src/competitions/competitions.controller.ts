import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { CompetitionsService } from './competitions.service';
import { CreateCompetitionDto, UpdateCompetitionDto } from './dto/competition.dto';
import { CompetitionEntity } from './entities/competition.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/authorization/roles.guard';
import { RequireRoleCodes } from '../auth/authorization/require-role-codes.decorator';
import { ROLE_CODES } from '../auth/authorization/role-codes';

@Controller('competitions')
export class CompetitionsController {
  constructor(private readonly competitionsService: CompetitionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoleCodes(ROLE_CODES.OWNER, ROLE_CODES.ADMIN)
  async create(@Body() createDto: CreateCompetitionDto): Promise<CompetitionEntity> {
    return this.competitionsService.create(createDto);
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
  async update(@Param('id') id: string, @Body() updateDto: UpdateCompetitionDto): Promise<CompetitionEntity> {
    return this.competitionsService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoleCodes(ROLE_CODES.OWNER, ROLE_CODES.ADMIN)
  async remove(@Param('id') id: string): Promise<void> {
    return this.competitionsService.remove(id);
  }
}
