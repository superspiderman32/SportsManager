
import { useState } from "react";
import DisplayPlayers from './Players/DisplayPlayers';
import League from './Leagues/League.jsx';

const Main = (props) =>{
    return (
        <div> <p>main</p> 
        <League />
        <DisplayPlayers />
        </div>
    );

}

export default Main;