
import { useEffect, useState } from 'react';
import './css/App.css';
import SignIn from './SignIn';
// import HandleUser from './HandleUser';
import DevPannel from './assets/DevPannel';
import Main from './MainContent';


const App = props => {
    const [signedIn, setSignedIn] = useState(false);
    const [username, setUsername] = useState();
    const [password, setPassword] = useState();
    const [successMessage, setSuccessMessage] = useState("");
    const [userID, setUserID] = useState();

    if (signedIn) {
        return (<div>
            <header>
                <h2>Welcome to Big Z Sports Manager Simulator {username}!</h2>
                <h3>{successMessage}</h3>
            </header>
            <main>
                <Main userID={userID}/>
                <DevPannel />

            </main>
            <footer>

            </footer>

        </div>)
    }
    return (<div>
        <header>
            <h2>Welcome to Big Z Sports Manager Simulator!</h2>
        </header>
        <main>
            <SignIn setSignedIn={setSignedIn} setUsername={setUsername} setPassword={setPassword} successMessage={successMessage} setSuccessMessage={setSuccessMessage} />

        </main>
        <footer>

        </footer>

    </div>)
}

export default App;