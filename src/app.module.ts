import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { LogsModule } from './logs/logs.module';
import { NewsModule } from './news/news.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RolesModule } from './roles/roles.module';
import { UsersModule } from './users/users.module';
import { VerificationCodesModule } from './verification-codes/verification-codes.module';

const databaseImports =
  process.env.NODE_ENV === 'test'
    ? []
    : [
        MongooseModule.forRootAsync({
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            uri:
              configService.get<string>('MONGODB_URI') ??
              'mongodb://127.0.0.1:27017/back-pelotas',
          }),
        }),
      ];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ...databaseImports,
    LogsModule,
    NotificationsModule,
    VerificationCodesModule,
    RolesModule,
    UsersModule,
    AuthModule,
    NewsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
