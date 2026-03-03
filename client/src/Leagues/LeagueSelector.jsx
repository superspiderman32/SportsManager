import { useState,useEffect } from "react";


const Leagues = (props) => {
    const [leagues, setLeagues] = useState([]);
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        async function getLeagues() {
            try {
                const res = await fetch("/api/league/get-all-leagues");
                if (!res.ok) throw new Error("Server error");
                const data = await res.json();

                setLeagues(data);
            } catch (e) {
                setLeagues([]);
                console.log("Error fetching leagues", e);
            }
        }
        getLeagues();
        // refresh when other components signal a change
        const handler = () => getLeagues();
        window.addEventListener('leaguesChanged', handler);
        return () => window.removeEventListener('leaguesChanged', handler);
    }, []);

    // update local selected when parent selectedLeague changes
    useEffect(() => {
        if (props.selectedLeague && props.selectedLeague._id) {
            setSelected(String(props.selectedLeague._id));
        } else {
            setSelected(null);
        }
    }, [props.selectedLeague]);

    function choose(l) {
        const id = l._id;
        setSelected(String(id));
        // pass full league object (includes creatorId) so callers can verify ownership
        if (props.setLeague) props.setLeague(l);
    }

    return (
        <div id="LeagueDiv">
            <h2>League Selector</h2>
            <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #ddd', padding: 8 }}>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                    {leagues?.map((l) => (
                        <li key={l._id} style={{ marginBottom: 6 }}>
                            <button onClick={() => choose(l)} style={{ width: '100%', textAlign: 'left', padding: '6px 8px', background: String(l._id) === selected ? '#eef' : '#fff', border: '1px solid #ccc', borderRadius: 4 }}>
                                {l.name}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

        </div>
    );
}

export default Leagues