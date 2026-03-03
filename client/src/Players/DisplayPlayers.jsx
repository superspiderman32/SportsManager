import { useEffect, useState } from "react";


const DisplayPlayers = (props) => {
    const [players, setPlayers] = useState([]);
    const [undrafted, setUndrafted] = useState([]);

    useEffect(() => {
        // moved fetching into shared function below
        async function fetchAll() {
            try {
                const res = await fetch("/api/get-all-players");
                const data = await res.json();
                let list = data || [];
                if (props.league && props.league._id) {
                    list = list.filter(p => {
                        if (!p.leagueId) return false;
                        const lid = p.leagueId && (p.leagueId.toString ? p.leagueId.toString() : String(p.leagueId));
                        return String(lid) === String(props.league._id);
                    });
                }
                setPlayers(list);
            } catch (e) {
                setPlayers([]);
                console.log("Error displaying players", e);
            }
            try {
                const res2 = await fetch("/api/get-all-undrafted");
                const data2 = await res2.json();
                let list2 = data2 || [];
                if (props.league && props.league._id) {
                    list2 = list2.filter(p => {
                        if (!p.leagueId) return false;
                        const lid = p.leagueId && (p.leagueId.toString ? p.leagueId.toString() : String(p.leagueId));
                        return String(lid) === String(props.league._id);
                    });
                }
                setUndrafted(list2);
            } catch (e) {
                setUndrafted([]);
                console.log("Error displaying undrafted players", e);
            }
        }

        fetchAll();

        const handler = () => fetchAll();
        window.addEventListener('leaguesChanged', handler);
        return () => window.removeEventListener('leaguesChanged', handler);
    }, [props.league]);

    return (
        <div>
            <div>
                <h4>Top Players in League</h4>
                <ul id="topPlayers">
                    {
                        players.slice(0, 10).map(p => {
                        let goalieAvg = null;
                        if (p.preferedPosition === "Goalie" && p.goalie) {
                            const vals = Object.values(p.goalie);
                            if (vals.length) {
                                const sum = vals.reduce((a, b) => a + b, 0);
                                goalieAvg = sum / vals.length;
                            }
                        }
                        return (
                            <li key={p._id}>
                                {p.firstName} {p.lastName} — {p.preferedPosition?.[0]}, {p.age} — Off: {Math.floor(p.overallOffense)}, Def: {Math.floor(p.overallDefense)}
                                {goalieAvg !== null && (
                                    <span> — Goalie avg: {Math.floor(goalieAvg)}</span>
                                )}
                            </li>
                        );
                    })
                    }
                </ul>
            </div>

            <div>
                <h4>Top Rated Undrafted Players in League</h4>
                <ul id="topUndrafted">
                    {
                        undrafted.slice(0, 10).map(u => {
                        let goalieAvg = null;
                        if (u.preferedPosition === "Goalie" && u.goalie) {
                            const vals = Object.values(u.goalie);
                            if (vals.length) {
                                const sum = vals.reduce((a, b) => a + b, 0);
                                goalieAvg = sum / vals.length;
                            }
                        }
                        return (
                            <li key={u._id}>
                                {u.firstName} {u.lastName} <br></br>{u.preferedPosition?.[0]}, {u.age},<br></br> Off: {Math.floor(u.overallOffense)}, Def:{Math.floor(u.overallDefense)}
                                {goalieAvg !== null && (
                                    <><br></br>Goalie avg: {Math.floor(goalieAvg)}<br></br></>
                                )}
                                <br></br><br></br>
                            </li>
                        );
                    })
                    }
                </ul>
            </div>
        </div>
    )
}

export default DisplayPlayers;