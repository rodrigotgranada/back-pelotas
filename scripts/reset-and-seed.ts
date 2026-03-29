import { hash } from 'bcryptjs';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import mongoose from 'mongoose';
import { RoleEntity, RoleSchema } from '../src/roles/entities/role.entity';
import { UserEntity, UserSchema } from '../src/users/entities/user.entity';
import { NewsEntity, NewsSchema } from '../src/news/entities/news.entity';
import { SettingEntity, SettingSchema } from '../src/settings/entities/setting.entity';
import { MembershipPlanEntity, MembershipPlanSchema } from '../src/membership/entities/membership-plan.entity';
import { MembershipInterest, MembershipInterestSchema } from '../src/membership/entities/membership-interest.entity';
import { HistoryEntity, HistorySchema } from '../src/history/entities/history.entity';
import { SponsorEntity, SponsorSchema } from '../src/sponsors/entities/sponsor.entity';

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

  // 1. Drop Database
  await mongoose.connection.db?.dropDatabase();

  // 2. Roles
  const roleModel = mongoose.model(RoleEntity.name, RoleSchema);
  const createdRoles = await roleModel.insertMany(
    rolesToSeed.map((role) => ({
      code: role.code,
      name: role.name,
      level: role.level,
      isActive: true,
    })),
  );

  // 3. Users
  const userModel = mongoose.model(UserEntity.name, UserSchema);
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
  const ownerUser = createdUsers.find(u => u.email === 'owner@pelotas.com.br');

  // 4. Settings
  const settingModel = mongoose.model(SettingEntity.name, SettingSchema);
  await settingModel.insertMany([
    { key: 'themePreset', value: 'default' },
    { key: 'isMembershipEnabled', value: 'true' },
    { key: 'isSponsorsEnabled', value: 'true' },
    { key: 'badgeUrl', value: 'http://localhost:4200/placeholder-badge.svg' },
  ]);

  // 5. News
  const newsModel = mongoose.model(NewsEntity.name, NewsSchema);
  const newsToSeed = [
    {
       title: 'O Lobão venceu mais uma',
       slug: 'o-lobao-venceu-mais-uma',
       subtitle: 'Vitória histórica no clássico',
       content: '<p>O Pelotas garantiu mais uma vitória emocionante neste domingo. A torcida lotou a Boca do Lobo e empurrou o time do início ao fim.</p>',
       format: 'HTML',
       status: 'PUBLISHED',
       authorId: ownerUser?._id,
       createdBy: ownerUser?._id,
       updatedBy: ownerUser?._id,
       isFeatured: true,
       publishedAt: now,
       createdAt: now,
       updatedAt: now,
       categories: ['Futebol Profissional'],
       views: 1250,
       coverImageUrl: 'http://localhost:4200/placeholder-cover.svg',
    },
    {
       title: 'Nova Camisa Anunciada',
       slug: 'nova-camisa-anunciada',
       subtitle: 'Confira o novo manto Áureo-Cerúleo para a temporada',
       content: { time: 1700000000000, blocks: [{ id: '1', type: 'paragraph', data: { text: 'A nova camisa já está disponível na loja oficial do clube. Garanta a sua e apoie o time!' } }], version: '2.28.0' },
       format: 'BLOCKS',
       status: 'PUBLISHED',
       authorId: ownerUser?._id,
       createdBy: ownerUser?._id,
       updatedBy: ownerUser?._id,
       isFeatured: false,
       publishedAt: now,
       createdAt: now,
       updatedAt: now,
       categories: ['Institucional'],
       views: 45
    },
    {
       title: 'Rascunho da Entrevista Exclusiva',
       slug: 'rascunho-da-entrevista-exclusiva',
       subtitle: '',
       content: '<p>Revisar este artigo antes de publicarmos na quarta-feira...</p>',
       format: 'HTML',
       status: 'DRAFT',
       authorId: ownerUser?._id,
       createdBy: ownerUser?._id,
       updatedBy: ownerUser?._id,
       isFeatured: false,
       createdAt: now,
       updatedAt: now,
       categories: ['Diretoria'],
       views: 0
    }
  ];
  await newsModel.insertMany(newsToSeed);

  // 6. Sponsors
  const sponsorModel = mongoose.model(SponsorEntity.name, SponsorSchema);
  await sponsorModel.insertMany([
    { name: 'Banrisul', websiteUrl: 'https://banrisul.com.br', logoUrl: 'http://localhost:4200/placeholder-sponsor.svg', order: 1, isActive: true },
    { name: 'Unimed', websiteUrl: 'https://unimed.coop.br', logoUrl: 'http://localhost:4200/placeholder-sponsor.svg', order: 2, isActive: true },
    { name: 'KTO', websiteUrl: 'https://kto.com', logoUrl: 'http://localhost:4200/placeholder-sponsor.svg', order: 3, isActive: true }
  ]);

  // 7. Membership Plan
  const planModel = mongoose.model(MembershipPlanEntity.name, MembershipPlanSchema);
  const plan = await planModel.create({
    name: 'Sócio Lobão Forte', 
    description: 'O plano principal para todos os áureo-cerúleos.',
    slug: 'lobao-forte', 
    price: 49.90, 
    interval: 'monthly',
    benefits: ['Acesso a todos os jogos', 'Desconto na Loja Lobão', 'Carteirinha exclusiva'],
    isActive: true, 
    createdBy: ownerUser?._id, 
    updatedBy: ownerUser?._id
  });

  // 8. Membership Interests
  const interestModel = mongoose.model(MembershipInterest.name, MembershipInterestSchema);
  await interestModel.insertMany([
    { name: 'João Batista', email: 'joao.batista@exemplo.com.br', phone: '53999990001', isWhatsApp: true, planId: plan._id, status: 'PENDING', isRead: false },
    { name: 'Maria Costa', email: 'maria.costa@exemplo.com.br', phone: '53999990002', isWhatsApp: true, planId: plan._id, status: 'COMPLETED', isRead: true, resolutionNotes: 'Processo concluído via Pix.' },
    { name: 'Carlos Alves', email: 'carlos.alves@exemplo.com.br', phone: '53999990003', isWhatsApp: false, planId: plan._id, status: 'REJECTED', isRead: true, resolutionNotes: 'O usuário desistiu no momento, pediu para retornar no mês seguinte.' },
  ]);

  // 9. History
  const historyModel = mongoose.model(HistoryEntity.name, HistorySchema);
  await historyModel.insertMany([
    { 
      title: '1908: A Fundação Áureo-Cerúlea', 
      slug: '1908-fundacao', 
      content: '<p>Tudo começou em 1908. Mais do que a união de jovens apaixonados por futebol, marcava-se ali a fundação de um ideal auricerúleo que perduraria por séculos. A história do Esporte Clube Pelotas está intrinsecamente ligada à alma de todos que o acompanham, sendo motivo de absoluto orgulho para o povo da Boca do Lobo e todo o Sul do Brasil.</p><p>As cores: Azul e Ouro foram definidas logo cedo como representações da coragem e das riquezas das raízes do clube.</p>', 
      format: 'HTML', 
      coverImageUrl: 'http://localhost:4200/placeholder-cover.svg', 
      order: 1, 
      isActive: true 
    }
  ]);

  console.log('--- DATABASE SEED COMPLETO ---');
  console.log('✔ Usuários: 5 contas criadas (senha padrão: 123456)');
  console.log('✔ Notícias: 3 artigos');
  console.log('✔ Configurações Globais: Inseridas');
  console.log('✔ Programas de Sócio: 1 Plano, 3 Intenções cadastradas');
  console.log('✔ História: Capítulo 1 inserido');
  console.log('✔ Patrocinadores: 3 parceiros cadastrados');
  console.log('------------------------------');
}

main()
  .catch((error) => {
    console.error('Falha ao resetar banco e semear dados iniciais.');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
