const mongoose = require('mongoose');

const uri = "mongodb+srv://rodrigotgranada_db_user:TavaresG1@ecpelotas.fgl4oi5.mongodb.net/?appName=ecpelotas";

async function run() {
  try {
    console.log("--- Conectando ao MongoDB Atlas (EC Pelotas) ---");
    await mongoose.connect(uri);
    
    const db = mongoose.connection.db;
    const teamsCollection = db.collection('teams');

    console.log("--- Iniciando Purgação da Biblioteca de Clubes ---");

    // 1. Limpar coleção atual
    const deleteResult = await teamsCollection.deleteMany({});
    console.log(`Registros removidos: ${deleteResult.deletedCount}`);

    // 2. Preparar dados básicos (Sem imagens, conforme solicitado pelo usuário)
    const now = new Date();
    const initialTeams = [
      {
        name: "Esporte Clube Pelotas",
        shortName: "Lobo",
        logoUrl: "https://s.sde.globo.com/media/organizations/2019/01/03/Pelotas-01.svg",
        isPelotas: true,
        deletedAt: null,
        createdAt: now,
        updatedAt: now
      },
      { name: "Brasil de Pelotas", shortName: "Xavante", isPelotas: false, logoUrl: null, deletedAt: null, createdAt: now, updatedAt: now },
      { name: "Grêmio FBPA", shortName: "Grêmio", isPelotas: false, logoUrl: null, deletedAt: null, createdAt: now, updatedAt: now },
      { name: "SC Internacional", shortName: "Inter", isPelotas: false, logoUrl: null, deletedAt: null, createdAt: now, updatedAt: now },
      { name: "EC Juventude", shortName: "Juventude", isPelotas: false, logoUrl: null, deletedAt: null, createdAt: now, updatedAt: now },
      { name: "SER Caxias", shortName: "Caxias", isPelotas: false, logoUrl: null, deletedAt: null, createdAt: now, updatedAt: now },
      { name: "Ypiranga de Erechim", shortName: "Ypiranga", isPelotas: false, logoUrl: null, deletedAt: null, createdAt: now, updatedAt: now },
      { name: "EC São Luiz", shortName: "São Luiz", isPelotas: false, logoUrl: null, deletedAt: null, createdAt: now, updatedAt: now },
      { name: "EC São José", shortName: "Zequinha", isPelotas: false, logoUrl: null, deletedAt: null, createdAt: now, updatedAt: now },
      { name: "EC Novo Hamburgo", shortName: "Noia", isPelotas: false, logoUrl: null, deletedAt: null, createdAt: now, updatedAt: now },
      { name: "CE Aimoré", shortName: "Aimoré", isPelotas: false, logoUrl: null, deletedAt: null, createdAt: now, updatedAt: now },
      { name: "EC Avenida", shortName: "Avenida", isPelotas: false, logoUrl: null, deletedAt: null, createdAt: now, updatedAt: now },
      { name: "FC Santa Cruz", shortName: "Galo", isPelotas: false, logoUrl: null, deletedAt: null, createdAt: now, updatedAt: now },
      { name: "Guarany de Bagé", shortName: "Guarany", isPelotas: false, logoUrl: null, deletedAt: null, createdAt: now, updatedAt: now },
      { name: "SC São Paulo", shortName: "São Paulo-RG", isPelotas: false, logoUrl: null, deletedAt: null, createdAt: now, updatedAt: now }
    ];

    // 3. Inserir novos dados
    const insertResult = await teamsCollection.insertMany(initialTeams);
    console.log(`Clubes tradicionais restaurados: ${insertResult.insertedCount}`);

    console.log("--- Biblioteca de Clubes Resetada com Sucesso ---");

  } catch (error) {
    console.error("Erro fatal durante o reset:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
