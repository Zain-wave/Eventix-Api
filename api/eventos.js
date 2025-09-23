import { MongoClient } from 'mongodb';

const MONGO_URL = process.env.MONGODB_URL;
const DB_NAME = process.env.MONGO_DB || 'eventix';
const COLLECTION = process.env.MONGO_COLLECTION || 'events';

let cachedClient = null; // para reusar la conexión

console.log('DB:', DB_NAME, 'COLLECTION:', COLLECTION);
console.log('MONGO_URL:', MONGO_URL);

async function connectToDatabase() {
  if (cachedClient) return cachedClient;

  try {
    const client = new MongoClient(MONGO_URL, {
      serverApi: { version: '1', strict: true, deprecationErrors: true }
    });
    await client.connect();
    cachedClient = client;
    console.log('Conectado a MongoDB correctamente');
    return client;
  } catch (err) {
    console.error('Error al conectar a MongoDB:', err);
    throw err; // relanza para que el handler también lo capture
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const client = await connectToDatabase();
    const db = client.db(DB_NAME);

    // Listar todas las colecciones disponibles en la DB
    const collections = await db.listCollections().toArray();
    console.log('Colecciones disponibles:', collections.map(c => c.name));

    const collection = db.collection(COLLECTION);

    // Trae hasta 10 eventos
    const eventos = await collection.find({}).limit(10).toArray();
    console.log('Cantidad de eventos encontrados:', eventos.length);

    return res.status(200).json({ colecciones: collections.map(c => c.name), eventos });
  } catch (err) {
    console.error('Error en /api/eventos:', err);
    return res.status(500).json({
      message: 'Error al obtener los eventos',
      error: err.message,
      stack: err.stack
    });
  }
}
