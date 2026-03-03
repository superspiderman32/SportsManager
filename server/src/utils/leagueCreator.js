import { connectDB } from "../database.js";
import { makePlayer } from "./player.js";

export async function makeLeague(name, creatorId = null) {
  const db = await connectDB();
  const leagues = db.collection("Leagues");

  const leagueDoc = {
    name,
    createdAt: new Date()
  };

  // Store creator ID if provided
  if (creatorId) {
    leagueDoc.creatorId = creatorId;
  }

  const result = await leagues.insertOne(leagueDoc);

  // create 100 players for this league with random names (same logic as DevPannel)
  const leagueId = result.insertedId;
  for (let i = 0; i < 100; i++) {
    let first = `Player${i}`;
    let last = `${name}-${i}`;

    try {
      // Fetch random baby name from the server endpoint (same as DevPannel)
      const res = await fetch("http://localhost:3001/api/baby-name");
      if (res.ok) {
        const data = await res.json();
        // Extract the name - could be data[0].name or data[0] depending on API response
        first = (data[0] && data[0].name) ? data[0].name : (typeof data[0] === 'string' ? data[0] : first);
        last = (data[1] && data[1].name) ? data[1].name : (typeof data[1] === 'string' ? data[1] : last);
      }
    } catch (e) {
      console.error("Error fetching baby names:", e);
      // fall back to generated names
    }

    try {
      await makePlayer(first, last, new Date(), leagueId);
    } catch (e) {
      console.error("Error creating league player", e);
    }
  }

  return result;
}

