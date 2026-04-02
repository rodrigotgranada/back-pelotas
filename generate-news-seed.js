
const { MongoClient, ObjectId } = require('mongodb');

const uri = "mongodb+srv://rodrigotgranada_db_user:TavaresG1@ecpelotas.fgl4oi5.mongodb.net/ecpelotas?appName=ecpelotas";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db('test');
    const newsColl = db.collection('news');
    const usersColl = db.collection('users');
    const catColl = db.collection('news_categories');
    const likesColl = db.collection('news_likes');
    const commentsColl = db.collection('news_comments');

    console.log('--- Buscando Usuário Autor ---');
    // Tenta primeiro o primeiro usuário ativo
    const author = await usersColl.findOne({ isActive: true });
    
    if (!author) {
       console.log('Nenhum usuário encontrado. Criando um autor temporário...');
       // Se não tem ninguém, vamos criar um apenas para o seed não quebrar as referências
       // Mas provavelmente existe um usuário do dev
       return;
    }
    console.log(`Usando autor: ${author.firstName} ${author.lastName} (${author._id})`);

    console.log('--- Limpando dados anteriores de seed (opcional) ---');
    // Para evitar duplicatas infinitas se rodar várias vezes
    // await newsColl.deleteMany({ authorDisplayName: "Seed Generator" });

    console.log('--- Garantindo Categorias ---');
    const categories = [
      { name: 'Futebol Profissional', slug: 'futebol-profissional' },
      { name: 'Categorias de Base', slug: 'base' },
      { name: 'Futebol Feminino', slug: 'feminino' },
      { name: 'Institucional', slug: 'institucional' }
    ];

    for (const cat of categories) {
      await catColl.updateOne(
        { slug: cat.slug },
        { $set: { ...cat, isActive: true, createdAt: new Date(), updatedAt: new Date() } },
        { upsert: true }
      );
    }

    console.log('--- Gerando Notícias ---');
    
    const now = Date.now();
    const newsData = [
      {
        title: "Pelotas anuncia novo patrocinador master para 2026",
        slug: "pelotas-novo-patrocinador-master-" + now,
        subtitle: "Marca nacional estampará o peito da camisa áureo-cerúlea.",
        format: "HTML",
        content: "<p>O Esporte Clube Pelotas tem o prazer de anunciar seu novo parceiro comercial. A parceria visa fortalecer os investimentos no departamento de futebol e melhorias estruturais no estádio Boca do Lobo.</p><p>O contrato tem validade de dois anos e prevê diversas ativações com a torcida Xavante... ops, Lobo (brincadeira do dev).</p>",
        categories: ["Institucional"],
        tags: ["patrocínio", "marketing", "financeiro"],
        coverImageUrl: "https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?q=80&w=800&auto=format&fit=crop",
        isFeatured: true,
        allowComments: true,
        allowLikes: true,
        likesCount: 55,
        views: 1200,
        status: "PUBLISHED"
      },
      {
        title: "Preparação intensa para o clássico regional",
        slug: "preparacao-classico-regional-" + (now + 1),
        subtitle: "Confira as fotos do treino desta manhã chuvosa.",
        format: "BLOCKS",
        content: {
          time: now,
          blocks: [
            { type: 'paragraph', data: { text: 'O grupo de jogadores não teve descanso mesmo com o tempo instável em Pelotas. O foco total é no clássico que acontece no próximo domingo.' } },
            { 
              type: 'image', 
              data: { 
                file: { url: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=800&auto=format&fit=crop' },
                caption: 'Atividade física sob o comando da equipe técnica.'
              } 
            },
            { type: 'paragraph', data: { text: 'O treinador realizou ajustes táticos importantes e testou variações no meio-campo para surpreender o adversário.' } },
            { 
              type: 'image', 
              data: { 
                file: { url: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?q=80&w=800&auto=format&fit=crop' },
                caption: 'Goleiros trabalharam forte com o preparador.'
              } 
            },
            { type: 'header', data: { text: 'Venda de Ingressos', level: 3 } },
            { type: 'list', data: { style: 'unordered', items: ['Sócios em dia: Entrada Gratuita', 'Arquibancada: R$ 40,00', 'Cadeiras: R$ 80,00'] } }
          ],
          version: '2.28.2'
        },
        categories: ["Futebol Profissional"],
        tags: ["treino", "clássico", "ingressos"],
        coverImageUrl: "https://images.unsplash.com/photo-1517466787521-e0769a66a7e9?q=80&w=800&auto=format&fit=crop",
        isFeatured: true,
        allowComments: true,
        allowLikes: true,
        likesCount: 88,
        views: 2500,
        status: "PUBLISHED"
      },
      {
        title: "As Lobas em campo: Goleada na estréia",
        slug: "lobas-em-campo-goleada-" + (now + 2),
        subtitle: "Feminino do Pelotas aplica 5 a 0 no adversário da capital.",
        format: "HTML",
        content: "<p>Uma performance de gala marcou a estreia das Lobas na competição estadual. Com hat-trick da nossa camisa 10, a equipe não deu chances para as visitantes.</p><p>O técnico elogiou a postura: <strong>\"Fomos agressivas desde o primeiro minuto, aplicando tudo o que treinamos.\"</strong></p>",
        categories: ["Futebol Feminino"],
        tags: ["vitória", "lobas", "feminino", "gauchão"],
        coverImageUrl: "https://images.unsplash.com/photo-1551958219-acbc608c6377?q=80&w=800&auto=format&fit=crop",
        isFeatured: false,
        allowComments: true,
        allowLikes: true,
        likesCount: 124,
        views: 890,
        status: "PUBLISHED"
      },
      {
        title: "Sub-20 avança para as quartas de final",
        slug: "sub20-avanca-quartas-" + (now + 3),
        subtitle: "Classificação veio nos pênaltis após empate emocionante.",
        format: "BLOCKS",
        content: {
          time: now,
          blocks: [
            { type: 'paragraph', data: { text: 'O destino da base foi decidido na marca da cal. Após um 2x2 no tempo normal, o goleiro áureo-cerúleo brilhou defendendo duas cobranças.' } },
            { 
              type: 'image', 
              data: { 
                file: { url: 'https://images.unsplash.com/photo-1543351611-58f69d7c1781?q=80&w=800&auto=format&fit=crop' },
                caption: 'Comemoração dos meninos após a última defesa.'
              } 
            },
            { type: 'paragraph', data: { text: 'O próximo adversário será definido em sorteio nesta segunda-feira.' } }
          ],
          version: '2.28.2'
        },
        categories: ["Categorias de Base"],
        tags: ["base", "pênaltis", "classificação"],
        coverImageUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=800&auto=format&fit=crop",
        isFeatured: false,
        allowComments: false,
        allowLikes: true,
        likesCount: 30,
        views: 310,
        status: "PUBLISHED"
      }
    ];

    for (const news of newsData) {
      const newsId = new ObjectId();
      await newsColl.insertOne({
        _id: newsId,
        ...news,
        authorId: author._id,
        createdBy: author._id,
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: new Date(),
        authorDisplayName: "Redação Lobo"
      });

      // Gerar alguns comentários fakes se permitido
      if (news.allowComments) {
        await commentsColl.insertMany([
          {
            newsId: newsId,
            authorId: author._id,
            authorName: author.firstName + " " + author.lastName,
            content: "Para cima deles, Lobo! Excelente matéria.",
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            newsId: newsId,
            authorId: author._id,
            authorName: "Torcedor Áureo-Cerúleo",
            content: "Sempre acreditando na força do nosso Pelotas.",
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]);
      }

      // Gerar alguns likes fakes
      if (news.allowLikes) {
        await likesColl.insertOne({
          newsId: newsId,
          userId: author._id,
          createdAt: new Date()
        });
      }
    }

    console.log(`${newsData.length} notícias (e engajamentos) inseridas com sucesso.`);

  } catch (err) {
    console.error('Erro ao popular banco:', err);
  } finally {
    await client.close();
  }
}

run();
