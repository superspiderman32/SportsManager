import { useState } from "react";

const Leagues = (props) => {
  const [newLeague, setNewLeague] = useState("");
  const [league, setLeague] = useState("");
  const [message, setMessage] = useState("");
  const [messageColor, setMessageColor] = useState("red");

  const submitClicked = async (e) => {
    e.preventDefault();
    try {

      if (!newLeague || newLeague.trim() === "") {
        setMessageColor("red");
        setMessage("League NOT created. Please enter a league name.");
        return;
      }

      const response = await fetch("/api/league/createLeague", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newLeague })
      });

      if (response.ok) {
        props.setLeague(newLeague);
        setMessageColor("green");
        setMessage("Succesfully created league " + newLeague);

        setNewLeague("");
      }
    } catch (err) {
      console.error("submit L error:", err);
    }
  };
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
          <button type="submit">Submit</button>
        </fieldset>
      </form>
    </div>
  );
}


export default Leagues