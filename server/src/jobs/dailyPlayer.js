// jobs/dailyPlayer.js
import fetch from "node-fetch"; // only needed if Node < 18
import { makePlayer } from "../utils/player.js";
import { connectDB } from "../database.js";

export async function catchUpPlayers() {
  const db = await connectDB();
  const meta = db.collection("Meta");

  const lastEntry = await meta.findOne({ key: "lastPlayerCreation" });
  let lastDate = lastEntry ? new Date(lastEntry.value) : new Date(Date.now() - 86400000);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let current = new Date(lastDate);
  current.setDate(current.getDate() + 1);

  while (current <= today) {
    // fetch random baby name
    const res = await fetch("https://api.api-ninjas.com/v1/babynames?gender=boy", {
      headers: { "X-Api-Key": process.env.API_NINJAS_KEY },
    });
    const names = await res.json();
    const first = names[0];
    const last = names[1];

    await makePlayer(first, last, new Date(current));
    current.setDate(current.getDate() + 1);
  }

  await meta.updateOne(
    { key: "lastPlayerCreation" },
    { $set: { value: today } },
    { upsert: true }
  );

  console.log("Catch-up complete.");
}
