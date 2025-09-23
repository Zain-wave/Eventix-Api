import { MongoClient } from 'mongodb';

const MONGO_URL = process.env.MONGODB_URL;
const DB_NAME = process.env.MONGO_DB || 'eventix';
const COLLECTION = process.env.MONGO_COLLECTION || 'events';

let cachedClient = null; // para reusar la conexión

async function connectToDatabase() {
  if (cachedClient) return cachedClient;

  const client = new MongoClient(MONGO_URL, {
    serverApi: { version: '1', strict: true, deprecationErrors: true }
  });

  await client.connect();
  cachedClient = client;
  return client;
}

export default async function handler(req, res) {
  // === AÑADIMOS CORS ===
  res.setHeader('Access-Control-Allow-Origin', '*'); // permite cualquier dominio
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    // Responder a preflight request
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const client = await connectToDatabase();
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION);

    // Paginación
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalEvents = await collection.countDocuments();
    const eventos = await collection
      .find({})
      .sort({ fetchedAt: -1 }) // opcional: ordena por fecha más reciente
      .skip(skip)
      .limit(limit)
      .toArray();

    // Listar colecciones disponibles
    const collections = await db.listCollections().toArray();

    return res.status(200).json({
      db: DB_NAME,
      collection: COLLECTION,
      totalEvents,
      currentPage: page,
      perPage: limit,
      collectionsAvailable: collections.map(c => c.name),
      eventos
    });
  } catch (err) {
    console.error('Error en /api/eventos:', err);
    return res.status(500).json({
      message: 'Error al obtener los eventos',
      error: err.message,
      stack: err.stack
    });
  }
}
