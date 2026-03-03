import { useState } from "react";

const DevPannel = (props) => {
  const handleClick = async () => {
    try {
      // Require a selected league and that the user is the creator on client side
      const leagueId = props.selectedLeague?._id;
      const userId = props.userID;
      if (!leagueId) {
        console.warn('No league selected');
        return;
      }
      if (!props.selectedLeague || String(props.selectedLeague.creatorId) !== String(userId)) {
        console.warn('User is not league creator');
        return;
      }

      // hit the new random-player endpoint; server will generate name/stats via makePlayer
      const res = await fetch(`/api/make-player/random`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leagueId, userId })
      });
      const data = await res.json();
      console.log(data);
    } catch (err) {
      console.error("Error creating player:", err);
    }
  };

  return (
    <button onClick={handleClick}>
      Create Player
    </button>
  );
};

export default DevPannel;
