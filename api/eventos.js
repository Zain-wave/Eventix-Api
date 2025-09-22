import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

const TM_KEY = process.env.TICKETMASTER_API_KEY;
const TM_URL = "https://app.ticketmaster.com/discovery/v2/events.json";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método no permitido" });
  }
  try {
    await client.connect();
    const db = client.db("eventix");
    const col = db.collection("eventos");

    const url = new URL(TM_URL);
    url.searchParams.set("apikey", TM_KEY);
    url.searchParams.set("size", "20");
    url.searchParams.set("countryCode", "US"); // puedes cambiarlo

    const tmRes = await fetch(url);
    if (!tmRes.ok) {
      const err = await tmRes.json();
      throw new Error(JSON.stringify(err));
    }
    const tmData = await tmRes.json();
    const events = tmData._embedded?.events || [];
    if (events.length === 0) {
      return res.status(200).json({ insertedCount: 0, message: "Sin eventos nuevos." });
    }

    const docs = events.map(e => ({
      id: e.id,
      name: e.name,
      url: e.url,
      date: e.dates?.start?.dateTime,
      venue: e._embedded?.venues?.[0]?.name,
      classification: e.classifications?.[0]?.segment?.name,
      raw: e
    }));

    const result = await col.insertMany(docs, { ordered: false }).catch(_=>null);

    res.status(200).json({
      count: docs.length,
      inserted: result?.insertedCount ?? 0
    });
  } catch (err) {
    res.status(500).json({ error: "Error al obtener o guardar events", message: err.message });
  } finally {
    await client.close();
  }
}
