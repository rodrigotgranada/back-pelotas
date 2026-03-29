import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MembershipService } from './membership.service';
import { CreateMembershipPlanDto } from './dto/create-membership-plan.dto';
import { UpdateMembershipPlanDto } from './dto/update-membership-plan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/authorization/roles.guard';
import { RequireRoleCodes } from '../auth/authorization/require-role-codes.decorator';
import { ROLE_CODES } from '../auth/authorization/role-codes';

@ApiTags('Membership')
@Controller('membership')
export class MembershipController {
  constructor(private readonly membershipService: MembershipService) {}

  // --- Public Endpoints ---

  @Get('plans')
  @ApiOperation({ summary: 'Listar planos ativos' })
  async getActivePlans() {
    return this.membershipService.findAllPlans(true);
  }

  @Get('plans/:id')
  @ApiOperation({ summary: 'Obter detalhes de um plano' })
  async getPlan(@Param('id') id: string) {
    return this.membershipService.findPlanById(id);
  }

  @Post('enroll')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aderir a um plano (Checkout)' })
  async enroll(
    @Req() req: any,
    @Body() body: { planId: string; paymentMethod: 'pix' | 'credit_card' | 'boleto' },
  ) {
    return this.membershipService.enroll(req.user.id, body.planId, body.paymentMethod);
  }

  @Get('subscription')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ver status da minha assinatura' })
  async getMySubscription(@Req() req: any) {
    return this.membershipService.getSubscription(req.user.id);
  }

  @Post('simulate-payment/:subscriptionId')
  @ApiOperation({ summary: 'Simular sucesso no pagamento (Webhook)' })
  async simulatePayment(@Param('subscriptionId') subscriptionId: string) {
    return this.membershipService.activateSubscription(subscriptionId);
  }

  // --- Admin Endpoints ---

  @Get('admin/plans')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoleCodes(ROLE_CODES.OWNER, ROLE_CODES.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos os planos (Admin)' })
  async getAllPlans() {
    return this.membershipService.findAllPlans(false);
  }

  @Post('admin/plans')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoleCodes(ROLE_CODES.OWNER, ROLE_CODES.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar novo plano' })
  async createPlan(@Req() req: any, @Body() dto: CreateMembershipPlanDto) {
    return this.membershipService.createPlan(dto, req.user.id);
  }

  @Put('admin/plans/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoleCodes(ROLE_CODES.OWNER, ROLE_CODES.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar plano' })
  async updatePlan(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateMembershipPlanDto,
  ) {
    return this.membershipService.updatePlan(id, dto, req.user.id);
  }

  @Delete('admin/plans/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoleCodes(ROLE_CODES.OWNER, ROLE_CODES.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Excluir plano' })
  async deletePlan(@Req() req: any, @Param('id') id: string) {
    return this.membershipService.deletePlan(id, req.user.id);
  }
}
