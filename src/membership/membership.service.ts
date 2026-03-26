import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MembershipPlanEntity, MembershipPlanDocument } from './entities/membership-plan.entity';
import { MembershipSubscriptionEntity, MembershipSubscriptionDocument } from './entities/membership-subscription.entity';
import { CreateMembershipPlanDto } from './dto/create-membership-plan.dto';
import { UpdateMembershipPlanDto } from './dto/update-membership-plan.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class MembershipService {
  constructor(
    @InjectModel(MembershipPlanEntity.name)
    private readonly planModel: Model<MembershipPlanDocument>,
    @InjectModel(MembershipSubscriptionEntity.name)
    private readonly subscriptionModel: Model<MembershipSubscriptionDocument>,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) {}

  // --- Plan Management (Admin) ---

  private async generateSlug(name: string): Promise<string> {
    const baseSlug = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    let slug = baseSlug;
    let count = 1;

    while (await this.planModel.exists({ slug })) {
      slug = `${baseSlug}-${count}`;
      count++;
    }

    return slug;
  }

  async createPlan(dto: CreateMembershipPlanDto, adminId: string): Promise<MembershipPlanEntity> {
    const slug = dto.slug || await this.generateSlug(dto.name);
    const plan = new this.planModel({
      ...dto,
      slug,
      createdBy: new Types.ObjectId(adminId),
      updatedBy: new Types.ObjectId(adminId),
    });
    return plan.save();
  }

  async updatePlan(id: string, dto: UpdateMembershipPlanDto, adminId: string): Promise<MembershipPlanEntity> {
    if (dto.name && !dto.slug) {
        // Option: we could auto-generate slug if name changes and slug is not provided
        // But for safety, let's only do it if explicitly requested or on creation.
        // For now, if slug is provided in DTO, we use it.
    }
    const plan = await this.planModel.findByIdAndUpdate(
      id,
      { ...dto, updatedBy: new Types.ObjectId(adminId) },
      { new: true },
    );
    if (!plan) throw new NotFoundException('Plano não encontrado');
    return plan;
  }

  async findAllPlans(onlyActive = true): Promise<MembershipPlanEntity[]> {
    const filter = onlyActive ? { isActive: true } : {};
    return this.planModel.find(filter).sort({ price: 1 }).exec();
  }

  async findPlanById(id: string): Promise<MembershipPlanEntity> {
    let filter: any = { _id: Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : null };
    if (!filter._id) {
        filter = { slug: id };
    } else {
        filter = { $or: [{ _id: filter._id }, { slug: id }] };
    }

    const plan = await this.planModel.findOne(filter).exec();
    if (!plan) throw new NotFoundException('Plano não encontrado');
    return plan;
  }

  async deletePlan(id: string): Promise<void> {
    const result = await this.planModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Plano não encontrado');
  }

  // --- Enrollment (Public) ---

  async enroll(userId: string, planId: string, paymentMethod: 'pix' | 'credit_card' | 'boleto'): Promise<MembershipSubscriptionEntity> {
    const plan = await this.findPlanById(planId);
    if (!plan.isActive) throw new BadRequestException('Este plano não está mais disponível');

    // Check if user already has an active subscription
    const existing = await this.subscriptionModel.findOne({ userId: new Types.ObjectId(userId), status: 'active' }).exec();
    if (existing) throw new BadRequestException('Você já possui uma assinatura ativa');

    // Calculate validity based on plan interval
    const validUntil = new Date();
    if (plan.interval === 'monthly') validUntil.setMonth(validUntil.getMonth() + 1);
    else if (plan.interval === 'quarterly') validUntil.setMonth(validUntil.getMonth() + 3);
    else if (plan.interval === 'yearly') validUntil.setFullYear(validUntil.getFullYear() + 1);

    const subscription = new this.subscriptionModel({
      userId: new Types.ObjectId(userId),
      planId: new Types.ObjectId(planId),
      status: 'pending_payment',
      paymentMethod,
      validUntil,
      amountPaid: plan.price,
    });

    return subscription.save();
  }

  async activateSubscription(subscriptionId: string): Promise<MembershipSubscriptionEntity> {
    const subscription = await this.subscriptionModel.findById(subscriptionId).exec();
    if (!subscription) throw new NotFoundException('Assinatura não encontrada');

    subscription.status = 'active';
    subscription.lastPaymentAt = new Date();
    const saved = await subscription.save();

    // UPDATE USER ROLE to 'socio'
    await this.usersService.updateRoleToSocio(subscription.userId.toString());

    return saved;
  }

  async getSubscription(userId: string): Promise<any> {
    return this.subscriptionModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .populate('planId')
      .sort({ createdAt: -1 })
      .exec();
  }
}
