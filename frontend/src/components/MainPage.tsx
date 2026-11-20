import "../styles/Profile.css"
import {Link, useNavigate} from "react-router-dom";
import {fetchLogOut} from "../common/api.ts";
import ProfileFeed from "./ProfileFeed.tsx";
import ChatList from "./ChatList.tsx";
import {useStore} from "../common/state.ts";

export default function MainPage() {
    const navigate = useNavigate()
    const myId = useStore(state => state.myId)

    return (
        <div className="container">
            <ChatList />
            <main>
                <ProfileFeed />
            </main>
            <div style={{maxWidth: "20rem"}}>
                <Link to="/me">
                    <button>Edytuj profil</button>
                </Link>
                <div>
                    <button onClick={() => {
                        fetchLogOut()
                        navigate("/login")
                    }}>Wyloguj się
                    </button>
                </div>
            </div>
        </div>
    )
}
