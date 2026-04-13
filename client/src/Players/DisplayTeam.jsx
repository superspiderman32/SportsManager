import { useEffect, useState } from "react";

const DisplayTeam = (props) => {
    const { userID, league, userTeam, setUserTeam } = props;
    const [loading, setLoading] = useState(false);
    const [team, setTeam] = useState(userTeam || null);
    const [playerStats, setPlayerStats] = useState({});
    const [undraftedPlayers, setUndraftedPlayers] = useState([]);
    const [activeTab, setActiveTab] = useState('Forwards');

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

    // fetch undrafted players for the league
    useEffect(() => {
        async function fetchUndrafted() {
            if (!league || !league._id) {
                setUndraftedPlayers([]);
                return;
            }
            try {
                const res = await fetch('/api/get-all-undrafted');
                const data = res.ok ? await res.json() : [];
                let filtered = data.filter(p => {
                    if (!p.leagueId) return false;
                    const lid = p.leagueId && (p.leagueId.toString ? p.leagueId.toString() : String(p.leagueId));
                    return String(lid) === String(league._id);
                });
                setUndraftedPlayers(filtered);
            } catch (e) {
                console.error('Error fetching undrafted players:', e);
                setUndraftedPlayers([]);
            }
        }
        fetchUndrafted();

        const handler = () => fetchUndrafted();
        window.addEventListener('leaguesChanged', handler);
        return () => window.removeEventListener('leaguesChanged', handler);
    }, [league]);

    // fetch per-player stats using the new endpoint
    useEffect(() => {
        async function fetchPlayerStatsForTeam(t) {
            if (!t || !t.players || !t.players.length) {
                setPlayerStats({});
                return;
            }

            const map = {};
            await Promise.all(t.players.map(async (p) => {
                if (!p) return; // Skip null/undefined players
                const id = p._id || p.id;
                if (!id) return;
                try {
                    const res = await fetch(`/api/player/stats/${id}`);
                    if (res.ok) {
                        const data = await res.json();
                        map[id] = data;
                    } else {
                        map[id] = null;
                    }
                } catch (e) {
                    console.error("failed to fetch player stats", e);
                    map[id] = null;
                }
            }));

            setPlayerStats(map);
        }

        fetchPlayerStatsForTeam(team);
    }, [team]);

    if (!league) return <div>Select a league to view your team.</div>;
    if (loading) return <div>Loading team...</div>;
    if (!team) return <div>You don't have a team in this league.</div>;

    const rosterSize = 23;

    function handleDragOver(e) {
        e.preventDefault();
    }

    // compute base offsets for categories within the global team.players array
    const baseOffsets = {
        Forwards: 0,
        Defense: 12,
        Goalies: 18
    };

    async function handleDrop(e, category, slotIndexInCategory) {
        e.preventDefault();
        let payload = null;
        try {
            const raw = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain');
            payload = raw ? JSON.parse(raw) : null;
        } catch (err) {
            try {
                const raw = e.dataTransfer.getData('text/plain');
                payload = { id: raw };
            } catch (e2) {
                payload = null;
            }
        }

        if (!payload || !payload.id) return;

        const base = baseOffsets[category] || 0;
        const globalSlotIndex = base + Number(slotIndexInCategory || 0);

        try {
            const res = await fetch(`/api/team/${team._id}/add-player`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId: payload.id, slotIndex: globalSlotIndex })
            });
            if (res.ok) {
                const data = await res.json();
                if (data && data.team) {
                    setTeam(data.team);
                    // refresh undrafted list elsewhere
                    window.dispatchEvent(new Event('leaguesChanged'));
                }
            } else {
                console.error('Failed to add player to team', await res.text());
            }
        } catch (err) {
            console.error('Error adding player to team', err);
        }
    }

    // build category slots and populate from team.players by matching position
    const forwardSlots = Array.from({ length: 12 }).map((_, i) => ({ idx: i, player: null }));
    const defenseSlots = Array.from({ length: 6 }).map((_, i) => ({ idx: i, player: null }));
    const goalieSlots = Array.from({ length: 2 }).map((_, i) => ({ idx: i, player: null }));

    // populate slots from team.players array
    if (Array.isArray(team.players)) {
        for (let i = 0; i < 12; i++) {
            forwardSlots[i].player = team.players[i] || null;
        }
        for (let i = 0; i < 6; i++) {
            defenseSlots[i].player = team.players[12 + i] || null;
        }
        for (let i = 0; i < 2; i++) {
            goalieSlots[i].player = team.players[18 + i] || null;
        }
    }

    return (
        <div>
            <h4>{team.name}</h4>
            
            <div style={{ display: 'flex', gap: 16 }}>
                {/* Sidebar with available players - organized by position */}
                <div style={{ minWidth: 400, maxWidth: 500, borderRight: '1px solid #ccc', paddingRight: 16, maxHeight: 600, overflow: 'auto' }}>
                    <h5 style={{ margin: '0 0 12px 0' }}>Available Players</h5>
                    
                    <div className="position-columns">
                    {/* Forwards */}
                    <div style={{ marginBottom: 16 }}>
                        <h6 className="position-header" style={{ margin: '0 0 8px 0', color: '#333' }}>Forwards</h6>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {undraftedPlayers.filter(p => String(p.preferedPosition).toLowerCase().includes('forward')).map(p => {
                                const overall = Math.round((p.overallOffense + p.overallDefense) / 2);
                                return (
                                    <li key={p._id} draggable={true} onDragStart={(e) => {
                                        try { e.dataTransfer.setData('application/json', JSON.stringify({ id: p._id, name: `${p.firstName} ${p.lastName}`, position: p.preferedPosition })); } catch (err) { e.dataTransfer.setData('text/plain', p._id); }
                                    }} style={{ padding: 6, border: '1px solid #ddd', marginBottom: 4, cursor: 'move', borderRadius: 3, fontSize: 11, background: '#f9f9f9', transition: 'all 0.2s' }}
                                       onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
                                       onMouseLeave={(e) => e.currentTarget.style.background = '#f9f9f9'}>
                                        <div style={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.firstName} {p.lastName}</div>
                                        <div style={{ color: '#666', fontSize: 10 }}>F • {overall.toFixed(0)}</div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {/* Defense */}
                    <div style={{ marginBottom: 16 }}>
                        <h6 className="position-header" style={{ margin: '0 0 8px 0', color: '#333' }}>Defense</h6>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {undraftedPlayers.filter(p => String(p.preferedPosition).toLowerCase().includes('defence') || String(p.preferedPosition).toLowerCase().includes('defense')).map(p => {
                                const overall = Math.round((p.overallOffense + p.overallDefense) / 2);
                                return (
                                    <li key={p._id} draggable={true} onDragStart={(e) => {
                                        try { e.dataTransfer.setData('application/json', JSON.stringify({ id: p._id, name: `${p.firstName} ${p.lastName}`, position: p.preferedPosition })); } catch (err) { e.dataTransfer.setData('text/plain', p._id); }
                                    }} style={{ padding: 6, border: '1px solid #ddd', marginBottom: 4, cursor: 'move', borderRadius: 3, fontSize: 11, background: '#f9f9f9', transition: 'all 0.2s' }}
                                       onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
                                       onMouseLeave={(e) => e.currentTarget.style.background = '#f9f9f9'}>
                                        <div style={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.firstName} {p.lastName}</div>
                                        <div style={{ color: '#666', fontSize: 10 }}>D • {overall.toFixed(0)}</div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {/* Goalies */}
                    <div style={{ marginBottom: 16 }}>
                        <h6 className="position-header" style={{ margin: '0 0 8px 0', color: '#333' }}>Goalies</h6>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {undraftedPlayers.filter(p => String(p.preferedPosition).toLowerCase().includes('goalie')).map(p => {
                                const isGoalie = String(p.preferedPosition).toLowerCase().includes('goalie');
                                const overall = isGoalie 
                                    ? (p.goalie ? Object.values(p.goalie).filter(v => typeof v === 'number').reduce((a, b) => a + b, 0) / Object.values(p.goalie).filter(v => typeof v === 'number').length : 'N/A')
                                    : Math.round((p.overallOffense + p.overallDefense) / 2);
                                return (
                                    <li key={p._id} draggable={true} onDragStart={(e) => {
                                        try { e.dataTransfer.setData('application/json', JSON.stringify({ id: p._id, name: `${p.firstName} ${p.lastName}`, position: p.preferedPosition })); } catch (err) { e.dataTransfer.setData('text/plain', p._id); }
                                    }} style={{ padding: 6, border: '1px solid #ddd', marginBottom: 4, cursor: 'move', borderRadius: 3, fontSize: 11, background: '#f9f9f9', transition: 'all 0.2s' }}
                                       onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
                                       onMouseLeave={(e) => e.currentTarget.style.background = '#f9f9f9'}>
                                        <div style={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.firstName} {p.lastName}</div>
                                        <div style={{ color: '#666', fontSize: 10 }}>G • {typeof overall === 'number' ? overall.toFixed(0) : overall}</div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                    </div>
                </div>

                {/* Roster builder */}
                <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: 12 }}>
                        <button onClick={() => setActiveTab('Forwards')} style={{ marginRight: 6 }}>Forwards</button>
                        <button onClick={() => setActiveTab('Defense')} style={{ marginRight: 6 }}>Defense</button>
                        <button onClick={() => setActiveTab('Goalies')}>Goalies</button>
                    </div>

            {activeTab === 'Forwards' && (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                        {forwardSlots.map(s => (
                            <div key={s.idx} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'Forwards', s.idx)} style={{ minHeight: 80, border: '1px dashed #888', padding: 8, borderRadius: 4, background: s.player ? '#f6f6f6' : '#fff' }}>
                                {s.player ? (
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>{s.idx + 1}. {s.player.firstName && s.player.lastName ? `${s.player.firstName} ${s.player.lastName}` : s.player.name || 'Unknown'}</div>
                                        <div>{s.player.position || 'Forward'}</div>
                                        <div>
                                            {playerStats && playerStats[s.player._id] ? (
                                                String(playerStats[s.player._id].position).toLowerCase() === 'goalie' 
                                                    ? `Goalie: ${playerStats[s.player._id].overallGoalie !== null ? playerStats[s.player._id].overallGoalie.toFixed(1) : 'N/A'}`
                                                    : `Off: ${playerStats[s.player._id].overallOffense ? playerStats[s.player._id].overallOffense.toFixed(0) : 'N/A'} / Def: ${playerStats[s.player._id].overallDefense ? playerStats[s.player._id].overallDefense.toFixed(0) : 'N/A'}`
                                            ) : 'Loading stats...'}
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ color: '#666' }}>Drop forward here</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'Defense' && (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                        {defenseSlots.map(s => (
                            <div key={s.idx} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'Defense', s.idx)} style={{ minHeight: 80, border: '1px dashed #888', padding: 8, borderRadius: 4, background: s.player ? '#f6f6f6' : '#fff' }}>
                                {s.player ? (
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>{s.idx + 1}. {s.player.firstName && s.player.lastName ? `${s.player.firstName} ${s.player.lastName}` : s.player.name || 'Unknown'}</div>
                                        <div>{s.player.position || 'Defense'}</div>
                                        <div>
                                            {playerStats && playerStats[s.player._id] ? (
                                                String(playerStats[s.player._id].position).toLowerCase() === 'goalie' 
                                                    ? `Goalie: ${playerStats[s.player._id].overallGoalie !== null ? playerStats[s.player._id].overallGoalie.toFixed(1) : 'N/A'}`
                                                    : `Off: ${playerStats[s.player._id].overallOffense ? playerStats[s.player._id].overallOffense.toFixed(0) : 'N/A'} / Def: ${playerStats[s.player._id].overallDefense ? playerStats[s.player._id].overallDefense.toFixed(0) : 'N/A'}`
                                            ) : 'Loading stats...'}
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ color: '#666' }}>Drop defense here</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'Goalies' && (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: 8 }}>
                        {goalieSlots.map(s => (
                            <div key={s.idx} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'Goalies', s.idx)} style={{ minHeight: 80, border: '1px dashed #888', padding: 8, borderRadius: 4, background: s.player ? '#f6f6f6' : '#fff' }}>
                                {s.player ? (
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>{s.idx + 1}. {s.player.firstName && s.player.lastName ? `${s.player.firstName} ${s.player.lastName}` : s.player.name || 'Unknown'}</div>
                                        <div>{s.player.position || 'Goalie'}</div>
                                        <div>
                                            {playerStats && playerStats[s.player._id] ? (
                                                String(playerStats[s.player._id].position).toLowerCase() === 'goalie' 
                                                    ? `Goalie: ${playerStats[s.player._id].overallGoalie !== null ? playerStats[s.player._id].overallGoalie.toFixed(1) : 'N/A'}`
                                                    : `Off: ${playerStats[s.player._id].overallOffense} / Def: ${playerStats[s.player._id].overallDefense}`
                                            ) : 'Loading stats...'}
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ color: '#666' }}>Drop goalie here</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
                </div>
            </div>
        </div>
    )
}

export default DisplayTeam;
