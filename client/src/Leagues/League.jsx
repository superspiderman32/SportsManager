import { useState } from "react";
import LeagueCreator from './LeagueCreator';
import LeagueSelector from './LeagueSelector';

const Leagues = (props) =>{
 const [League, setLeague] = useState();

    return(
        <div id="LeagueDiv">
            <LeagueCreator setLeague={setLeague}/>
            <LeagueSelector setLeague={setLeague}/>
        </div>
    );
}

export default Leagues