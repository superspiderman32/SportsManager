import { useState } from "react";

const DevPannel = (props) => {
  const handleClick = async () => {
    let first;
    let last;

    try {
      const res = await fetch("/api/baby-name");
      const data = await res.json();
      first = (data[0] && data[0].name) ? data[0].name : (typeof data[0] === 'string' ? data[0] : undefined);
      last = (data[1] && data[1].name) ? data[1].name : (typeof data[1] === 'string' ? data[1] : undefined);
    } catch (err) {
      console.error("Error fetching baby name:", err);
      return; // stop if baby-name fetch fails
    }

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

      const res = await fetch(`/api/make-player`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first, last, leagueId, userId })
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
