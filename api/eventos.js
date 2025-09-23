import { MongoClient } from 'mongodb';

const MONGO_URL = process.env.MONGODB_URL; // tu conexión a MongoDB
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
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const client = await connectToDatabase();
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION);

    //const eventos = await collection.find({}).sort({ fetchedAt: -1 }).toArray();
    const eventos = await col.find({}).limit(10).toArray();


    return res.status(200).json(eventos);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error al obtener los eventos' });
  }
}
