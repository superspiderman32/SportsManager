import { useState } from "react";

const SignIn = (props) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [incorrectMessage,setIncorrectMessage] = useState("");
  const [alreadyExists, setAlreadyExists] = useState(false);

  const submitClicked = async (e) => {
    e.preventDefault();



    try {
      const res = await fetch(`/api/get-current-id/${username}`);
      const data = await res.json();

      if (data && data._id) {
        setAlreadyExists(true);
        console.log("Submitted username:", username);
        console.log("Submitted password:", password);
        if(data.password === password){
          console.log("Passwords match!");
          props.setUsername(username);
          props.setSignedIn(true);
          if (props.setUserID) props.setUserID(data._id);
          if (props.setTeam && data.team) props.setTeam(data.team);
        }
        else{
          console.log("wrong pass");
          setIncorrectMessage("Incorrect Password for " + username + ". Please try again, or type in a different user name to create a new account.")
          
        }
        
      } else if(!alreadyExists) {
        const response = await fetch("/api/user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
          console.log("Submitted username:", username);
          console.log("Submitted password:", password);
          const body = await response.json();
          props.setUsername(username);
          props.setSignedIn(true);
          if (props.setUserID) props.setUserID(body._id);
          if (props.setTeam && body.team) props.setTeam(body.team);
        }
      }
        // console.log("wrong password, should do nothign");
      setAlreadyExists(false);
    } catch (err) {
      console.error("submit error:", err);
    }
  };

  return (
    <div className="signin">
      <h3>Sign in Or Log In!</h3>
      <form onSubmit={submitClicked}>
        <fieldset>
          <label>Username: </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <br /><br />

          <label>Password: </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <br /><br />
        <p>{incorrectMessage}</p>
          <button type="submit">Submit</button>
        </fieldset>
      </form>
    </div>
  );
};

export default SignIn;
