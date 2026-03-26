import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MembershipController } from './membership.controller';
import { MembershipService } from './membership.service';
import { MembershipPlanEntity, MembershipPlanSchema } from './entities/membership-plan.entity';
import { MembershipSubscriptionEntity, MembershipSubscriptionSchema } from './entities/membership-subscription.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MembershipPlanEntity.name, schema: MembershipPlanSchema },
      { name: MembershipSubscriptionEntity.name, schema: MembershipSubscriptionSchema },
    ]),
    forwardRef(() => UsersModule),
  ],
  controllers: [MembershipController],
  providers: [MembershipService],
  exports: [MembershipService],
})
export class MembershipModule {}
