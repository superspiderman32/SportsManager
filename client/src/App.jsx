
import { useEffect, useState } from 'react';
import './css/App.css';
import SignIn from './SignIn';
// import HandleUser from './HandleUser';
import DevPannel from './assets/DevPannel';
import Main from './MainContent';
import LeagueCreator from './Leagues/LeagueCreator';
import LeagueSelector from './Leagues/LeagueSelector';


const App = props => {
    const [signedIn, setSignedIn] = useState(false);
    const [username, setUsername] = useState();
    const [password, setPassword] = useState();
    const [successMessage, setSuccessMessage] = useState("");
    const [userID, setUserID] = useState();
    const [userTeam, setUserTeam] = useState(null);
    // data used to render a prompt when user has no team in selected league
    const [createPrompt, setCreatePrompt] = useState(null);

    const [selectedLeague, setSelectedLeague] = useState(null);
    // track the team that belongs to the current league (or null if none)

    // whenever the league or the user ID changes we need to ensure there's a team
    useEffect(() => {
        async function ensureTeam() {
            if (!userID || !selectedLeague || !selectedLeague._id) {
                // clear league-specific team when no league is selected
                return setUserTeam(null);
            }

            try {
                const res = await fetch(`/api/team/${userID}?leagueId=${selectedLeague._id}`);
                if (res.ok) {
                    const team = await res.json();
                    setUserTeam(team);
                    return;
                }
                if (res.status === 404) {
                    // show UI prompt instead of browser confirm
                    setCreatePrompt({ leagueName: selectedLeague.name, leagueId: selectedLeague._id });
                    setUserTeam(null);
                }
            } catch (e) {
                console.error("error ensuring team for league", e);
            }
        }
        ensureTeam();
    }, [selectedLeague, userID]);

    if (signedIn) {
        return (<div>
            {createPrompt && (
                <div style={{background: '#fffae6', padding: 10, borderBottom: '1px solid #ccc'}}>
                    <strong>No team in {createPrompt.leagueName}</strong>.
                    <button
                        style={{marginLeft: 10}}
                        onClick={async () => {
                            try {
                                const createRes = await fetch("/api/team/create", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ userId: userID, leagueId: createPrompt.leagueId })
                                });
                                if (createRes.ok) {
                                    const newTeam = await createRes.json();
                                    setUserTeam(newTeam);
                                    setCreatePrompt(null);
                                } else {
                                    const err = await createRes.json();
                                    console.error("failed to create team", err);
                                }
                            } catch (e) {
                                console.error("error creating team", e);
                            }
                        }}
                    >Create Team</button>
                    <button
                        style={{marginLeft: 5}}
                        onClick={() => setCreatePrompt(null)}
                    >Dismiss</button>
                </div>
            )}
            <header>
                <h2>Welcome to Big Z Sports Manager Simulator {username}!</h2>
                {userTeam && <h3>Your team: {userTeam.name}</h3>}
                <h3>{successMessage}</h3>
                <LeagueSelector setLeague={setSelectedLeague} />
                {selectedLeague && <p>current league: {selectedLeague.name}</p>}
            </header>
            <main>
                <Main userID={userID} league={selectedLeague} userTeam={userTeam} setUserTeam={setUserTeam} />
            </main>
            <footer>
                <LeagueCreator setLeague={setSelectedLeague} userID={userID} selectedLeague={selectedLeague} />
                <DevPannel selectedLeague={selectedLeague} userID={userID} />
            </footer>
        </div>)
    }
    return (<div>
        <header>
            <h2>Welcome to Big Z Sports Manager Simulator!</h2>
        </header>
        <main>
            <SignIn
            setSignedIn={setSignedIn}
            setUsername={setUsername}
            setPassword={setPassword}
            successMessage={successMessage}
            setSuccessMessage={setSuccessMessage}
            setUserID={setUserID}
            setTeam={setUserTeam}
        />

        </main>
        <footer>

        </footer>

    </div>)
}

export default App;