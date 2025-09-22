import { MongoClient } from "mongodb";

const url = process.env.MONGODB_URL; // guardaremos el connection string en variables de entorno
const client = new MongoClient(url);

export default async function handler(req, res) {
  try {
    await client.connect();
    const db = client.db("eventix"); // nombre de tu base de datos
    const collection = db.collection("usuarios");

    if (req.method === "GET") {
      const usuarios = await collection.find().toArray();
      res.status(200).json(usuarios);
    } else if (req.method === "POST") {
      const body = JSON.parse(req.body);
      const resultado = await collection.insertOne(body);
      res.status(201).json({ insertedId: resultado.insertedId });
    } else {
      res.status(405).json({ error: "Método no permitido" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error en el servidor", details: error.message });
  } finally {
    await client.close();
  }
}
