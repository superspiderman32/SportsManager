
import { useState } from "react";
import DisplayPlayers from './Players/DisplayPlayers';
import DisplayTeam from './Players/DisplayTeam';

const Main = (props) =>{
    const [tab, setTab] = useState('players');

    return (
        <div>
            <div style={{marginBottom: 10}}>
                <button onClick={() => setTab('players')} style={{marginRight:6}}>Players</button>
                <button onClick={() => setTab('team')}>My Team</button>
            </div>

            {tab === 'players' && <DisplayPlayers league={props.league} />}
            {tab === 'team' && <DisplayTeam userID={props.userID} league={props.league} userTeam={props.userTeam} setUserTeam={props.setUserTeam} />}

            {/* league components moved to App header/footer */}
        </div>
    );
}

export default Main;