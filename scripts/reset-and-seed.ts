import { hash } from 'bcryptjs';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import mongoose from 'mongoose';
import { RoleEntity, RoleSchema } from '../src/roles/entities/role.entity';
import { UserEntity, UserSchema } from '../src/users/entities/user.entity';

interface SeedRole {
  code: 'owner' | 'admin' | 'editor' | 'socio' | 'user';
  name: string;
  level: number;
}

const DEFAULT_URI = 'mongodb://127.0.0.1:27017/back-pelotas';

const rolesToSeed: SeedRole[] = [
  { code: 'owner', name: 'Owner', level: 97 },
  { code: 'admin', name: 'Admin', level: 61 },
  { code: 'editor', name: 'Editor', level: 29 },
  { code: 'socio', name: 'Socio', level: 13 },
  { code: 'user', name: 'User', level: 7 },
];

function loadEnvFromFileIfNeeded(): void {
  if (process.env.MONGODB_URI) {
    return;
  }

  const envPath = resolve(process.cwd(), '.env');
  if (!existsSync(envPath)) {
    return;
  }

  const content = readFileSync(envPath, 'utf8');
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function buildDocumentForRole(index: number): string {
  return `1000000000${index + 1}`;
}

async function main(): Promise<void> {
  loadEnvFromFileIfNeeded();

  const mongoUri = process.env.MONGODB_URI ?? DEFAULT_URI;
  await mongoose.connect(mongoUri);

  const roleModel = mongoose.model(RoleEntity.name, RoleSchema);
  const userModel = mongoose.model(UserEntity.name, UserSchema);

  await mongoose.connection.db?.dropDatabase();

  const createdRoles = await roleModel.insertMany(
    rolesToSeed.map((role) => ({
      code: role.code,
      name: role.name,
      level: role.level,
      isActive: true,
    })),
  );

  const roleByCode = new Map(createdRoles.map((role) => [role.code, role]));
  const now = new Date();
  const passwordHash = await hash('123456', 10);

  const usersToSeed = rolesToSeed.map((role, index) => ({
    firstName: role.name,
    lastName: 'System',
    email: `${role.code}@pelotas.com.br`,
    password: passwordHash,
    document: buildDocumentForRole(index),
    documentType: 'cpf',
    roleId: roleByCode.get(role.code)?._id,
    isActive: true,
    emailVerified: true,
    status: 'active',
    passwordUpdatedAt: now,
    contacts: [
      {
        type: index % 2 === 0 ? 'whatsapp' : 'celular',
        value: `5399999999${index}`,
        isPrimary: true,
        verifiedAt: now,
      }
    ],
    addresses: [
      {
        type: 'home',
        street: 'Rua Lobo da Costa',
        number: `32${index}`,
        neighborhood: 'Centro',
        city: 'Pelotas',
        state: 'RS',
        country: 'Brasil',
        zipCode: '96010150',
        isPrimary: true,
      }
    ],
    emailVerification: null,
    emailChangeRequest: null,
  }));

  const createdUsers = await userModel.insertMany(usersToSeed);

  console.log('Database reset completed.');
  console.log('Seeded roles:', createdRoles.map((role) => role.code).join(', '));
  console.log('Seeded users:');
  createdUsers.forEach((user) => {
    console.log(`- ${user.email} | password: 123456 | roleId: ${user.roleId}`);
  });
}

main()
  .catch((error) => {
    console.error('Failed to reset and seed database.');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
