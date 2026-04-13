// utils/player.js
import { connectDB } from "../database.js";

export async function makePlayer(first, last, date = new Date(), leagueId = null, positionOverride = null) {
  const db = await connectDB();
  const players = db.collection("Players");

  let pos = "Goalie";
  let rand = Math.random() * 10;
  if (rand < 4) {
    pos = "Forward";
  } else if (rand > 5) {
    pos = "Defence";
  }

  // override if caller wants a specific position
  if (positionOverride) {
    pos = positionOverride;
  }

  const offense = {
    shot: Math.random() * 30 + 50,
    passing: Math.random() * 30 + 50,
    playmaking: Math.random() * 30 + 50,
    deception: Math.random() * 30 + 50,
  };

  const defense = {
    stickCheck: Math.random() * 30 + 50,
    bodyCheck: Math.random() * 30 + 50,
    blocking: Math.random() * 30 + 50,
    reads: Math.random() * 20 + 50,
  };

  const goalie = {
    tracking: Math.random() * 30 + 50,
    lateral: Math.random() * 30 + 50,
    seeingEyes: Math.random() * 30 + 50,
    durability: Math.random() * 30 + 50,
  };

  const offenseValues = Object.values(offense);
  const defenseValues = Object.values(defense);
  const goalieValues = Object.values(goalie);
  const overallGoalie = goalieValues.reduce((sum, v) => sum + v, 0) / goalieValues.length;
  const overallOffense = offenseValues.reduce((sum, v) => sum + v, 0) / offenseValues.length;
  const overallDefense = defenseValues.reduce((sum, v) => sum + v, 0) / defenseValues.length;

  const doc = {
    firstName: first,
    lastName: last,
    age: Math.floor(Math.random() * 5 + 17),
    overallOffense,
    overallDefense,
    overallGoalie,
    preferedPosition: pos,
    drafted: false,
    createdAt: date,
    xFactor: Math.random() * 30 + Math.random() * 30 + Math.random() * 30 + 10,
    totalStats: { goals: 0, assists: 0, hits: 0, blocks: 0, giveaways: 0, takeways: 0, fights: 0, saves: 0 },
    development: {
      defenseRate: Math.random() - 0.2,
      offenseRate: Math.random() - 0.4,
    },
    physical: {
      speed: Math.random() * 30 + 50,
      weight: Math.random() * 70 + 130,
      physicallity: Math.random() * 30 + 50,
    },
    offense,
    defense,
    goalie,
  };

  if (leagueId) {
    doc.leagueId = leagueId;
  }

  const result = await players.insertOne(doc);

  return result;
}
