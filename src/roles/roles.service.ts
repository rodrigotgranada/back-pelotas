import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RoleDocument, RoleEntity } from './entities/role.entity';

interface DefaultRole {
  code: string;
  name: string;
  level: number;
}

@Injectable()
export class RolesService implements OnModuleInit {
  private static readonly DEFAULT_ROLES: DefaultRole[] = [
    { code: 'owner', name: 'Owner', level: 97 },
    { code: 'admin', name: 'Admin', level: 61 },
    { code: 'editor', name: 'Editor', level: 29 },
    { code: 'socio', name: 'Socio', level: 13 },
    { code: 'user', name: 'User', level: 7 },
  ];

  constructor(
    @InjectModel(RoleEntity.name)
    private readonly roleModel: Model<RoleDocument>,
  ) {}

  async onModuleInit(): Promise<void> {
    for (const role of RolesService.DEFAULT_ROLES) {
      await this.roleModel.updateOne(
        { code: role.code },
        {
          $set: {
            name: role.name,
            level: role.level,
            isActive: true,
          },
          $setOnInsert: {
            code: role.code,
          },
        },
        { upsert: true },
      );
    }
  }

  async findById(roleId: Types.ObjectId | string): Promise<RoleEntity | null> {
    const normalizedId = typeof roleId === 'string' ? new Types.ObjectId(roleId) : roleId;

    return this.roleModel
      .findOne({ _id: normalizedId, isActive: true })
      .lean();
  }

  async findByCode(code: string): Promise<RoleEntity | null> {
    return this.roleModel.findOne({ code, isActive: true }).lean();
  }

  async findAllActive(): Promise<Array<{ id: string; code: string; name: string; level: number }>> {
    const roles = await this.roleModel
      .find({ isActive: true })
      .sort({ level: -1, code: 1 })
      .lean();

    return roles.map((role) => ({
      id: role._id.toString(),
      code: role.code,
      name: role.name,
      level: role.level,
    }));
  }
}
