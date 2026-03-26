import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MembershipModule } from '../membership/membership.module';
import { LogsModule } from '../logs/logs.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RolesModule } from '../roles/roles.module';
import { UploadsModule } from '../uploads/uploads.module';
import { VerificationCodesModule } from '../verification-codes/verification-codes.module';
import { UserEntity, UserSchema } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserEntity.name, schema: UserSchema }]),
    LogsModule,
    NotificationsModule,
    RolesModule,
    VerificationCodesModule,
    UploadsModule,
    forwardRef(() => MembershipModule),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
