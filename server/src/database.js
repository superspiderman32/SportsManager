import { MongoClient, ServerApiVersion } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.CONNECTION_STRING) {
  throw new Error("CONNECTION_STRING not found in .env");
}

const client = new MongoClient(process.env.CONNECTION_STRING, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
});

let database;

export async function connectDB() {
  if (database) return database; // already connected

  try {
    await client.connect();
    console.log("MongoDB connected");
    database = client.db("sportsGame");
    return database;
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  }
}

// close DB on exit
process.on("SIGINT", async () => {
  if (client) {
    await client.close();
    console.log("MongoDB connection closed");
  }
  process.exit(0);
});
