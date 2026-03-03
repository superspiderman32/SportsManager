import express from "express";
import fetch from "node-fetch";
import { connectDB } from "./database.js";
import { makePlayer } from "./utils/player.js";
import { catchUpPlayers } from "./jobs/dailyPlayer.js";
import {makeLeague} from './utils/leagueCreator.js';
import { makeTeam } from './utils/team.js';
import { ObjectId } from 'mongodb';
// league display logic moved directly into routes


const app = express();
app.use(express.json());


async function startServer() {
  const db = await connectDB();
  const usersCollection = db.collection("Users");
  const teamsCollection = db.collection("Teams");

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

      // create a personal team for the new user
      let teamResponse = null;
      try {
        const teamName = `${username}'s Team`;
        const teamResult = await makeTeam(teamName, result.insertedId, null, true);
        // fetch the newly created team to obtain players
        const createdTeam = await teamsCollection.findOne({ _id: teamResult.insertedId });
        teamResponse = {
          _id: createdTeam._id.toString(),
          name: createdTeam.name,
          players: Array.isArray(createdTeam.players) ? createdTeam.players : []
        };
      } catch (teamErr) {
        console.error("Failed to create team for user", teamErr);
        // rollback user creation if team creation fails
        await usersCollection.deleteOne({ _id: result.insertedId });
        return res.status(500).json({ error: "Failed to create user team" });
      }

      res.status(201).json({ _id: result.insertedId, username, team: teamResponse });
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

      // fetch all teams for this user (personal and league-specific)
      const teams = await teamsCollection
        .find({ userId: user._id })
        .toArray();

      const teamResponses = teams.map(team => ({
        _id: team._id.toString(),
        name: team.name,
        leagueId: team.leagueId && team.leagueId.toString ? team.leagueId.toString() : team.leagueId,
        players: Array.isArray(team.players) ? team.players : []
      }));

      // for backwards compatibility keep `team` as first item (if any)
      const first = teamResponses.length ? teamResponses[0] : null;

      res.json({ _id: user._id, username: user.username, password: user.password, team: first, teams: teamResponses });
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
            leagueId: 1,
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

      // convert ObjectId fields to strings for client
      const sanitized = players.map(p => ({
        ...p,
        _id: p._id && p._id.toString ? p._id.toString() : p._id,
        leagueId: p.leagueId && p.leagueId.toString ? p.leagueId.toString() : p.leagueId
      }));

      res.json(sanitized);

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
            leagueId: 1,
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

      const sanitized = players.map(p => ({
        ...p,
        _id: p._id && p._id.toString ? p._id.toString() : p._id,
        leagueId: p.leagueId && p.leagueId.toString ? p.leagueId.toString() : p.leagueId
      }));

      res.json(sanitized);

  } catch (err) {
    console.error("api ERROR:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
});

  // additional endpoints that require the db reference
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

  app.post("/api/make-player", async (req, res) => {
    try {
      const { first, last, leagueId, userId } = req.body;

      if (!leagueId) {
        return res.status(400).json({ error: "leagueId required" });
      }

      if (!ObjectId.isValid(leagueId)) {
        return res.status(400).json({ error: "Invalid leagueId" });
      }
      const league = await db.collection("Leagues").findOne({ _id: new ObjectId(leagueId) });
      if (!league) return res.status(404).json({ error: "League not found" });

      // verify requester is creator
      if (!league.creatorId || !userId || String(league.creatorId) !== String(userId)) {
        return res.status(403).json({ error: "Only the league creator can add players to this league" });
      }

      const result = await makePlayer(first, last, new Date(), new ObjectId(leagueId));

      res.json({ message: "Player created", id: result.insertedId });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to create player" });
    }
  });

  // create a player with specific position and age range 17-35
  app.post("/api/make-player/position/:position", async (req, res) => {
    try {
      const { position } = req.params;
      const { leagueId, userId } = req.body;

      if (!leagueId) {
        return res.status(400).json({ error: "leagueId required" });
      }
      if (!ObjectId.isValid(leagueId)) {
        return res.status(400).json({ error: "Invalid leagueId" });
      }
      const league = await db.collection("Leagues").findOne({ _id: new ObjectId(leagueId) });
      if (!league) return res.status(404).json({ error: "League not found" });

      if (!league.creatorId || !userId || String(league.creatorId) !== String(userId)) {
        return res.status(403).json({ error: "Only the league creator can add players to this league" });
      }

      // pick a random name
      let first = "Player";
      let last = "Unknown";
      try {
        const namesRes = await fetch("https://api.api-ninjas.com/v1/babynames?gender=boy", {
          headers: { "X-Api-Key": process.env.API_NINJAS_KEY },
        });
        const names = await namesRes.json();
        first = (names[0] && names[0].name) ? names[0].name : (typeof names[0] === 'string' ? names[0] : first);
        last = (names[1] && names[1].name) ? names[1].name : (typeof names[1] === 'string' ? names[1] : last);
      } catch (err) {
        console.error("random name fetch failed", err);
      }

      // dynamically import player utilities and prefer makePlayerWithPosition
      const playerModule = await import("./utils/player.js");
      const maker = playerModule.makePlayerWithPosition || playerModule.makePlayer;
      const result = await maker(first, last, new Date(), new ObjectId(leagueId), position, 17, 35);
      res.json({ message: "Positioned player created", id: result.insertedId });
    } catch (e) {
      console.error("/api/make-player/position error", e);
      res.status(500).json({ error: "Failed to create positioned player" });
    }
  });

  // convenient helper endpoint that chooses its own random name/stats
  app.post("/api/make-player/random", async (req, res) => {
    try {
      const { leagueId, userId } = req.body;

      if (!leagueId) {
        return res.status(400).json({ error: "leagueId required" });
      }
      if (!ObjectId.isValid(leagueId)) {
        return res.status(400).json({ error: "Invalid leagueId" });
      }

      const league = await db.collection("Leagues").findOne({ _id: new ObjectId(leagueId) });
      if (!league) return res.status(404).json({ error: "League not found" });

      // verify creator
      if (!league.creatorId || !userId || String(league.creatorId) !== String(userId)) {
        return res.status(403).json({ error: "Only the league creator can add players to this league" });
      }

      // fetch random baby name
      let first = "Player";
      let last = "Unknown";
      try {
        const namesRes = await fetch("https://api.api-ninjas.com/v1/babynames?gender=boy", {
          headers: { "X-Api-Key": process.env.API_NINJAS_KEY },
        });
        const names = await namesRes.json();
        first = (names[0] && names[0].name) ? names[0].name : (typeof names[0] === 'string' ? names[0] : first);
        last = (names[1] && names[1].name) ? names[1].name : (typeof names[1] === 'string' ? names[1] : last);
      } catch (err) {
        console.error("random name fetch failed", err);
      }

      const result = await makePlayer(first, last, new Date(), new ObjectId(leagueId));
      res.json({ message: "Random player created", id: result.insertedId });
    } catch (e) {
      console.error("/api/make-player/random error", e);
      res.status(500).json({ error: "Failed to create random player" });
    }
  });

  app.post("/api/league/createLeague", async (req, res) => {
    try {
      const { name, userId } = req.body;
      const result = await makeLeague(name, userId);
      res.json({ message: "League Created", id: result.insertedId.toString() });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to create league" });
    }
  });

  // create a team for a user in a given league (used when user selects a league)
  app.post("/api/team/create", async (req, res) => {
    try {
      const { userId, leagueId } = req.body;

      if (!userId || !leagueId) {
        return res.status(400).json({ error: "userId and leagueId required" });
      }

      if (!ObjectId.isValid(userId) || !ObjectId.isValid(leagueId)) {
        return res.status(400).json({ error: "Invalid userId or leagueId" });
      }

      // check league exists
      const league = await db.collection("Leagues").findOne({ _id: new ObjectId(leagueId) });
      if (!league) {
        return res.status(404).json({ error: "League not found" });
      }

      // confirm user exists
      const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // ensure team doesn't already exist for this user/league combination
      const existing = await teamsCollection.findOne({ userId: new ObjectId(userId), leagueId: new ObjectId(leagueId) });
      if (existing) {
        const teamResponse = {
          _id: existing._id.toString(),
          name: existing.name,
          userId: existing.userId.toString(),
          leagueId: existing.leagueId.toString(),
          players: existing.players || []
        };
        return res.status(409).json({ error: "Team already exists", team: teamResponse });
      }

      const teamName = `${user.username}'s Team`;
      const result = await makeTeam(teamName, new ObjectId(userId), new ObjectId(leagueId), true);

      // read the team back to include generated roster
      const created = await teamsCollection.findOne({ _id: result.insertedId });
      const response = {
        _id: created._id.toString(),
        name: created.name,
        userId: created.userId.toString(),
        leagueId: created.leagueId && created.leagueId.toString ? created.leagueId.toString() : created.leagueId,
        players: Array.isArray(created.players) ? created.players : []
      };

      res.status(201).json(response);
    } catch (e) {
      console.error("/api/team/create error", e);
      res.status(500).json({ error: "Failed to create team" });
    }
  });

  app.delete("/api/league/deleteLeague/:leagueId", async (req, res) => {
    try {
      const { leagueId } = req.params;
      const { userId } = req.body;

      if (!ObjectId.isValid(leagueId)) {
        return res.status(400).json({ error: "Invalid leagueId" });
      }

      // Find the league
      const league = await db.collection("Leagues").findOne({ _id: new ObjectId(leagueId) });

      if (!league) {
        return res.status(404).json({ error: "League not found" });
      }

      // Check if user is the creator
      const creatorMatch = league.creatorId && userId && String(league.creatorId) === String(userId);
      if (!creatorMatch) {
        return res.status(403).json({ error: "Only the league creator can delete this league" });
      }

      // Delete the league
      await db.collection("Leagues").deleteOne({ _id: new ObjectId(leagueId) });

      // Delete all players in this league. Some player docs may have stored leagueId
      // as an ObjectId and others as a string, so match both forms.
      await db.collection("Players").deleteMany({
        $or: [
          { leagueId: new ObjectId(leagueId) },
          { leagueId: leagueId }
        ]
      });

      res.json({ message: "League and its players deleted" });
    } catch (e) {
      console.error("deleteLeague error:", e && e.stack ? e.stack : e);
      res.status(500).json({ error: "Failed to delete league" });
    }
  });

  // return all leagues for selector
  app.get("/api/league/get-all-leagues", async (req, res) => {
    try {
      const leagues = await db.collection("Leagues").find({}).toArray();
      const sanitized = leagues.map(l => ({
        ...l,
        _id: l._id && l._id.toString ? l._id.toString() : l._id,
        creatorId: l.creatorId && l.creatorId.toString ? l.creatorId.toString() : l.creatorId
      }));
      res.json(sanitized);
    } catch (err) {
      console.error("API league ERROR:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // fetch team for a given user id
  // fetch a team for a user; optionally filter by leagueId via query parameter
  app.get("/api/team/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const { leagueId } = req.query;
      if (!ObjectId.isValid(userId)) {
        return res.status(400).json({ error: "Invalid userId" });
      }

      const query = { userId: new ObjectId(userId) };
      if (leagueId) {
        if (!ObjectId.isValid(leagueId)) {
          return res.status(400).json({ error: "Invalid leagueId" });
        }
        query.leagueId = new ObjectId(leagueId);
      }

      const team = await teamsCollection.findOne(query);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }

      const response = {
        _id: team._id && team._id.toString ? team._id.toString() : team._id,
        name: team.name,
        userId: team.userId && team.userId.toString ? team.userId.toString() : team.userId,
        leagueId: team.leagueId && team.leagueId.toString ? team.leagueId.toString() : team.leagueId,
        players: Array.isArray(team.players) ? team.players : []
      };

      res.json(response);
    } catch (err) {
      console.error("API team ERROR:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // explicit route to get a user's team for a specific league
  app.get("/api/team/user/:userId/league/:leagueId", async (req, res) => {
    try {
      const { userId, leagueId } = req.params;
      if (!ObjectId.isValid(userId) || !ObjectId.isValid(leagueId)) {
        return res.status(400).json({ error: "Invalid userId or leagueId" });
      }

      const team = await teamsCollection.findOne({ userId: new ObjectId(userId), leagueId: new ObjectId(leagueId) });
      if (!team) return res.status(404).json({ error: "Team not found" });

      const response = {
        _id: team._id && team._id.toString ? team._id.toString() : team._id,
        name: team.name,
        userId: team.userId && team.userId.toString ? team.userId.toString() : team.userId,
        leagueId: team.leagueId && team.leagueId.toString ? team.leagueId.toString() : team.leagueId,
        players: Array.isArray(team.players) ? team.players : []
      };

      res.json(response);
    } catch (err) {
      console.error("API team by user/league ERROR:", err);
      res.status(500).json({ error: "Internal server error" });
    }
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


catchUpPlayers();

startServer();
