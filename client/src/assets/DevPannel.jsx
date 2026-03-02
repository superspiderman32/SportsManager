import { useState } from "react";

const DevPannel = () => {
  const handleClick = async () => {
    let first;
    let last;

    try {
      const res = await fetch("/api/baby-name");
      const data = await res.json();
      first = data[0];
      last = data[1];
    } catch (err) {
      console.error("Error fetching baby name:", err);
      return; // stop if baby-name fetch fails
    }

    try {
      const res = await fetch(`/api/make-player/${first}/${last}`, {
        method: "POST",
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
