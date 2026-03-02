import { useState } from "react";

const HandleUser = (props) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    // props.setUsername()


    return (
        <div className="handleuser">
            <h1>Handle User!</h1>
        </div>
    );
};

export default HandleUser;
