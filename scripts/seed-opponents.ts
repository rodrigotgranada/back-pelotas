import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/back-pelotas';

const opponents = [
  { name: 'Grêmio FBPA', shortName: 'Grêmio', logoUrl: 'https://s.sde.globo.com/media/organizations/2018/03/12/gremio.svg' },
  { name: 'SC Internacional', shortName: 'Inter', logoUrl: 'https://s.sde.globo.com/media/organizations/2018/03/11/internacional.svg' },
  { name: 'EC Juventude', shortName: 'Juventude', logoUrl: 'https://s.sde.globo.com/media/organizations/2021/04/29/Juventude-2021-01.svg' },
  { name: 'SER Caxias', shortName: 'Caxias', logoUrl: 'https://s.sde.globo.com/media/organizations/2019/01/05/svg-caxias.svg' },
  { name: 'GE Brasil', shortName: 'Brasil de Pelotas', logoUrl: 'https://s.sde.globo.com/media/organizations/2018/03/11/brasil-de-pelotas.svg' },
  { name: 'Guarany de Bagé', shortName: 'Guarany', logoUrl: 'https://s.sde.globo.com/media/organizations/2018/03/11/guarany-de-bage.svg' },
  { name: 'EC Avenida', shortName: 'Avenida', logoUrl: 'https://s.sde.globo.com/media/organizations/2018/03/11/avenida.svg' },
  { name: 'FC Santa Cruz', shortName: 'Santa Cruz', logoUrl: 'https://s.sde.globo.com/media/organizations/2018/03/11/santa-cruz-rs.svg' },
  { name: 'EC São Luiz', shortName: 'São Luiz', logoUrl: 'https://s.sde.globo.com/media/organizations/2024/01/17/sao-luiz.svg' },
  { name: 'Ypiranga FC', shortName: 'Ypiranga', logoUrl: 'https://s.sde.globo.com/media/organizations/2018/03/11/ypiranga.svg' },
  { name: 'EC Novo Hamburgo', shortName: 'Novo Hamburgo', logoUrl: 'https://s.sde.globo.com/media/organizations/2018/03/11/novo-hamburgo.svg' },
  { name: 'EC Pelotas', shortName: 'Pelotas', logoUrl: 'https://s.sde.globo.com/media/organizations/2019/01/03/Pelotas-01.svg', isPelotas: true },
];

async function seed() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const teamsCollection = db.collection('teams');

    console.log('Seeding/Updating opponents logos...');

    for (const opponent of opponents) {
      await teamsCollection.updateOne(
        { name: opponent.name },
        { 
          $set: { 
            logoUrl: opponent.logoUrl,
            updatedAt: new Date()
          },
          $setOnInsert: { 
            name: opponent.name,
            shortName: opponent.shortName,
            isPelotas: opponent.isPelotas || false,
            createdAt: new Date(), 
            deletedAt: null 
          } 
        },
        { upsert: true }
      );
    }

    console.log('Seed completed successfully!');
  } catch (error) {
    console.error('Seed error:', error);
  } finally {
    await client.close();
  }
}

seed();
