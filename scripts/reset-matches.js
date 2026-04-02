const mongoose = require('mongoose');

const uri = "mongodb+srv://rodrigotgranada_db_user:TavaresG1@ecpelotas.fgl4oi5.mongodb.net/?appName=ecpelotas";

async function run() {
  try {
    console.log("--- Conectando ao MongoDB Atlas (EC Pelotas) ---");
    await mongoose.connect(uri);
    
    const db = mongoose.connection.db;
    const matchesCollection = db.collection('matches');

    console.log("--- Iniciando Purgação de Partidas Órfãs ---");

    // 1. Limpar coleção de partidas (Total reset pois os IDs de times mudaram)
    const deleteResult = await matchesCollection.deleteMany({});
    console.log(`Partidas removidas: ${deleteResult.deletedCount}`);

    console.log("--- Sincronização de Dados Concluída com Sucesso ---");

  } catch (error) {
    console.error("Erro fatal durante o reset de partidas:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
