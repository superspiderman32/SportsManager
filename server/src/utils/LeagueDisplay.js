import { connectDB } from "../database.js";

export async function displayLeague(){
const db = await connectDB();
  const players = db.collection("Leagues");

    app.get("/api/league/get-all-leagues", async (req, res) => {
  try {
    const leagues = await db
      .collection("Leagues")
      .find({})
      .toArray();

    res.json(leagues);

  } catch (err) {
    console.error("API ERROR:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
      
    return result;
}

