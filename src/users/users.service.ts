import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { compare, hash } from 'bcryptjs';
import { Model, Types } from 'mongoose';
import { ActivityLogsService } from '../logs/activity-logs.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserDocument, UserEntity } from './entities/user.entity';

@Injectable()
export class UsersService {
  private static readonly PHONE_CONTACT_TYPES = ['phone', 'mobile', 'whatsapp'];

  constructor(
    @InjectModel(UserEntity.name)
    private readonly userModel: Model<UserDocument>,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

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

    const user = await this.userModel.create({
      name: createUserDto.name,
      email: createUserDto.email.toLowerCase(),
      document: createUserDto.document,
      documentType: createUserDto.documentType,
      password: hashedPassword,
      roleId: this.toObjectIdOrNull(createUserDto.roleId),
      photoUrl: createUserDto.photoUrl,
      isActive: createUserDto.isActive ?? true,
      emailVerified: createUserDto.emailVerified ?? false,
      passwordUpdatedAt: now,
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
    });

    const response = this.toResponse(user.toObject());

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

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.userModel
      .find({ deletedAt: null })
      .sort({ createdAt: -1 })
      .lean();

    return users.map((user) => this.toResponse(user));
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.getByIdOrFail(id);
    return this.toResponse(user);
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
    user.name = updateUserDto.name ?? user.name;
    user.email = updateUserDto.email?.toLowerCase() ?? user.email;
    user.document = updateUserDto.document ?? user.document;
    user.documentType = updateUserDto.documentType ?? user.documentType;
    user.roleId = this.toObjectIdOrNull(updateUserDto.roleId) ?? user.roleId;
    user.photoUrl = updateUserDto.photoUrl ?? user.photoUrl;
    user.isActive = updateUserDto.isActive ?? user.isActive;
    user.emailVerified = updateUserDto.emailVerified ?? user.emailVerified;
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

  async softDelete(id: string, deletedBy?: string): Promise<void> {
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
      .updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } })
      .exec();

    return this.toResponse({
      ...user,
      lastLoginAt: new Date(),
    });
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

  private toResponse(user: UserEntity): UserResponseDto {
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      document: user.document,
      documentType: user.documentType,
      roleId: user.roleId?.toString(),
      photoUrl: user.photoUrl ?? undefined,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
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
