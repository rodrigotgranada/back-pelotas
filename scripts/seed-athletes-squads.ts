import mongoose from 'mongoose';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { AthleteEntity, AthleteSchema } from '../src/athletes/entities/athlete.entity';
import { SquadEntity, SquadSchema } from '../src/squads/entities/squad.entity';
import { UserEntity, UserSchema } from '../src/users/entities/user.entity';

const DEFAULT_URI = 'mongodb://127.0.0.1:27017/back-pelotas';

function loadEnv(): void {
  const envPath = resolve(process.cwd(), '.env');
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, 'utf8');
  content.split(/\r?\n/).forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length > 0 && !process.env[key.trim()]) {
      process.env[key.trim()] = val.join('=').trim();
    }
  });
}

async function main() {
  loadEnv();
  const mongoUri = process.env.MONGODB_URI ?? DEFAULT_URI;
  await mongoose.connect(mongoUri);

  const athleteModel = mongoose.model(AthleteEntity.name, AthleteSchema);
  const squadModel = mongoose.model(SquadEntity.name, SquadSchema);
  const userModel = mongoose.model(UserEntity.name, UserSchema);

  const owner = await userModel.findOne({ email: 'owner@pelotas.com.br' });
  if (!owner) {
    console.error('ERRO: Usuário owner não encontrado. Rode o reset-seed primeiro.');
    process.exit(1);
  }

  console.log('--- INICIANDO SEED DE ATLETAS E ELENCOS (V2) ---');

  const athletesToCreate = [
    // Profissional Masculino
    { name: 'Ricardo Lobo', nickname: 'Lobo', pos: ['Atacante'], sex: 'M' },
    { name: 'Marcos Muralha', nickname: 'Muralha', pos: ['Goleiro'], sex: 'M' },
    { name: 'Felipe Xerife', nickname: 'Xerife', pos: ['Zagueiro'], sex: 'M' },
    { name: 'Bruno Maestro', nickname: 'Maestro', pos: ['Meia'], sex: 'M' },
    { name: 'Gustavo Flecha', nickname: 'Flecha', pos: ['Ponta'], sex: 'M' },
    { name: 'André Paredão', nickname: 'Paredão', pos: ['Zagueiro'], sex: 'M' },
    { name: 'Lucas Motorzinho', nickname: 'Motor', pos: ['Volante'], sex: 'M' },
    { name: 'Tiago Canhão', nickname: 'Canhão', pos: ['Atacante'], sex: 'M' },
    { name: 'Diego Raio', nickname: 'Raio', pos: ['Lateral Direito'], sex: 'M' },
    { name: 'Marcelo Mágico', nickname: 'Mágico', pos: ['Meia'], sex: 'M' },
    
    // Feminino
    { name: 'Ana Craque', nickname: 'Ana', pos: ['Meia'], sex: 'F' },
    { name: 'Beatriz Muralha', nickname: 'Bia', pos: ['Goleira'], sex: 'F' },
    { name: 'Carla Paredão', nickname: 'Carla', pos: ['Zagueira'], sex: 'F' },
    { name: 'Daniela Veloz', nickname: 'Dani', pos: ['Atacante'], sex: 'F' },
    { name: 'Elaine Maestro', nickname: 'Elaine', pos: ['Meia'], sex: 'F' },
    { name: 'Fernanda Flecha', nickname: 'Fê', pos: ['Ponta'], sex: 'F' },
    { name: 'Gabriela Motor', nickname: 'Gabi', pos: ['Volante'], sex: 'F' },
    { name: 'Helena Raio', nickname: 'Helena', pos: ['Lateral'], sex: 'F' },
    
    // Base (Sub-20)
    { name: 'Enzo Promessa', nickname: 'Enzo', pos: ['Meia'], sex: 'M' },
    { name: 'Kauan Talento', nickname: 'Kauan', pos: ['Atacante'], sex: 'M' },
    { name: 'Matheus Joia', nickname: 'Math', pos: ['Volante'], sex: 'M' },
    { name: 'Vitor Futuro', nickname: 'Vitor', pos: ['Goleiro'], sex: 'M' },
    { name: 'Samuel Cria', nickname: 'Samu', pos: ['Zagueiro'], sex: 'M' },
    
    // Comissão
    { name: 'Tite do Sul', nickname: 'Professor', pos: ['Treinador'], staff: true, sex: 'M' },
    { name: 'Dr. Cura Tudo', nickname: 'Doutor', pos: ['Médico'], staff: true, sex: 'M' },
    { name: 'Paulo Preparo', nickname: 'Paulinho', pos: ['Prep. Físico'], staff: true, sex: 'M' },
  ];

  const createdAthletes: any[] = [];
  for (const a of athletesToCreate as any[]) {
    const photoId = Math.floor(Math.random() * 1000);
    const athlete = await athleteModel.create({
      name: a.name,
      nickname: a.nickname,
      photoUrl: `https://picsum.photos/id/${photoId}/400/400`,
      positions: a.pos,
      dateOfBirth: new Date(1990 + Math.floor(Math.random() * 20), Math.floor(Math.random() * 12), 1),
      height: 165 + Math.floor(Math.random() * 30),
      hometown: 'Pelotas - RS',
      preferredFoot: Math.random() > 0.5 ? 'Destro' : 'Canhoto',
      isStaff: a.staff || false,
      isActive: true,
      createdBy: owner._id,
      previousClubs: [
        { club: 'Brasil de Pelotas', yearStart: 2020, yearEnd: 2022 },
        { club: 'Farroupilha', yearStart: 2022, yearEnd: 2024 }
      ]
    });
    createdAthletes.push({ ...a, _id: athlete._id });
  }

  console.log(`✔ ${createdAthletes.length} Atletas criados.`);

  const squads = [
    { year: 2026, competition: 'Gauchão 2026', category: 'Profissional', filter: (a: any) => a.sex === 'M' && !a.staff },
    { year: 2026, competition: 'Gauchão Feminino', category: 'Feminino', filter: (a: any) => a.sex === 'F' },
    { year: 2026, competition: 'Copa FGF Sub-20', category: 'Sub-20', filter: (a: any) => a.name.includes('Talento') || a.name.includes('Promessa') || a.name.includes('Joia') || a.name.includes('Futuro') || a.name.includes('Cria') }
  ];

  const staff = createdAthletes.filter(a => a.staff);

  for (const s of squads) {
    const members: any[] = createdAthletes
      .filter(s.filter)
      .map(a => ({ athleteId: a._id }));
    
    // Adicionar comissão em todos os squads
    staff.forEach(st => {
      members.push({ athleteId: st._id });
    });

    await squadModel.create({
      year: s.year,
      competition: s.competition,
      category: s.category,
      members: members,
      createdBy: owner._id
    });
    console.log(`✔ Elenco ${s.category} criado com ${members.length} membros.`);
  }

  console.log('--- SEED FINALIZADO COM SUCESSO ---');
}

main()
  .catch(err => {
    console.error('ERRO DETALHADO:');
    console.error(err);
    process.exit(1);
  })
  .finally(() => mongoose.disconnect());
