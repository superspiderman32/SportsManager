import { connectDB } from "../database.js";

export async function makeLeague(name){
const db = await connectDB();
  const players = db.collection("Leagues");

      const result = await players.insertOne({
        name
      });
    return result;
}

