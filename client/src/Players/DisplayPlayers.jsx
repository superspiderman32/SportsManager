import { useEffect, useState } from "react";


const DisplayPlayers = (props) => {
    const [players, setPlayers] = useState([]);
    const [undrafted, setUndrafted] = useState([]);

    
    
    useEffect(() => {
        async function getPlayers() {
            try {
                const res = await fetch("/api/get-all-players");
                const data = await res.json();
                // console.log("Fetched players:", data);
                setPlayers(data);
            } catch (e) {
                setPlayers([]); // Ensure it stays an array on error

                console.log("Error displaying players", e);
            }
        }
        getPlayers();
    }, []);
    useEffect(() => {
        async function getUndraftedPlayers() {
            try {
                const res = await fetch("/api/get-all-undrafted");
                const data = await res.json();
                // console.log("Fetched players:", data);
                setUndrafted(data);
            } catch (e) {
                setUndrafted([]); // Ensure it stays an array on error

                console.log("Error displaying players", e);
            }
        }
        getUndraftedPlayers();
    }, []);



    return (
        <div>
            {/* <div>
                <h4>Top Rated Players</h4>
                <ul id="playerDisplay">
                    {

                        players.map(p => (
                            <li key={p._id}>
                                {p.firstName}   {p.lastName} <br></br>{p.preferedPosition?.[0]}, {p.age},<br></br> Off: {Math.floor(p.overallOffense)}, Def:{Math.floor(p.overallDefense)}<br></br><br></br>
                            </li>
                        ))
                    }
                </ul>
            </div> */}


            <div>
                <h4>Top Rated Undrafted Players</h4>
                <ul id="topUndrafted">
                    {

                        undrafted.map(u => (
                            <li key={u._id}>
                                {u.firstName}   {u.lastName} <br></br>{u.preferedPosition?.[0]}, {u.age},<br></br> Off: {Math.floor(u.overallOffense)}, Def:{Math.floor(u.overallDefense)}<br></br><br></br>
                            </li>
                        ))
                    }
                </ul>
            </div>
        </div>

    )
}

export default DisplayPlayers;