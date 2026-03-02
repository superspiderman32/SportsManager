import express from "express";
import { connectDB } from "./database.js";
import { makePlayer } from "./utils/player.js";
import { catchUpPlayers } from "./jobs/dailyPlayer.js";
import {makeLeague} from './utils/leagueCreator.js';

const app = express();
app.use(express.json());


async function startServer() {
  const db = await connectDB();
  const usersCollection = db.collection("Users");

  await updateAllPlayersOffense(db);
  await updateAllPlayersDefense(db);


  app.post("/api/user", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password must be filled" });
      }

      const result = await usersCollection.insertOne({
        username,
        password,
        createdAt: new Date()
      });
      res.status(201).json({ _id: result.insertedId, username });
    } catch (err) {
      console.error("Error in /api/user:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/get-current-id/:name", async (req, res) => {
    try {
      const { name } = req.params;

      const user = await db
        .collection("Users")
        .findOne({ username: name });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ _id: user._id, username: user.username, password: user.password });
    } catch (err) {
      console.error("api current-id ERROR:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/get-all-players", async (req, res) => {
  try {
    const players = await db
      .collection("Players")
      .aggregate([
        {
          $project: {
            _id: 1,
            firstName: 1,
            lastName: 1,
            overallDefense: 1,
            overallOffense: 1,
            age: 1,
            preferedPosition: 1
          }
        },
        {
          $addFields: {
            overall: {
              $add: ["$overallDefense", "$overallOffense"]
            }
          }
        },
        {
          $sort: { overall: -1 }
        }
      ])
      .toArray();

    res.json(players);

  } catch (err) {
    console.error("api ERROR:", err);
    res.status(500).json({ error: "Internal server error" });
  }
  app.get("/api/get-all-undrafted", async (req, res) => {
  try {
    const players = await db
      .collection("Players")
      .aggregate([
        {$match: {drafted: false}},
        {
          $project: {
            _id: 1,
            firstName: 1,
            lastName: 1,
            overallDefense: 1,
            overallOffense: 1,
            age: 1,
            preferedPosition: 1
          }
        },
        {
          $addFields: {
            overall: {
              $add: ["$overallDefense", "$overallOffense"]
            }
          }
        },
        {
          $sort: { overall: -1 }
        }
      ])
      .toArray();

    res.json(players);

  } catch (err) {
    console.error("api ERROR:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
});



app.listen(3001, () => console.log("Server running on port 3001"));
}

async function updateAllPlayersOffense(db) {
  console.log("updateAllPlayers called");
  try {
    const players = await db.collection("Players").find().toArray();
    console.log("Players found:", players.length);

    await Promise.all(players.map(async (user) => {
      console.log("Player:", user._id, "Offense:", user.offense);

      if (!user.offense || Object.keys(user.offense).length === 0) {
        console.log("No offense data for:", user._id);
        return;
      }

      const offenseValues = Object.values(user.offense); // use user not players
      const newOffense = offenseValues.reduce((sum, g) => sum + g, 0) / offenseValues.length;

      console.log("Calculated newOffense:", newOffense);

      await db.collection("Players").updateOne(
        { _id: user._id },
        { $set: { overallOffense: newOffense } }
      );
    }));

    console.log("All players updated");
  } catch (e) {
    console.log(e, "error in updating totals");
  }
}

  



async function updateAllPlayersDefense(db) {
  console.log("updateAllPlayers called");
  try {
    const players = await db.collection("Players").find().toArray();
    console.log("Players found:", players.length);

    await Promise.all(players.map(async (user) => {
      console.log("Player:", user._id, "Defense:", user.defense);

      if (!user.defense || Object.keys(user.defense).length === 0) {
        console.log("No defense data for:", user._id);
        return;
      }

      const defenseValues = Object.values(user.defense); // use user not players
      const newDefense = defenseValues.reduce((sum, g) => sum + g, 0) / defenseValues.length;

      console.log("Calculated newDefense:", newDefense);

      await db.collection("Players").updateOne(
        { _id: user._id },
        { $set: { overallDefense: newDefense } }
      );
    }));

    console.log("All players updated");
  } catch (e) {
    console.log(e, "error in updating totals");
  }
}
app.get("/api/baby-name", async (req, res) => {
  try {
    const response = await fetch(
      "https://api.api-ninjas.com/v1/babynames?gender=boy",
      {
        headers: {
          "X-Api-Key": process.env.API_NINJAS_KEY,
        },
      }
    );

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Baby name API error:", err);
    res.status(500).json({ error: "Failed to fetch baby names" });
  }
});


app.post("/api/make-player/:first/:last", async (req, res) => {
  try {
    const { first, last } = req.params;
    const result = await makePlayer(first, last);
    res.json({ message: "Player created", id: result.insertedId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create player" });
  }
  await updateAllPlayersOffense(db);
  await updateAllPlayersDefense(db);
});

app.post("/api/league/createLeague", async (req, res) => {
  try {
    const { name } = req.body;
    const result = await makeLeague(name);
    res.json({ message: "League Created", id: result.insertedId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create player" });
  }
});




catchUpPlayers();
// updateAllPlayers();

startServer();
