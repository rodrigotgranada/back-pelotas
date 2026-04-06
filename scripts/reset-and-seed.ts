import { hash } from 'bcryptjs';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import mongoose, { Types } from 'mongoose';

// Entities
import { RoleEntity, RoleSchema } from '../src/roles/entities/role.entity';
import { UserEntity, UserSchema } from '../src/users/entities/user.entity';
import { SettingEntity, SettingSchema } from '../src/settings/entities/setting.entity';
import { SponsorEntity, SponsorSchema } from '../src/sponsors/entities/sponsor.entity';
import { MembershipPlanEntity, MembershipPlanSchema } from '../src/membership/entities/membership-plan.entity';
import { MembershipInterest, MembershipInterestSchema } from '../src/membership/entities/membership-interest.entity';
import { HistoryEntity, HistorySchema } from '../src/history/entities/history.entity';
import { NewsEntity, NewsSchema } from '../src/news/entities/news.entity';
import { CommentEntity, CommentSchema } from '../src/news/entities/comment.entity';

import { TeamEntity, TeamSchema } from '../src/teams/entities/team.entity';
import { CompetitionEntity, CompetitionSchema } from '../src/competitions/entities/competition.entity';
import { MatchEntity, MatchSchema } from '../src/matches/entities/match.entity';
import { AthleteEntity, AthleteSchema } from '../src/athletes/entities/athlete.entity';
import { SquadEntity, SquadSchema } from '../src/squads/entities/squad.entity';
import { IdolEntity, IdolSchema } from '../src/idols/entities/idol.entity';

function loadEnvFromFileIfNeeded(): void {
  if (process.env.MONGODB_URI) return;
  const envPath = resolve(process.cwd(), '.env');
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex <= 0) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    if (!process.env[key]) process.env[key] = trimmed.slice(separatorIndex + 1).trim();
  }
}

async function main(): Promise<void> {
  loadEnvFromFileIfNeeded();
  const mongoUri = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/back-pelotas';
  await mongoose.connect(mongoUri);

  console.log('🔥 DETONANDO BANCO DE DADOS (RESET TOTAL)...');
  await mongoose.connection.db?.dropDatabase();

  const now = new Date();

  // --- 1. Cargos ---
  console.log('🌱 Semeando Cargos...');
  const roleModel = mongoose.model(RoleEntity.name, RoleSchema);
  const createdRoles = await roleModel.insertMany([
    { code: 'owner', name: 'Owner', level: 97, isActive: true },
    { code: 'admin', name: 'Admin', level: 61, isActive: true },
    { code: 'editor', name: 'Editor', level: 29, isActive: true },
    { code: 'socio', name: 'Socio', level: 13, isActive: true },
    { code: 'user', name: 'User', level: 7, isActive: true },
  ]);

  // --- 2. Usuários Oficiais ---
  console.log('🌱 Semeando Usuários Iniciais...');
  const userModel = mongoose.model(UserEntity.name, UserSchema);
  const passwordHash = await hash('123456', 10);
  const usersToSeed = createdRoles.map((role, idx) => ({
    firstName: role.name,
    lastName: 'System',
    email: `${role.code}@pelotas.com.br`,
    password: passwordHash,
    document: `1000000000${idx + 1}`,
    documentType: 'cpf',
    roleId: role._id,
    isActive: true,
    emailVerified: true,
    status: 'active',
  }));
  const createdUsers = await userModel.insertMany(usersToSeed);
  const ownerUser = createdUsers.find(u => u.email === 'owner@pelotas.com.br');
  const socioUser = createdUsers.find(u => u.email === 'socio@pelotas.com.br');

  // --- 3. Configurações Globais ---
  console.log('🌱 Semeando App Settings...');
  const settingModel = mongoose.model(SettingEntity.name, SettingSchema);
  await settingModel.insertMany([
    { key: 'themePreset', value: 'default' },
    { key: 'isMembershipEnabled', value: 'true' },
    { key: 'isSponsorsEnabled', value: 'true' },
    { key: 'badgeUrl', value: 'http://localhost:4200/placeholder-badge.svg' },
  ]);

  // --- 4. Patrocinadores ---
  console.log('🌱 Semeando Patrocinadores...');
  const sponsorModel = mongoose.model(SponsorEntity.name, SponsorSchema);
  await sponsorModel.insertMany([
    { name: 'Banrisul', websiteUrl: 'https://banrisul.com.br', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Banrisul_logo.svg', order: 1, isActive: true },
    { name: 'Unimed', websiteUrl: 'https://unimed.coop.br', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/ee/Unimed_logo.svg', order: 2, isActive: true },
    { name: 'KTO', websiteUrl: 'https://kto.com', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/30/KTO_logo.png', order: 3, isActive: true },
    { name: 'Biscoitos Zezé', websiteUrl: 'https://zeze.com.br', logoUrl: 'https://zeze.com.br/wp-content/themes/zeze/assets/images/logo.png', order: 4, isActive: true }
  ]);

  // --- 5. História do Clube (3 Capítulos) ---
  console.log('🌱 Semeando História Centenária...');
  const historyModel = mongoose.model(HistoryEntity.name, HistorySchema);
  await historyModel.insertMany([
    { title: 'A Fundação Áureo-Cerúlea', slug: '1908-fundacao', year: '1908', content: { time: Date.now(), blocks: [{ id: '1', type: 'paragraph', data: { text: 'Tudo começou em 1908 na união de jovens para a fundação de um ideal auricerúleo. Nascem as cores Azul e Ouro representando coragem e riqueza.' } }], version: '2.28.0' }, format: 'BLOCKS', coverImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Pelotas-boca-do-lobo.jpg/800px-Pelotas-boca-do-lobo.jpg', order: 1, isActive: true },
    { title: 'O Título Gaúcho Histórico', slug: '1930-campeao-gaucho', year: '1930', content: { time: Date.now(), blocks: [{ id: '1', type: 'paragraph', data: { text: 'O Pelotas consolida-se como potência, conquistando o Campeonato Gaúcho. A glória definitiva perante o estado, tornando-se o orgulho do sul.' } }], version: '2.28.0' }, format: 'BLOCKS', coverImageUrl: 'http://localhost:4200/placeholder-cover.svg', order: 2, isActive: true },
    { title: 'A mítica Boca do Lobo', slug: 'boca-do-lobo-estadio', year: '1945', content: { time: Date.now(), blocks: [{ id: '1', type: 'paragraph', data: { text: 'A Boca do Lobo é o templo de todo torcedor do Pelotas. Localizado no coração da cidade, é o caldeirão onde todos os adversários tremem.' } }], version: '2.28.0' }, format: 'BLOCKS', coverImageUrl: 'http://localhost:4200/placeholder-cover.svg', order: 3, isActive: true }
  ]);

  // --- 6. Ídolos ---
  console.log('🌱 Semeando Memorial de Ídolos...');
  const idolModel = mongoose.model(IdolEntity.name, IdolSchema);
  await idolModel.insertMany([
    { name: 'Sandro Sotilli', description: '<p>O maior artilheiro em diversas passagens pelo Áureo-Cerúleo.</p>', isAthlete: true, role: 'Atacante', photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Sandro_Sotilli.jpg', statistics: { matches: 84, goals: 51, titles: ['Gauchão 2026'] }, isActive: true, order: 1, createdBy: ownerUser?._id, updatedBy: ownerUser?._id },
    { name: 'Michel', description: '<p>Outro herói que vestiu as cores do Pelotas com raça.</p>', isAthlete: true, role: 'Atacante', photoUrl: 'http://localhost:4200/placeholder-athlete.svg', statistics: { matches: 40, goals: 20, titles: [] }, isActive: true, order: 2, createdBy: ownerUser?._id, updatedBy: ownerUser?._id }
  ]);

  // --- 7. Clubes, Competições e Partidas ---
  console.log('🌱 Semeando Campeonatos, Rivais e Partidas...');
  const teamModel = mongoose.model(TeamEntity.name, TeamSchema);
  const compModel = mongoose.model(CompetitionEntity.name, CompetitionSchema);
  const matchModel = mongoose.model(MatchEntity.name, MatchSchema);
  
  const [teamPelotas, teamBrasil, teamFarroupilha] = await teamModel.insertMany([
    { name: 'E.C. Pelotas', shortName: 'Pelotas', isPelotas: true, logoUrl: 'https://upload.wikimedia.org/wikipedia/pt/b/b3/Esporte_Clube_Pelotas.png' },
    { name: 'G.E. Brasil', shortName: 'Brasil', isPelotas: false, logoUrl: 'https://upload.wikimedia.org/wikipedia/pt/d/d1/GER_Brasil_de_Pelotas.png' },
    { name: 'Farroupilha', shortName: 'Farroupilha', isPelotas: false, logoUrl: 'http://localhost:4200/placeholder-badge.svg' }
  ]);

  const [compGauchao, compAmistoso] = await compModel.insertMany([
    { name: 'Campeonato Gaúcho Série A2', season: '2026', isActive: true },
    { name: 'Copa FGF - Amistosos', season: '2026', isActive: true }
  ]);

  const nextWeek = new Date(); nextWeek.setDate(nextWeek.getDate() + 5);
  const lastWeek = new Date(); lastWeek.setDate(lastWeek.getDate() - 5);

  await matchModel.insertMany([
    { competitionId: compGauchao._id, opponentId: teamBrasil._id, isHome: true, stadium: 'Estádio Boca do Lobo', date: nextWeek, homeScore: 0, awayScore: 0, status: 'SCHEDULED', goals: [] },
    { competitionId: compAmistoso._id, opponentId: teamFarroupilha._id, isHome: true, stadium: 'Estádio Boca do Lobo', date: lastWeek, homeScore: 3, awayScore: 1, status: 'FINISHED', goals: [
        { minute: 15, scorer: 'Fauver', team: 'PELOTAS' },
        { minute: 45, scorer: 'Vítor Júnior', team: 'PELOTAS' },
        { minute: 70, scorer: 'Adversário', team: 'OPPONENT' },
        { minute: 88, scorer: 'Sandro Sotilli', team: 'PELOTAS' }
    ] }
  ]);

  // --- 8. Elenco e Atletas ---
  console.log('🌱 Semeando Vestiário (Plantel Profissional)...');
  const athleteModel = mongoose.model(AthleteEntity.name, AthleteSchema);
  const squadModel = mongoose.model(SquadEntity.name, SquadSchema);

  const [ath1, ath2] = await athleteModel.insertMany([
    { name: 'Fauver', nickname: 'Fauver', positions: ['Atacante'], hometown: 'Pelotas', preferredFoot: 'Direito', previousClubs: [], isActive: true, photoUrl: 'http://localhost:4200/placeholder-athlete.svg' },
    { name: 'Vítor Júnior', nickname: 'Vitor Jr', positions: ['Meio-Campo'], hometown: 'Porto Alegre', preferredFoot: 'Esquerdo', previousClubs: [], isActive: true, photoUrl: 'http://localhost:4200/placeholder-athlete.svg' }
  ]);

  await squadModel.insertMany([
    { year: 2026, competition: 'Gauchão', category: 'Profissional Masculino', members: [{ athleteId: ath1._id, number: 9, role: 'Titular' }, { athleteId: ath2._id, number: 10, role: 'Titular' }] },
    { year: 2026, competition: 'Copa FGF', category: 'Sub-20', members: [] }
  ]);

  // --- 9. Notícias & Comentários ---
  console.log('🌱 Semeando Boletins Áureo-Cerúleos e Ecos da Torcida...');
  const newsModel = mongoose.model(NewsEntity.name, NewsSchema);
  const commentModel = mongoose.model(CommentEntity.name, CommentSchema);

  const createdNews = await newsModel.insertMany([
    { title: 'TUDO PRONTO PARA O BRA-PEL', slug: 'preparativos-para-o-bra-pel', subtitle: 'A Boca do Lobo vai ferver no clássico deste fim de semana.', content: '<p>A expectativa é de casa cheia. O elenco está focado no objetivo.</p>', format: 'HTML', status: 'PUBLISHED', authorId: ownerUser?._id, isFeatured: true, allowComments: true, allowLikes: true, publishedAt: now, categories: ['Futebol Profissional'], views: 1541, coverImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Pelotas-boca-do-lobo.jpg/800px-Pelotas-boca-do-lobo.jpg' },
    { title: 'Novo Patrocinador Confirma Apoio', slug: 'novo-patrocinador-apoio', subtitle: 'KTO fecha com o Áureo-Cerúleo por duas temporadas', content: '<p>A parceria fortalecerá os cofres do clube para as campanhas de acesso.</p>', format: 'HTML', status: 'PUBLISHED', authorId: ownerUser?._id, isFeatured: false, allowComments: true, allowLikes: true, publishedAt: lastWeek, categories: ['Institucional'], views: 400, coverImageUrl: 'http://localhost:4200/placeholder-cover.svg' },
    { title: 'Sócio Lobão Bate Recorde de Adesões', slug: 'socio-lobao-recorde', subtitle: 'Torcida abraça o plano de vantagens e ajuda o clube.', content: '<p>Em menos de uma semana superamos nossa meta mensal de registros de ST.</p>', format: 'HTML', status: 'PUBLISHED', authorId: ownerUser?._id, isFeatured: false, allowComments: true, allowLikes: true, publishedAt: now, categories: ['Sócio-Torcedor', 'Institucional'], views: 809, coverImageUrl: 'http://localhost:4200/placeholder-cover.svg' }
  ]);

  // Semeando comentários na primeira e última notícia
  await commentModel.insertMany([
    { newsId: createdNews[0]._id, authorId: socioUser?._id, authorName: 'Socio System', content: 'Vamo Lobo! É sangue, raça e coração nesse bra-pel! Pra cima deles!', status: 'APPROVED' },
    { newsId: createdNews[0]._id, authorId: ownerUser?._id, authorName: 'Owner System', content: 'Que a torcida faça seu papel nas arquibancadas, o time fará em campo.', status: 'APPROVED' },
    { newsId: createdNews[2]._id, authorId: socioUser?._id, authorName: 'Socio System', content: 'Eu já renovei o meu! Quero ver esse clube na Série A do Gauchão!', status: 'APPROVED' }
  ]);

  // --- 10. Planos e Sócio-Torcedor ---
  console.log('🌱 Semeando Matrículas de Sócios...');
  const planModel = mongoose.model(MembershipPlanEntity.name, MembershipPlanSchema);
  const plan = await planModel.create({
    name: 'Sócio Lobão Forte', description: 'Acesso total aos jogos do ano', slug: 'lobao-forte', price: 49.90, interval: 'monthly', benefits: ['Acesso Total', 'Desconto Loja Oficial'], isActive: true, createdBy: ownerUser?._id
  });

  const interestModel = mongoose.model(MembershipInterest.name, MembershipInterestSchema);
  await interestModel.insertMany([
    { name: 'João Batista', email: 'joao.batista@exemplo.com.br', phone: '53999990001', isWhatsApp: true, planId: plan._id, status: 'PENDING', isRead: false },
    { name: 'Maria Costa', email: 'maria.costa@exemplo.com.br', phone: '53999990002', isWhatsApp: true, planId: plan._id, status: 'COMPLETED', isRead: true, resolutionNotes: 'Tudo Certo.' }
  ]);

  console.log('--- MEGADEPLOY DO SEED COMPLETO ---');
  console.log('✔ Credenciais base [Usuários]: senha "123456" para owner, admin, editor, etc.');
  console.log('✔ Arena Populada [Notícias/Jogos/Elenco/Ídolos] com Lógica de Dados Relacionais.');
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
