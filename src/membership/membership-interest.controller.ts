import { Controller, Post, Body, Get, UseGuards, Patch, Param } from '@nestjs/common';
import { MembershipInterestService } from './membership-interest.service';
import { CreateMembershipInterestDto } from './dto/create-interest.dto';
import { UpdateInterestDto } from './dto/update-interest.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/authorization/roles.guard';
import { RequireRoleCodes } from '../auth/authorization/require-role-codes.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

@ApiTags('Membership Interests')
@Controller('membership-interests')
export class MembershipInterestController {
  constructor(private readonly interestService: MembershipInterestService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar interesse em aderir a um plano de socio' })
  @ApiResponse({ status: 201, description: 'Interesse registrado com sucesso' })
  create(@Body() dto: CreateMembershipInterestDto) {
    return this.interestService.create(dto);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoleCodes('owner', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos os interesses registrados (Admin)' })
  findAll() {
    return this.interestService.findAll();
  }

  @Get('admin/unread-count')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoleCodes('owner', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Contar registros de interesses nao lidos (Admin)' })
  countUnread() {
    return this.interestService.countUnread();
  }

  @Patch('admin/:id/read')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoleCodes('owner', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Marcar interesse como lido (Admin)' })
  markAsRead(@Param('id') id: string) {
    return this.interestService.markAsRead(id);
  }

  @Patch('admin/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoleCodes('owner', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar status do processo de interesse (Admin)' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateInterestDto) {
    return this.interestService.update(id, dto);
  }
}
