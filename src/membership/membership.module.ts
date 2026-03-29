import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MembershipController } from './membership.controller';
import { MembershipService } from './membership.service';
import { MembershipPlanEntity, MembershipPlanSchema } from './entities/membership-plan.entity';
import { MembershipSubscriptionEntity, MembershipSubscriptionSchema } from './entities/membership-subscription.entity';
import { MembershipInterest, MembershipInterestSchema } from './entities/membership-interest.entity';
import { MembershipInterestService } from './membership-interest.service';
import { MembershipInterestController } from './membership-interest.controller';
import { UsersModule } from '../users/users.module';
import { LogsModule } from '../logs/logs.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MembershipPlanEntity.name, schema: MembershipPlanSchema },
      { name: MembershipSubscriptionEntity.name, schema: MembershipSubscriptionSchema },
      { name: MembershipInterest.name, schema: MembershipInterestSchema },
    ]),
    forwardRef(() => UsersModule),
    LogsModule,
  ],
  controllers: [MembershipController, MembershipInterestController],
  providers: [MembershipService, MembershipInterestService],
  exports: [MembershipService, MembershipInterestService],
})
export class MembershipModule {}
