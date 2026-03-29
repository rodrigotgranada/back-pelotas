import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { MembershipService } from '../membership/membership.service';
import { compare, hash } from 'bcryptjs';
import { Model, Types } from 'mongoose';
import { ActivityLogsService } from '../logs/activity-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RolesService } from '../roles/roles.service';
import { UploadsService } from '../uploads/uploads.service';
import { VerificationCodesService } from '../verification-codes/verification-codes.service';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { ListUsersDto } from './dto/list-users.dto';
import { PaginatedUsersResponseDto } from './dto/paginated-users-response.dto';
import { UserDocument, UserEntity } from './entities/user.entity';

interface RequestContext {
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private static readonly PHONE_CONTACT_TYPES = ['phone', 'mobile', 'whatsapp'];
  private static readonly EMAIL_CODE_EXPIRATION_HOURS = 2;
  private static readonly PHONE_CODE_EXPIRATION_HOURS = 2;
  private static readonly PASSWORD_RESET_CODE_EXPIRATION_HOURS = 2;
  private static readonly PASSWORD_HISTORY_LIMIT = 3;
  private static readonly MAX_FAILED_LOGIN_ATTEMPTS = 5;
  private static readonly LOGIN_LOCK_MINUTES = 15;

  constructor(
    @InjectModel(UserEntity.name)
    private readonly userModel: Model<UserDocument>,
    private readonly activityLogsService: ActivityLogsService,
    private readonly notificationsService: NotificationsService,
    private readonly rolesService: RolesService,
    private readonly verificationCodesService: VerificationCodesService,
    private readonly uploadsService: UploadsService,
    @Inject(forwardRef(() => MembershipService))
    private readonly membershipService: MembershipService,
  ) {}

  async assertCanUpdateTargetUser(actorUserId: string | undefined, targetUserId: string): Promise<void> {
    if (!actorUserId) {
      throw new UnauthorizedException('Usuario nao autenticado');
    }

    if (actorUserId === targetUserId) {
      return;
    }

    const actor = await this.userModel
      .findOne({ _id: this.parseObjectId(actorUserId), deletedAt: null })
      .lean();

    const target = await this.userModel
      .findOne({ _id: this.parseObjectId(targetUserId), deletedAt: null })
      .lean();

    if (!actor || !actor.isActive) {
      throw new ForbiddenException('Usuario sem permissao para editar terceiros');
    }

    if (!target || !target.isActive) {
      throw new ForbiddenException('Usuario alvo nao pode ser editado');
    }

    if (!actor.roleId || !target.roleId) {
      throw new ForbiddenException('Usuario sem permissao para editar terceiros');
    }

    const actorRole = await this.rolesService.findById(actor.roleId);
    const targetRole = await this.rolesService.findById(target.roleId);

    if (!actorRole || !targetRole) {
      throw new ForbiddenException('Role invalida para regra de autorizacao');
    }

    if (actorRole.code === 'owner') {
      return;
    }

    if (actorRole.code === 'admin') {
      if (targetRole.code === 'editor' || targetRole.code === 'socio') {
        return;
      }

      throw new ForbiddenException('Admin so pode editar usuarios do tipo editor ou socio');
    }

    throw new ForbiddenException('Usuario sem permissao para editar terceiros');
  }

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    try {
      await this.ensureUniqueEmail(createUserDto.email);
    } catch (error) {
      if (error instanceof ConflictException) {
        await this.activityLogsService.record({
          action: 'user.create',
          entity: 'user',
          status: 'failure',
          actorUserId: createUserDto.createdBy,
          actorEmail: createUserDto.email,
          message: 'Tentativa de cadastro com email ja existente',
          flags: ['user', 'create', 'failure', 'duplicate-email'],
          metadata: {
            attemptedEmail: createUserDto.email.toLowerCase(),
          },
        });
      }

      throw error;
    }

    try {
      await this.ensureUniqueDocument(createUserDto.document);
    } catch (error) {
      if (error instanceof ConflictException) {
        await this.activityLogsService.record({
          action: 'user.create',
          entity: 'user',
          status: 'failure',
          actorUserId: createUserDto.createdBy,
          actorEmail: createUserDto.email,
          message: 'Tentativa de cadastro com documento ja existente',
          flags: ['user', 'create', 'failure', 'duplicate-document'],
          metadata: {
            attemptedDocument: createUserDto.document,
          },
        });
      }

      throw error;
    }

    const normalizedContacts = this.normalizeContacts(createUserDto.contacts);
    try {
      await this.ensureUniquePhoneContacts(normalizedContacts);
    } catch (error) {
      if (error instanceof ConflictException) {
        await this.activityLogsService.record({
          action: 'user.create',
          entity: 'user',
          status: 'failure',
          actorUserId: createUserDto.createdBy,
          actorEmail: createUserDto.email,
          message: 'Tentativa de cadastro com telefone ja existente',
          flags: ['user', 'create', 'failure', 'duplicate-phone'],
          metadata: {
            attemptedPhones: this.extractPhoneValues(normalizedContacts),
          },
        });
      }

      throw error;
    }

    const now = new Date();
    const hashedPassword = await hash(createUserDto.password, 10);
    const isActive = createUserDto.isActive ?? true;
    const emailVerified = createUserDto.emailVerified ?? false;
    const status = !isActive ? 'blocked' : emailVerified ? 'active' : 'pending';

    const user = await this.userModel.create({
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      email: createUserDto.email.toLowerCase(),
      document: createUserDto.document,
      documentType: createUserDto.documentType,
      password: hashedPassword,
      passwordHistory: [],
      roleId: this.toObjectIdOrNull(createUserDto.roleId),
      photoUrl: createUserDto.photoUrl,
      photoStorageKey: null,
      isActive,
      emailVerified,
      status,
      passwordUpdatedAt: now,
      failedLoginAttempts: 0,
      loginBlockedUntil: null,
      refreshTokenHash: null,
      refreshTokenExpiresAt: null,
      createdBy: this.toObjectIdOrNull(createUserDto.createdBy),
      contacts: normalizedContacts,
      addresses:
        createUserDto.addresses?.map((address) => ({
          type: address.type,
          street: address.street,
          number: address.number,
          complement: address.complement ?? null,
          neighborhood: address.neighborhood,
          city: address.city,
          state: address.state,
          zipCode: address.zipCode,
          country: address.country,
          isPrimary: address.isPrimary ?? false,
        })) ?? [],
      emailVerification: null,
      emailChangeRequest: null,
      passwordResetRequest: null,
    });

    const response = this.toResponse(user as any); // Cast as expected by Mongoose returning document

    await this.activityLogsService.record({
      action: 'user.create',
      entity: 'user',
      entityId: response.id,
      status: 'success',
      actorUserId: createUserDto.createdBy,
      actorEmail: response.email,
      message: 'Usuario cadastrado com sucesso',
      flags: ['user', 'create', 'success'],
      metadata: {
        email: response.email,
        document: response.document,
        phones: this.extractPhoneValues(response.contacts),
      },
    });

    return response;
  }

  async createAdminUser(createDto: CreateAdminUserDto, creatorId: string): Promise<UserResponseDto> {
    try {
      await this.ensureUniqueEmail(createDto.email);
    } catch (error) {
      if (error instanceof ConflictException) {
        await this.activityLogsService.record({
          action: 'user.createAdmin',
          entity: 'user',
          status: 'failure',
          actorUserId: creatorId,
          message: 'Tentativa de cadastro admin com email ja existente',
          flags: ['user', 'create', 'failure', 'duplicate-email'],
          metadata: { attemptedEmail: createDto.email.toLowerCase() },
        });
      }
      throw error;
    }

    if (createDto.document) {
      try { await this.ensureUniqueDocument(createDto.document); } 
      catch (error) { throw error; }
    }

    const normalizedContacts = this.normalizeContacts(createDto.contacts ?? []);
    if ((normalizedContacts ?? []).length > 0) {
      try { await this.ensureUniquePhoneContacts(normalizedContacts!); }
      catch (error) { throw error; }
    }

    const isFixedPassword = !!createDto.password;
    const finalPassword = createDto.password || Array(8).fill("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz").map(function(x) { return x[Math.floor(Math.random() * x.length)] }).join('');
    
    const now = new Date();
    const hashedPassword = await hash(finalPassword, 10);
    const isActive = createDto.isActive ?? true;

    // Use spread payload to avoid mapping 'null' string-assigned types to strictly typed models
    const payload: any = {
      firstName: createDto.firstName,
      lastName: createDto.lastName,
      email: createDto.email.toLowerCase(),
      password: hashedPassword,
      passwordHistory: [],
      roleId: this.toObjectIdOrNull(createDto.roleId),
      photoUrl: null,
      photoStorageKey: null,
      isActive,
      emailVerified: true, // For admin creation, assume email is right
      status: !isActive ? 'blocked' : 'active',
      passwordUpdatedAt: now,
      failedLoginAttempts: 0,
      loginBlockedUntil: null,
      refreshTokenHash: null,
      refreshTokenExpiresAt: null,
      createdBy: this.toObjectIdOrNull(creatorId),
      contacts: normalizedContacts ?? [],
      addresses:
        createDto.addresses?.map((address) => ({
          type: address.type,
          street: address.street,
          number: address.number,
          complement: address.complement ?? null,
          neighborhood: address.neighborhood,
          city: address.city,
          state: address.state,
          zipCode: address.zipCode,
          country: address.country,
          isPrimary: address.isPrimary ?? false,
        })) ?? [],
      emailVerification: null,
      emailChangeRequest: null,
      passwordResetRequest: null,
    };

    if (createDto.document) {
      payload.document = createDto.document;
      if (createDto.documentType) {
        payload.documentType = createDto.documentType;
      }
    }

    let user;
    try {
      user = await this.userModel.create(payload);
      
      // If membership info provided, create subscription
      if (createDto.membershipPlanId) {
        const subscription = await this.membershipService.enroll(
          user._id.toString(),
          createDto.membershipPlanId,
          'pix' // Default for admin creation
        );

        if (createDto.isMembershipPayed !== false) {
          await this.membershipService.activateSubscription((subscription as any)._id.toString());
        }
      }
    } catch (dbError) {
      this.logger.error(`Error creating user in DB: ${dbError.message}`, dbError.stack);
      throw dbError;
    }

    // Send welcome email - do not fail creation if email fails
    try {
      const loginUrl = process.env.FRONTEND_URL || 'http://localhost:4200/login';
      await this.notificationsService.sendWelcomeEmail({
        channel: 'email',
        recipient: createDto.email,
        name: createDto.firstName,
        temporaryPassword: isFixedPassword ? undefined : finalPassword,
        loginUrl,
      });
    } catch (emailError) {
      this.logger.error(`Failed to send welcome email to ${createDto.email}: ${emailError.message}`, emailError.stack);
    }

    const response = this.toResponse(user as any);

    await this.activityLogsService.record({
      action: 'user.createAdmin',
      entity: 'user',
      entityId: response.id,
      status: 'success',
      actorUserId: creatorId,
      actorEmail: response.email,
      message: 'Usuario cadastrado via Admin com sucesso',
      flags: ['user', 'create-admin', 'success'],
      metadata: {
        email: response.email,
        document: response.document,
        roleId: createDto.roleId
      },
    });

    return response;
  }

  async findAll(queryDto: ListUsersDto): Promise<PaginatedUsersResponseDto> {
    const { search, role, isActive, page = 1, limit = 10 } = queryDto;
    const skip = (page - 1) * limit;

    const baseQuery: any = { deletedAt: null };

    if (isActive !== undefined) {
      baseQuery.isActive = isActive;
    }

    if (role) {
      if (Types.ObjectId.isValid(role)) {
        baseQuery.roleId = new Types.ObjectId(role);
      } else {
        const roleEntity = await this.rolesService.findByCode(role);
        if (roleEntity) {
          baseQuery.roleId = new Types.ObjectId(roleEntity._id.toString());
        } else {
          // Force empty result if role string is not found
          baseQuery.roleId = new Types.ObjectId();
        }
      }
    }

    if (search) {
       const searchRegex = new RegExp(search, 'i');
       baseQuery.$or = [
         { firstName: searchRegex },
         { lastName: searchRegex },
         { email: searchRegex },
         { document: searchRegex }
       ];
    }

    const [users, total, allRoles] = await Promise.all([
      this.userModel
        .find(baseQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.userModel.countDocuments(baseQuery),
      this.rolesService.findAllActive(),
    ]);

    // Build a lookup map from roleId (string) -> roleCode for O(1) access
    const roleCodeMap = new Map<string, string>(
      allRoles.map((r) => [r.id, r.code]),
    );

    return {
      data: users.map((user) => {
        const response = this.toResponse(user);
        if (user.roleId) {
          (response as any).roleCode = roleCodeMap.get(user.roleId.toString()) ?? undefined;
        }
        return response;
      }),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.getByIdOrFail(id);
    const response = this.toResponse(user);

    // Resolve roleCode from roleId so the frontend guard can validate correctly
    if (user.roleId) {
      try {
        const role = await this.rolesService.findById(user.roleId);
        (response as any).roleCode = role?.code ?? undefined;
      } catch {
        // Role not found - leave roleCode as undefined
      }
    }

    return response;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.getByIdOrFail(id);
    const originalPhones = this.extractPhoneValues(user.contacts);

    if (updateUserDto.email && updateUserDto.email.toLowerCase() !== user.email) {
      try {
        await this.ensureUniqueEmail(updateUserDto.email, id);
      } catch (error) {
        if (error instanceof ConflictException) {
          await this.activityLogsService.record({
            action: 'user.update',
            entity: 'user',
            entityId: id,
            status: 'failure',
            actorUserId: updateUserDto.updatedBy,
            message: 'Tentativa de alteracao para email ja existente',
            flags: ['user', 'update', 'failure', 'duplicate-email', 'email-change-attempt'],
            metadata: {
              from: user.email,
              to: updateUserDto.email.toLowerCase(),
            },
          });
        }

        throw error;
      }
    }

    if (updateUserDto.document && updateUserDto.document !== user.document) {
      try {
        await this.ensureUniqueDocument(updateUserDto.document, id);
      } catch (error) {
        if (error instanceof ConflictException) {
          await this.activityLogsService.record({
            action: 'user.update',
            entity: 'user',
            entityId: id,
            status: 'failure',
            actorUserId: updateUserDto.updatedBy,
            message: 'Tentativa de alteracao para documento ja existente',
            flags: ['user', 'update', 'failure', 'duplicate-document', 'document-change-attempt'],
            metadata: {
              from: user.document,
              to: updateUserDto.document,
            },
          });
        }

        throw error;
      }
    }

    const shouldUpdatePassword = Boolean(updateUserDto.password);
    user.firstName = updateUserDto.firstName ?? user.firstName;
    user.lastName = updateUserDto.lastName ?? user.lastName;
    user.email = updateUserDto.email?.toLowerCase() ?? user.email;
    user.document = updateUserDto.document ?? user.document;
    user.documentType = updateUserDto.documentType ?? user.documentType;
    user.roleId = this.toObjectIdOrNull(updateUserDto.roleId) ?? user.roleId;
    user.photoUrl = updateUserDto.photoUrl ?? user.photoUrl;
    user.isActive = updateUserDto.isActive ?? user.isActive;
    user.emailVerified = updateUserDto.emailVerified ?? user.emailVerified;
    user.status = this.resolveStatus(user.isActive, user.emailVerified);
    user.updatedBy = this.toObjectIdOrNull(updateUserDto.updatedBy) ?? user.updatedBy;

    if (updateUserDto.contacts) {
      const normalizedContacts = this.normalizeContacts(updateUserDto.contacts);
      try {
        await this.ensureUniquePhoneContacts(normalizedContacts, id);
      } catch (error) {
        if (error instanceof ConflictException) {
          await this.activityLogsService.record({
            action: 'user.update',
            entity: 'user',
            entityId: id,
            status: 'failure',
            actorUserId: updateUserDto.updatedBy,
            message: 'Tentativa de alteracao para telefone ja existente',
            flags: ['user', 'update', 'failure', 'duplicate-phone', 'phone-change-attempt'],
            metadata: {
              from: originalPhones,
              to: this.extractPhoneValues(normalizedContacts),
            },
          });
        }

        throw error;
      }

      user.contacts = normalizedContacts;
    }

    if (updateUserDto.addresses) {
      user.addresses = updateUserDto.addresses.map((address) => ({
        type: address.type,
        street: address.street,
        number: address.number,
        complement: address.complement ?? null,
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        country: address.country,
        isPrimary: address.isPrimary ?? false,
      }));
    }

    if (shouldUpdatePassword) {
      user.passwordHistory = this.pushPasswordHistoryEntry(user.passwordHistory, user.password);
      user.password = await hash(updateUserDto.password!, 10);
      user.passwordUpdatedAt = new Date();
    }

    user.updatedAt = new Date();
    await this.userModel.updateOne({ _id: user._id }, user).exec();

    const response = this.toResponse(user);

    await this.activityLogsService.record({
      action: 'user.update',
      entity: 'user',
      entityId: response.id,
      status: 'success',
      actorUserId: updateUserDto.updatedBy,
      actorEmail: response.email,
      message: 'Usuario atualizado com sucesso',
      flags: ['user', 'update', 'success'],
      metadata: {
        email: response.email,
        document: response.document,
        phones: this.extractPhoneValues(response.contacts),
      },
    });

    return response;
  }

  async updateRoleToSocio(userId: string): Promise<void> {
    const role = await this.rolesService.findByCode('socio');
    if (!role) {
      throw new NotFoundException('Role "socio" não encontrada');
    }

    await this.userModel.updateOne(
      { _id: this.parseObjectId(userId) },
      { $set: { roleId: role._id } },
    ).exec();

    await this.activityLogsService.record({
      action: 'user.role-update',
      entity: 'user',
      entityId: userId,
      status: 'success',
      message: 'Usuario promovido a Socio',
      flags: ['user', 'role-update', 'socio', 'success'],
    });
  }

  async softDelete(id: string, deletedBy?: string): Promise<void> {
    if (deletedBy) {
      await this.assertCanUpdateTargetUser(deletedBy, id);
    }
    const user = await this.getByIdOrFail(id);
    const deletedByObjectId = this.toObjectIdOrNull(deletedBy);
    const now = new Date();

    await this.userModel
      .updateOne(
        { _id: user._id, deletedAt: null },
        {
          $set: {
            deletedAt: now,
            deletedBy: deletedByObjectId,
            updatedAt: now,
            updatedBy: deletedByObjectId,
            isActive: false,
            status: 'blocked',
          },
        },
      )
      .exec();

    await this.activityLogsService.record({
      action: 'user.soft-delete',
      entity: 'user',
      entityId: user._id.toString(),
      status: 'success',
      actorUserId: deletedBy,
      actorEmail: user.email,
      message: 'Usuario marcado como deletado',
      flags: ['user', 'soft-delete', 'success'],
      metadata: {
        deletedAt: now,
      },
    });
  }

  async hardDelete(id: string, deletedBy?: string): Promise<void> {
    const user = await this.getByIdOrFail(id);

    if (user.photoStorageKey) {
      await this.uploadsService.deleteFileByKey(user.photoStorageKey);
    }

    await this.userModel.deleteOne({ _id: user._id }).exec();

    await this.activityLogsService.record({
      action: 'user.hard-delete',
      entity: 'user',
      entityId: user._id.toString(),
      status: 'success',
      actorUserId: deletedBy,
      actorEmail: user.email,
      message: 'Usuario e seus dados removidos permanentemente (Hard Delete)',
      flags: ['user', 'hard-delete', 'success'],
    });
  }

  async forceLogout(id: string, actorUserId: string): Promise<void> {
    await this.assertCanUpdateTargetUser(actorUserId, id);
    const user = await this.getByIdOrFail(id);
    const now = new Date();

    await this.userModel
      .updateOne(
        { _id: user._id },
        {
          $set: {
            refreshTokenHash: null,
            updatedAt: now,
            updatedBy: this.toObjectIdOrNull(actorUserId),
          },
        },
      )
      .exec();

    await this.activityLogsService.record({
      action: 'user.force-logout',
      entity: 'user',
      entityId: user._id.toString(),
      status: 'success',
      actorUserId,
      actorEmail: user.email,
      message: 'Sessoes do usuario encerradas forcadamente pelo administrador',
      flags: ['user', 'force-logout', 'admin', 'success'],
    });
  }

  async suspend(id: string, reason: string, actorUserId: string): Promise<UserResponseDto> {
    await this.assertCanUpdateTargetUser(actorUserId, id);
    const user = await this.userModel.findById(this.parseObjectId(id)).lean();

    if (!user) {
      throw new NotFoundException(`Usuario com id ${id} nao encontrado`);
    }

    const now = new Date();
    await this.userModel
      .updateOne(
        { _id: user._id },
        {
          $set: {
            isActive: false,
            status: 'suspended',
            statusReason: reason,
            updatedAt: now,
            updatedBy: this.toObjectIdOrNull(actorUserId),
          },
        },
      )
      .exec();

    await this.activityLogsService.record({
      action: 'user.suspend',
      entity: 'user',
      entityId: user._id.toString(),
      status: 'success',
      actorUserId,
      actorEmail: user.email,
      message: `Usuario suspenso com motivo: ${reason}`,
      flags: ['user', 'suspend', 'admin', 'success'],
    });

    const updatedUser = await this.userModel.findById(user._id).lean();
    return this.toResponse(updatedUser as any);
  }

  async reactivate(id: string, requestContext?: RequestContext): Promise<UserResponseDto> {
    const user = await this.userModel.findById(this.parseObjectId(id)).lean();

    if (!user) {
      throw new NotFoundException(`Usuario com id ${id} nao encontrado`);
    }

    const now = new Date();
    await this.userModel
      .updateOne(
        { _id: user._id },
        {
          $set: {
            deletedAt: null,
            deletedBy: null,
            updatedAt: now,
            isActive: true,
            status: 'active',
          },
        },
      )
      .exec();

    await this.activityLogsService.record({
      action: 'user.reactivate',
      entity: 'user',
      entityId: user._id.toString(),
      status: 'success',
      message: 'Usuario reativado pelo administrador',
      flags: ['user', 'reactivate', 'success'],
      ipAddress: requestContext?.ipAddress,
      userAgent: requestContext?.userAgent,
      correlationId: requestContext?.correlationId,
    });

    // Bring user fresh from DB
    const reactivatedUser = await this.getByIdOrFail(id);
    return this.toResponse(reactivatedUser);
  }

  async validateCredentials(
    email: string,
    password: string,
  ): Promise<UserResponseDto | null> {
    const user = await this.userModel
      .findOne({ email: email.toLowerCase(), deletedAt: null })
      .select('+password')
      .lean();

    if (!user) {
      return null;
    }

    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    await this.userModel
      .updateOne(
        { _id: user._id },
        {
          $set: {
            lastLoginAt: new Date(),
            failedLoginAttempts: 0,
            loginBlockedUntil: null,
          },
        },
      )
      .exec();

    return this.toResponse({
      ...user,
      lastLoginAt: new Date(),
      failedLoginAttempts: 0,
      loginBlockedUntil: null,
    });
  }

  async ensureLoginNotBlocked(email: string): Promise<void> {
    const normalizedEmail = email.toLowerCase();
    const user = await this.userModel
      .findOne({ email: normalizedEmail, deletedAt: null })
      .lean();

    if (!user?.loginBlockedUntil) {
      return;
    }

    if (user.loginBlockedUntil.getTime() > Date.now()) {
      throw new UnauthorizedException('Muitas tentativas invalidas. Tente novamente em alguns minutos');
    }
  }

  async registerFailedLoginAttempt(email: string): Promise<void> {
    const normalizedEmail = email.toLowerCase();
    const user = await this.userModel
      .findOne({ email: normalizedEmail, deletedAt: null })
      .lean();

    if (!user) {
      return;
    }

    const attempts = (user.failedLoginAttempts ?? 0) + 1;
    const shouldBlock = attempts >= UsersService.MAX_FAILED_LOGIN_ATTEMPTS;
    const loginBlockedUntil = shouldBlock
      ? new Date(Date.now() + UsersService.LOGIN_LOCK_MINUTES * 60 * 1000)
      : null;

    await this.userModel
      .updateOne(
        { _id: user._id },
        {
          $set: {
            failedLoginAttempts: shouldBlock ? 0 : attempts,
            loginBlockedUntil,
            updatedAt: new Date(),
          },
        },
      )
      .exec();
  }

  async issueEmailVerificationCode(userId: string): Promise<{ email: string; expiresAt: Date }> {
    const user = await this.getByIdOrFail(userId);
    const generatedCode = this.verificationCodesService.generateCode(
      UsersService.EMAIL_CODE_EXPIRATION_HOURS,
    );
    const now = new Date();

    await this.userModel
      .updateOne(
        { _id: user._id },
        {
          $set: {
            emailVerification: {
              codeHash: generatedCode.codeHash,
              expiresAt: generatedCode.expiresAt,
              lastSentAt: now,
              attempts: 0,
            },
            status: 'pending',
            emailVerified: false,
            updatedAt: now,
          },
        },
      )
      .exec();

    await this.notificationsService.sendVerificationCode({
      channel: 'email',
      recipient: user.email,
      code: generatedCode.code,
      purpose: 'email-verification',
      expiresInHours: UsersService.EMAIL_CODE_EXPIRATION_HOURS,
    });

    return { email: user.email, expiresAt: generatedCode.expiresAt };
  }

  async resendEmailVerificationCode(email: string): Promise<{ email: string; expiresAt: Date }> {
    const normalizedEmail = email.toLowerCase();
    const user = await this.userModel.findOne({ email: normalizedEmail, deletedAt: null }).lean();

    if (!user) {
      return {
        email: normalizedEmail,
        expiresAt: this.verificationCodesService.buildExpirationDate(
          UsersService.EMAIL_CODE_EXPIRATION_HOURS,
        ),
      };
    }

    if (user.emailVerified && user.status === 'active') {
      return {
        email: user.email,
        expiresAt: this.verificationCodesService.buildExpirationDate(
          UsersService.EMAIL_CODE_EXPIRATION_HOURS,
        ),
      };
    }

    return this.issueEmailVerificationCode(user._id.toString());
  }

  async verifyEmailCode(email: string, code: string): Promise<UserResponseDto> {
    const normalizedEmail = email.toLowerCase();
    const user = await this.userModel.findOne({ email: normalizedEmail, deletedAt: null }).lean();

    if (!user) {
      throw new NotFoundException('Usuario nao encontrado para verificacao');
    }

    const verification = user.emailVerification;
    if (!verification?.codeHash || !verification.expiresAt) {
      throw new BadRequestException('Nao existe codigo de verificacao pendente');
    }

    if (verification.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Codigo expirado');
    }

    const providedHash = this.verificationCodesService.hashCode(code);
    if (providedHash !== verification.codeHash) {
      await this.userModel
        .updateOne(
          { _id: user._id },
          {
            $set: {
              'emailVerification.attempts': (verification.attempts ?? 0) + 1,
              updatedAt: new Date(),
            },
          },
        )
        .exec();

      throw new BadRequestException('Codigo invalido');
    }

    const now = new Date();
    await this.userModel
      .updateOne(
        { _id: user._id },
        {
          $set: {
            emailVerified: true,
            status: 'active',
            emailVerification: null,
            updatedAt: now,
          },
        },
      )
      .exec();

    return this.findOne(user._id.toString());
  }

  async requestOwnEmailChange(userId: string, newEmail: string): Promise<{ expiresAt: Date }> {
    const user = await this.getByIdOrFail(userId);
    const normalizedEmail = newEmail.toLowerCase();

    if (normalizedEmail === user.email) {
      throw new BadRequestException('Novo email deve ser diferente do email atual');
    }

    await this.ensureUniqueEmail(normalizedEmail, userId);

    const generatedCode = this.verificationCodesService.generateCode(
      UsersService.EMAIL_CODE_EXPIRATION_HOURS,
    );
    const now = new Date();

    await this.userModel
      .updateOne(
        { _id: user._id },
        {
          $set: {
            emailChangeRequest: {
              newEmail: normalizedEmail,
              codeHash: generatedCode.codeHash,
              expiresAt: generatedCode.expiresAt,
              lastSentAt: now,
              attempts: 0,
            },
            updatedAt: now,
          },
        },
      )
      .exec();

    await this.notificationsService.sendVerificationCode({
      channel: 'email',
      recipient: normalizedEmail,
      code: generatedCode.code,
      purpose: 'email-change-confirmation',
      expiresInHours: UsersService.EMAIL_CODE_EXPIRATION_HOURS,
    });

    return { expiresAt: generatedCode.expiresAt };
  }

  async confirmOwnEmailChange(userId: string, code: string): Promise<UserResponseDto> {
    const user = await this.getByIdOrFail(userId);
    const request = user.emailChangeRequest;

    if (!request?.newEmail || !request.codeHash || !request.expiresAt) {
      throw new BadRequestException('Nao existe solicitacao de troca de email pendente');
    }

    if (request.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Codigo expirado');
    }

    const providedHash = this.verificationCodesService.hashCode(code);
    if (providedHash !== request.codeHash) {
      await this.userModel
        .updateOne(
          { _id: user._id },
          {
            $set: {
              'emailChangeRequest.attempts': (request.attempts ?? 0) + 1,
              updatedAt: new Date(),
            },
          },
        )
        .exec();

      throw new BadRequestException('Codigo invalido');
    }

    await this.ensureUniqueEmail(request.newEmail, userId);

    const now = new Date();
    await this.userModel
      .updateOne(
        { _id: user._id },
        {
          $set: {
            email: request.newEmail,
            emailVerified: true,
            status: 'active',
            emailChangeRequest: null,
            updatedAt: now,
          },
        },
      )
      .exec();

    return this.findOne(userId);
  }

  async requestOwnPhoneVerification(
    userId: string,
    phone: string,
    channel: 'sms' | 'whatsapp',
  ): Promise<{ expiresAt: Date }> {
    const user = await this.getByIdOrFail(userId);
    const normalizedPhone = this.normalizePhoneValue(phone);

    const hasPhoneInContacts = (user.contacts ?? []).some(
      (contact) =>
        this.isPhoneType(contact.type) && this.normalizePhoneValue(contact.value) === normalizedPhone,
    );

    if (!hasPhoneInContacts) {
      throw new BadRequestException('Telefone informado nao pertence aos contatos do usuario');
    }

    const generatedCode = this.verificationCodesService.generateCode(
      UsersService.PHONE_CODE_EXPIRATION_HOURS,
    );
    const now = new Date();

    await this.userModel
      .updateOne(
        { _id: user._id },
        {
          $set: {
            phoneVerification: {
              phone: normalizedPhone,
              channel,
              codeHash: generatedCode.codeHash,
              expiresAt: generatedCode.expiresAt,
              lastSentAt: now,
              attempts: 0,
            },
            updatedAt: now,
          },
        },
      )
      .exec();

    await this.notificationsService.sendVerificationCode({
      channel,
      recipient: normalizedPhone,
      code: generatedCode.code,
      purpose: 'phone-verification',
      expiresInHours: UsersService.PHONE_CODE_EXPIRATION_HOURS,
    });

    return { expiresAt: generatedCode.expiresAt };
  }

  async confirmOwnPhoneVerification(userId: string, code: string): Promise<UserResponseDto> {
    const user = await this.getByIdOrFail(userId);
    const verification = user.phoneVerification;

    if (!verification?.phone || !verification.codeHash || !verification.expiresAt) {
      throw new BadRequestException('Nao existe solicitacao de verificacao de telefone pendente');
    }

    if (verification.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Codigo expirado');
    }

    const providedHash = this.verificationCodesService.hashCode(code);
    if (providedHash !== verification.codeHash) {
      await this.userModel
        .updateOne(
          { _id: user._id },
          {
            $set: {
              'phoneVerification.attempts': (verification.attempts ?? 0) + 1,
              updatedAt: new Date(),
            },
          },
        )
        .exec();

      throw new BadRequestException('Codigo invalido');
    }

    const now = new Date();
    const updatedContacts = (user.contacts ?? []).map((contact) => {
      if (!this.isPhoneType(contact.type)) {
        return contact;
      }

      const normalizedContact = this.normalizePhoneValue(contact.value);
      if (normalizedContact !== verification.phone) {
        return contact;
      }

      return {
        ...contact,
        value: normalizedContact,
        verifiedAt: now,
      };
    });

    await this.userModel
      .updateOne(
        { _id: user._id },
        {
          $set: {
            contacts: updatedContacts,
            phoneVerification: null,
            updatedAt: now,
          },
        },
      )
      .exec();

    return this.findOne(userId);
  }

  async uploadOwnPhoto(
    userId: string,
    file?: {
      buffer: Buffer;
      mimetype: string;
      originalname: string;
      size: number;
    },
    requestContext?: RequestContext,
  ): Promise<UserResponseDto> {
    const user = await this.getByIdOrFail(userId);
    const uploadResult = await this.uploadsService.uploadImageForEntity({
      entity: 'users',
      entityId: user._id.toString(),
      file,
    });

    const previousPhotoStorageKey = user.photoStorageKey ?? null;

    const now = new Date();
    await this.userModel
      .updateOne(
        { _id: user._id },
        {
          $set: {
            photoUrl: uploadResult.url,
            photoStorageKey: uploadResult.key,
            updatedAt: now,
            updatedBy: user._id,
          },
        },
      )
      .exec();

    if (previousPhotoStorageKey) {
      await this.uploadsService.deleteFileByKey(previousPhotoStorageKey);
    }

    await this.activityLogsService.record({
      action: 'user.photo.update',
      entity: 'user',
      entityId: user._id.toString(),
      status: 'success',
      actorUserId: user._id.toString(),
      actorEmail: user.email,
      message: 'Foto de perfil atualizada',
      flags: ['user', 'photo', 'update', 'success'],
      metadata: {
        storageKey: uploadResult.key,
        contentType: uploadResult.contentType,
        size: uploadResult.size,
      },
      ipAddress: requestContext?.ipAddress,
      userAgent: requestContext?.userAgent,
      correlationId: requestContext?.correlationId,
    });

    return this.findOne(userId);
  }

  async uploadUserPhotoByAdmin(
    targetUserId: string,
    actorUserId: string,
    file?: {
      buffer: Buffer;
      mimetype: string;
      originalname: string;
      size: number;
    },
    requestContext?: RequestContext,
  ): Promise<UserResponseDto> {
    const user = await this.getByIdOrFail(targetUserId);
    const uploadResult = await this.uploadsService.uploadImageForEntity({
      entity: 'users',
      entityId: user._id.toString(),
      file,
    });

    const previousPhotoStorageKey = user.photoStorageKey ?? null;

    const now = new Date();
    await this.userModel
      .updateOne(
        { _id: user._id },
        {
          $set: {
            photoUrl: uploadResult.url,
            photoStorageKey: uploadResult.key,
            updatedAt: now,
            updatedBy: this.toObjectIdOrNull(actorUserId),
          },
        },
      )
      .exec();

    if (previousPhotoStorageKey) {
      await this.uploadsService.deleteFileByKey(previousPhotoStorageKey);
    }

    await this.activityLogsService.record({
      action: 'user.photo.update',
      entity: 'user',
      entityId: user._id.toString(),
      status: 'success',
      actorUserId,
      actorEmail: user.email,
      message: 'Foto de perfil atualizada pelo administrador',
      flags: ['user', 'photo', 'update', 'admin', 'success'],
      metadata: {
        storageKey: uploadResult.key,
        contentType: uploadResult.contentType,
        size: uploadResult.size,
      },
      ipAddress: requestContext?.ipAddress,
      userAgent: requestContext?.userAgent,
      correlationId: requestContext?.correlationId,
    });

    return this.findOne(targetUserId);
  }

  async removeOwnPhoto(userId: string, requestContext?: RequestContext): Promise<UserResponseDto> {
    const user = await this.getByIdOrFail(userId);

    if (!user.photoUrl && !user.photoStorageKey) {
      return this.findOne(userId);
    }

    await this.uploadsService.deleteFileByKey(user.photoStorageKey);

    const now = new Date();
    await this.userModel
      .updateOne(
        { _id: user._id },
        {
          $set: {
            photoUrl: null,
            photoStorageKey: null,
            updatedAt: now,
            updatedBy: user._id,
          },
        },
      )
      .exec();

    await this.activityLogsService.record({
      action: 'user.photo.remove',
      entity: 'user',
      entityId: user._id.toString(),
      status: 'success',
      actorUserId: user._id.toString(),
      actorEmail: user.email,
      message: 'Foto de perfil removida',
      flags: ['user', 'photo', 'remove', 'success'],
      metadata: {
        previousStorageKey: user.photoStorageKey,
      },
      ipAddress: requestContext?.ipAddress,
      userAgent: requestContext?.userAgent,
      correlationId: requestContext?.correlationId,
    });

    return this.findOne(userId);
  }

  async changeOwnPassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    requestContext?: RequestContext,
  ): Promise<void> {
    const user = await this.userModel
      .findOne({ _id: this.parseObjectId(userId), deletedAt: null })
      .select('+password +passwordHistory')
      .lean();

    if (!user) {
      throw new NotFoundException(`Usuario com id ${userId} nao encontrado`);
    }

    const isCurrentPasswordValid = await compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Senha atual invalida');
    }

    await this.assertPasswordNotRecentlyUsed(newPassword, user.password, user.passwordHistory);

    const now = new Date();
    const newPasswordHash = await hash(newPassword, 10);
    const newPasswordHistory = this.pushPasswordHistoryEntry(user.passwordHistory, user.password);

    await this.userModel
      .updateOne(
        { _id: user._id },
        {
          $set: {
            password: newPasswordHash,
            passwordUpdatedAt: now,
            passwordHistory: newPasswordHistory,
            refreshTokenHash: null,
            refreshTokenExpiresAt: null,
            updatedAt: now,
            updatedBy: user._id,
          },
        },
      )
      .exec();

    await this.activityLogsService.record({
      action: 'user.password.change',
      entity: 'user',
      entityId: user._id.toString(),
      status: 'success',
      actorUserId: user._id.toString(),
      actorEmail: user.email,
      message: 'Senha alterada pelo proprio usuario',
      flags: ['user', 'password', 'change', 'success'],
      ipAddress: requestContext?.ipAddress,
      userAgent: requestContext?.userAgent,
      correlationId: requestContext?.correlationId,
    });
  }

  async issuePasswordResetCode(email: string): Promise<void> {
    const normalizedEmail = email.toLowerCase();
    const user = await this.userModel.findOne({ email: normalizedEmail, deletedAt: null }).lean();

    if (!user || !user.isActive || user.status === 'blocked') {
      return;
    }

    const generatedCode = this.verificationCodesService.generateCode(
      UsersService.PASSWORD_RESET_CODE_EXPIRATION_HOURS,
    );
    const now = new Date();

    await this.userModel
      .updateOne(
        { _id: user._id },
        {
          $set: {
            passwordResetRequest: {
              codeHash: generatedCode.codeHash,
              expiresAt: generatedCode.expiresAt,
              lastSentAt: now,
              attempts: 0,
            },
            updatedAt: now,
          },
        },
      )
      .exec();

    await this.notificationsService.sendVerificationCode({
      channel: 'email',
      recipient: user.email,
      code: generatedCode.code,
      purpose: 'password-reset',
      expiresInHours: UsersService.PASSWORD_RESET_CODE_EXPIRATION_HOURS,
    });
  }

  async confirmPasswordReset(email: string, code: string, newPassword: string): Promise<void> {
    const normalizedEmail = email.toLowerCase();
    const user = await this.userModel
      .findOne({ email: normalizedEmail, deletedAt: null })
      .select('+password +passwordHistory')
      .lean();

    if (!user) {
      throw new NotFoundException('Usuario nao encontrado para redefinicao de senha');
    }

    const request = user.passwordResetRequest;
    if (!request?.codeHash || !request.expiresAt) {
      throw new BadRequestException('Nao existe solicitacao de redefinicao de senha pendente');
    }

    if (request.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Codigo expirado');
    }

    const providedHash = this.verificationCodesService.hashCode(code);
    if (providedHash !== request.codeHash) {
      await this.userModel
        .updateOne(
          { _id: user._id },
          {
            $set: {
              'passwordResetRequest.attempts': (request.attempts ?? 0) + 1,
              updatedAt: new Date(),
            },
          },
        )
        .exec();

      throw new BadRequestException('Codigo invalido');
    }

    await this.assertPasswordNotRecentlyUsed(newPassword, user.password, user.passwordHistory);

    const now = new Date();
    const newPasswordHash = await hash(newPassword, 10);
    const newPasswordHistory = this.pushPasswordHistoryEntry(user.passwordHistory, user.password);

    await this.userModel
      .updateOne(
        { _id: user._id },
        {
          $set: {
            password: newPasswordHash,
            passwordUpdatedAt: now,
            passwordHistory: newPasswordHistory,
            passwordResetRequest: null,
            refreshTokenHash: null,
            refreshTokenExpiresAt: null,
            updatedAt: now,
          },
        },
      )
      .exec();
  }

  async storeRefreshToken(userId: string, refreshToken: string, expiresAt: Date): Promise<void> {
    const refreshTokenHash = await hash(refreshToken, 10);
    const userObjectId = this.parseObjectId(userId);

    await this.userModel
      .updateOne(
        { _id: userObjectId, deletedAt: null },
        {
          $set: {
            refreshTokenHash,
            refreshTokenExpiresAt: expiresAt,
            updatedAt: new Date(),
          },
        },
      )
      .exec();
  }

  async verifyStoredRefreshToken(userId: string, refreshToken: string): Promise<boolean> {
    const user = await this.userModel
      .findOne({ _id: this.parseObjectId(userId), deletedAt: null })
      .select('+refreshTokenHash +refreshTokenExpiresAt')
      .lean();

    if (!user?.refreshTokenHash || !user.refreshTokenExpiresAt) {
      return false;
    }

    if (user.refreshTokenExpiresAt.getTime() < Date.now()) {
      return false;
    }

    return compare(refreshToken, user.refreshTokenHash);
  }

  async clearStoredRefreshToken(userId: string): Promise<void> {
    await this.userModel
      .updateOne(
        { _id: this.parseObjectId(userId), deletedAt: null },
        {
          $set: {
            refreshTokenHash: null,
            refreshTokenExpiresAt: null,
            updatedAt: new Date(),
          },
        },
      )
      .exec();
  }

  private async getByIdOrFail(id: string): Promise<UserEntity> {
    const objectId = this.parseObjectId(id);
    const user = await this.userModel.findOne({ _id: objectId, deletedAt: null }).lean();

    if (!user) {
      throw new NotFoundException(`Usuario com id ${id} nao encontrado`);
    }

    return user;
  }

  private async ensureUniqueEmail(email: string, currentUserId?: string): Promise<void> {
    const emailInUse = await this.userModel.exists({
      email: email.toLowerCase(),
      _id: currentUserId ? { $ne: this.parseObjectId(currentUserId) } : { $exists: true },
      deletedAt: null,
    });

    if (emailInUse) {
      throw new ConflictException('Email ja esta em uso');
    }
  }

  private async ensureUniqueDocument(
    document?: string,
    currentUserId?: string,
  ): Promise<void> {
    if (!document) {
      return;
    }

    const documentInUse = await this.userModel.exists({
      document,
      _id: currentUserId ? { $ne: this.parseObjectId(currentUserId) } : { $exists: true },
      deletedAt: null,
    });

    if (documentInUse) {
      throw new ConflictException('Documento ja esta em uso');
    }
  }

  private async ensureUniquePhoneContacts(
    contacts?: UserEntity['contacts'],
    currentUserId?: string,
  ): Promise<void> {
    const phoneValues = (contacts ?? [])
      .filter((contact) => this.isPhoneType(contact.type))
      .map((contact) => contact.value)
      .filter((value): value is string => Boolean(value));

    if (!phoneValues.length) {
      return;
    }

    const inUse = await this.userModel.exists({
      deletedAt: null,
      _id: currentUserId ? { $ne: this.parseObjectId(currentUserId) } : { $exists: true },
      contacts: {
        $elemMatch: {
          type: { $in: UsersService.PHONE_CONTACT_TYPES },
          value: { $in: phoneValues },
        },
      },
    });

    if (inUse) {
      throw new ConflictException('Telefone ja esta em uso');
    }
  }

  private parseObjectId(id: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Id de usuario invalido');
    }

    return new Types.ObjectId(id);
  }

  private toObjectIdOrNull(id?: string): Types.ObjectId | null {
    if (!id) {
      return null;
    }

    return this.parseObjectId(id);
  }

  private normalizeContacts(
    contacts?: Array<{
      type: string;
      value: string;
      isPrimary?: boolean;
      verifiedAt?: string | Date | null;
    }>,
  ): UserEntity['contacts'] {
    return (
      contacts?.map((contact) => {
        const normalizedType = contact.type.trim().toLowerCase();
        const normalizedValue = this.isPhoneType(normalizedType)
          ? contact.value.replace(/\D/g, '')
          : contact.value.trim();

        return {
          type: normalizedType,
          value: normalizedValue,
          isPrimary: contact.isPrimary ?? false,
          verifiedAt: contact.verifiedAt ? new Date(contact.verifiedAt) : null,
        };
      }) ?? []
    );
  }

  private isPhoneType(type: string): boolean {
    return UsersService.PHONE_CONTACT_TYPES.includes(type.toLowerCase());
  }

  private normalizePhoneValue(value: string): string {
    const normalized = value.replace(/\D/g, '');

    if (normalized.length < 10 || normalized.length > 15) {
      throw new BadRequestException('telefone invalido. Use apenas numeros com DDI opcional');
    }

    return normalized;
  }

  private extractPhoneValues(
    contacts?: Array<{
      type: string;
      value: string;
    }>,
  ): string[] {
    return (contacts ?? [])
      .filter((contact) => this.isPhoneType(contact.type))
      .map((contact) => contact.value);
  }

  private resolveStatus(isActive: boolean, emailVerified: boolean): UserEntity['status'] {
    if (!isActive) {
      return 'blocked';
    }

    if (!emailVerified) {
      return 'pending';
    }

    return 'active';
  }

  private pushPasswordHistoryEntry(
    history: Array<{ hash: string; changedAt: Date }> | undefined,
    currentPasswordHash: string,
  ): Array<{ hash: string; changedAt: Date }> {
    const now = new Date();
    const nextHistory = [...(history ?? []), { hash: currentPasswordHash, changedAt: now }];

    if (nextHistory.length <= UsersService.PASSWORD_HISTORY_LIMIT) {
      return nextHistory;
    }

    return nextHistory.slice(nextHistory.length - UsersService.PASSWORD_HISTORY_LIMIT);
  }

  private async assertPasswordNotRecentlyUsed(
    newPassword: string,
    currentPasswordHash: string,
    history?: Array<{ hash: string; changedAt: Date }>,
  ): Promise<void> {
    const matchesCurrent = await compare(newPassword, currentPasswordHash);
    if (matchesCurrent) {
      throw new BadRequestException('Nova senha deve ser diferente da senha atual');
    }

    for (const item of history ?? []) {
      const matchesHistory = await compare(newPassword, item.hash);
      if (matchesHistory) {
        throw new BadRequestException('Nova senha nao pode repetir as ultimas senhas usadas');
      }
    }
  }

  private toResponse(user: UserEntity): UserResponseDto {
    return {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      document: user.document,
      documentType: user.documentType,
      roleId: user.roleId?.toString(),
      photoUrl: user.photoUrl ?? undefined,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      status: user.status,
      lastLoginAt: user.lastLoginAt ?? undefined,
      passwordUpdatedAt: user.passwordUpdatedAt ?? undefined,
      createdAt: user.createdAt,
      createdBy: user.createdBy?.toString(),
      updatedAt: user.updatedAt,
      updatedBy: user.updatedBy?.toString(),
      deletedAt: user.deletedAt ?? undefined,
      deletedBy: user.deletedBy?.toString(),
      contacts:
        user.contacts?.map((contact) => ({
          type: contact.type,
          value: contact.value,
          isPrimary: contact.isPrimary,
          verifiedAt: contact.verifiedAt ?? undefined,
        })) ?? [],
      addresses:
        user.addresses?.map((address) => ({
          type: address.type,
          street: address.street,
          number: address.number,
          complement: address.complement ?? undefined,
          neighborhood: address.neighborhood,
          city: address.city,
          state: address.state,
          zipCode: address.zipCode,
          country: address.country,
          isPrimary: address.isPrimary,
        })) ?? [],
    };
  }
}
