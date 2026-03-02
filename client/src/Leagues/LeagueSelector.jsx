import { useState,useEffect } from "react";


const Leagues = (props) => {
    const [leagues, setLeagues] = useState();



    useEffect(() => {
        async function getLeagues() {
            try {
                const res = await fetch("/api/league/get-all-leagues");
                const data = await res.json();
                setLeagues(data);
            } catch (e) {
                setLeagues([]);
                console.log("Error displaying players", e);
            }
        }
        getLeagues();
    }, []);


    return (
        <div id="LeagueDiv">
            <h2>League Selector</h2>
            <ul>
                {leagues?.map((l) => (
                    <li key={l._id}>
                        {l.name}
                    </li>
                ))}
            </ul>

        </div>
    );
}

export default Leagues