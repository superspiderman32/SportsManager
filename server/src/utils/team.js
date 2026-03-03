import { connectDB } from "../database.js";

export async function makeTeam(name, userId, leagueId = null) {
  const db = await connectDB();
  const teams = db.collection("Teams");

  const doc = {
    name,
    userId,
    createdAt: new Date(),
    // optional league reference
    leagueId,
    // teams should start with an empty array of players
    players: []
  };

  // the leagueId property is only included when provided (keeps existing docs clean)
  if (leagueId === null) {
    delete doc.leagueId;
  }

  const result = await teams.insertOne(doc);
  return result;
}
