import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Patch, Query, Req } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { CreateMatchDto, UpdateMatchDto } from './dto/match.dto';
import { MatchEntity } from './entities/match.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/authorization/roles.guard';
import { RequireRoleCodes } from '../auth/authorization/require-role-codes.decorator';
import { ROLE_CODES } from '../auth/authorization/role-codes';

@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoleCodes(ROLE_CODES.OWNER, ROLE_CODES.ADMIN)
  async create(@Body() createDto: CreateMatchDto, @Req() req: any): Promise<MatchEntity> {
    return this.matchesService.create(createDto, req.user?.id);
  }

  @Get()
  async findAll(): Promise<MatchEntity[]> {
    return this.matchesService.findAll();
  }

  @Get('next')
  async findNext(): Promise<MatchEntity | null> {
    return this.matchesService.findNext();
  }

  @Get('last-result')
  async findLastResult(): Promise<MatchEntity | null> {
    return this.matchesService.findLastResult();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<MatchEntity> {
    return this.matchesService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoleCodes(ROLE_CODES.OWNER, ROLE_CODES.ADMIN)
  async update(@Param('id') id: string, @Body() updateDto: UpdateMatchDto, @Req() req: any): Promise<MatchEntity> {
    return this.matchesService.update(id, updateDto, req.user?.id);
  }

  @Patch(':id/finish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoleCodes(ROLE_CODES.OWNER, ROLE_CODES.ADMIN)
  async finish(@Param('id') id: string, @Query('newsId') newsId: string | undefined, @Req() req: any): Promise<MatchEntity> {
    return this.matchesService.finish(id, newsId, req.user?.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoleCodes(ROLE_CODES.OWNER, ROLE_CODES.ADMIN)
  async remove(@Param('id') id: string, @Req() req: any): Promise<void> {
    return this.matchesService.remove(id, req.user?.id);
  }
}
