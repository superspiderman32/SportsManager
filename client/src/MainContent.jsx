
import { useState } from "react";
import DisplayPlayers from './Players/DisplayPlayers';

const Main = (props) =>{
    return (
        <div>
            <p>main</p>
            <DisplayPlayers league={props.league} />
            {/* league components moved to App header/footer */}
        </div>
    );
}

export default Main;