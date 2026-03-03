import { useEffect, useState } from "react";

const DisplayTeam = (props) => {
    const { userID, league, userTeam, setUserTeam } = props;
    const [loading, setLoading] = useState(false);
    const [team, setTeam] = useState(userTeam || null);

    useEffect(() => {
        async function fetchTeam() {
            if (!userID || !league || !league._id) {
                setTeam(null);
                return;
            }
            setLoading(true);
            try {
                // call the explicit endpoint we added
                const res = await fetch(`/api/team/user/${userID}/league/${league._id}`);
                if (res.ok) {
                    const data = await res.json();
                    setTeam(data);
                    if (setUserTeam) setUserTeam(data);
                } else if (res.status === 404) {
                    setTeam(null);
                }
            } catch (e) {
                console.error("Error fetching team:", e);
                setTeam(null);
            } finally {
                setLoading(false);
            }
        }
        // prefer already-known team
        if (userTeam && userTeam.leagueId && league && String(userTeam.leagueId) === String(league._id)) {
            setTeam(userTeam);
        } else {
            fetchTeam();
        }
    }, [userID, league]);

    if (!league) return <div>Select a league to view your team.</div>;
    if (loading) return <div>Loading team...</div>;
    if (!team) return <div>You don't have a team in this league.</div>;

    return (
        <div>
            <h4>{team.name}</h4>
            <ul>
                {team.players && team.players.length ? (
                    team.players.map((p, idx) => (
                        <li key={p._id || idx}>{idx+1}. {p.name || p.title || 'Unknown'} {p.position ? `(${p.position})` : ''}</li>
                    ))
                ) : (
                    <li>No players on this team yet.</li>
                )}
            </ul>
        </div>
    )
}

export default DisplayTeam;
