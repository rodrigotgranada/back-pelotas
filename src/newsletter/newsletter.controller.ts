import { Controller, Post, Body, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NewsletterService } from './newsletter.service';
import { SubscribeDto } from './dto/subscribe.dto';
import { RolesGuard } from '../auth/authorization/roles.guard';
import { RequireRoleCodes } from '../auth/authorization/require-role-codes.decorator';
import { ROLE_CODES } from '../auth/authorization/role-codes';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Newsletter')
@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Post('subscribe')
  @ApiOperation({ summary: 'Inscrever-se na newsletter' })
  @ApiResponse({ status: 201, description: 'E-mail inscrito com sucesso.' })
  @ApiResponse({ status: 409, description: 'E-mail já está inscrito.' })
  subscribe(@Body() subscribeDto: SubscribeDto) {
    return this.newsletterService.subscribe(subscribeDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoleCodes(ROLE_CODES.ADMIN, ROLE_CODES.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar inscritos (Apenas Admin)' })
  findAll(@Query() query: { page?: number; limit?: number; search?: string }) {
    return this.newsletterService.findAll(query);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoleCodes(ROLE_CODES.ADMIN, ROLE_CODES.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Estatísticas de inscritos' })
  getStats() {
    return this.newsletterService.getStats();
  }
}
