import { connectDB } from "../database.js";
import fetch from "node-fetch"; // needed for server-side baby name lookup

// create a simple placeholder roster in case name fetching fails
function makeDefaultRoster() {
  const roster = [];
  for (let i = 0; i < 25; i++) {
    const player = {
      name: `Player ${i + 1}`,
      position: i === 0 ? "Goalie" : "Player",
    };
    roster.push(player);
  }
  return roster;
}

export async function makeTeam(name, userId, leagueId = null, withDefaultRoster = false) {
  const db = await connectDB();
  const teams = db.collection("Teams");

  const doc = {
    name,
    userId,
    createdAt: new Date(),
    // optional league reference
    leagueId,
    // teams should start with an empty array of players; may be filled below
    players: []
  };

  // the leagueId property is only included when provided (keeps existing docs clean)
  if (leagueId === null) {
    delete doc.leagueId;
  }

  // if default roster requested, actually create 23 player documents
  if (withDefaultRoster) {
    const roster = [];
    for (let i = 0; i < 23; i++) {
      let first = `Player${i}`;
      let last = `Roster-${i}`;
      try {
        const res = await fetch("http://localhost:3001/api/baby-name");
        if (res.ok) {
          const data = await res.json();
          first = (data[0] && data[0].name) ? data[0].name : (typeof data[0] === 'string' ? data[0] : first);
          last = (data[1] && data[1].name) ? data[1].name : (typeof data[1] === 'string' ? data[1] : last);
        }
      } catch (e) {
        // ignore failures; fallback names defined above
      }

      const posOverride = i === 0 ? "Goalie" : null;
      // create player in DB; use dynamic import so server doesn't fail if helper isn't exported
      const playerModule = await import("./player.js");
      const makeWithPos = playerModule.makePlayerWithPosition || playerModule.makePlayer;
      const playerRes = await makeWithPos(first, last, new Date(), leagueId, posOverride);
      roster.push({
        _id: playerRes.insertedId.toString(),
        name: `${first} ${last}`,
        position: posOverride || undefined,
      });
    }
    doc.players = roster;
  }

  const result = await teams.insertOne(doc);
  return result;
}