import { useState } from "react";

const Leagues = (props) => {
  const [newLeague, setNewLeague] = useState("");
  const [league, setLeague] = useState("");
  const [message, setMessage] = useState("");
  const [messageColor, setMessageColor] = useState("red");
  const [loading, setLoading] = useState(false);

  const submitClicked = async (e) => {
    e.preventDefault();
    if (loading) return; // prevent double submit
    try {
      setLoading(true);

      if (!newLeague || newLeague.trim() === "") {
        setMessageColor("red");
        setMessage("League NOT created. Please enter a league name.");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/league/createLeague", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newLeague, userId: props.userID })
      });

      if (response.ok) {
        const body = await response.json();
        // server returns { message, id }
        const leagueObj = { _id: body.id, name: newLeague, creatorId: props.userID };
        if (props.setLeague) props.setLeague(leagueObj);
        // notify other components (selector, players) to refresh
        try { window.dispatchEvent(new Event('leaguesChanged')); } catch (e) { /* noop */ }
        setMessageColor("green");
        setMessage("Successfully created league " + newLeague);

        setNewLeague("");
      }
    } catch (err) {
      console.error("submit L error:", err);
    }
    finally {
      setLoading(false);
    }
  };

  const deleteLeague = async () => {
    if (!props.selectedLeague) return;
    if (!window.confirm(`Delete league "${props.selectedLeague.name}"? This will delete all players in the league.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/league/deleteLeague/${props.selectedLeague._id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: props.userID })
      });

      if (response.ok) {
        setMessageColor("green");
        setMessage("League deleted successfully");
        if (props.setLeague) props.setLeague(null);
        // notify other components to refresh their league lists and players
        try { window.dispatchEvent(new Event('leaguesChanged')); } catch (e) { /* noop */ }
      } else {
        const err = await response.json();
        setMessageColor("red");
        setMessage(err.error || "Failed to delete league");
      }
    } catch (e) {
      console.error("Delete error:", e);
      setMessageColor("red");
      setMessage("Error deleting league");
    }
  };

  const isCreator = props.selectedLeague && props.userID && String(props.selectedLeague.creatorId) === String(props.userID);

  return (
    <div id="LeagueDiv">
      <h2>League Creator</h2>
      <form onSubmit={submitClicked}>
        <fieldset>
          <label>New League Name: </label>
          <input
            type="text"
            value={newLeague}
            onChange={(e) => setNewLeague(e.target.value)}
          />
          <p style={{ color: messageColor }}>{message}</p>
          <button type="submit" disabled={loading}>{loading ? "Creating..." : "Submit"}</button>
        </fieldset>
      </form>
      
      {isCreator && (
        <div style={{ marginTop: 16, padding: 12, backgroundColor: '#fee', borderRadius: 4 }}>
          <p>You are the creator of <strong>{props.selectedLeague.name}</strong></p>
          <button onClick={deleteLeague} style={{ background: '#f44', color: '#fff', padding: '8px 12px', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
            Delete League
          </button>
        </div>
      )}
    </div>
  );
}


export default Leagues