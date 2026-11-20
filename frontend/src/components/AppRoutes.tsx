import {Route, Routes, useLocation, useNavigate} from "react-router-dom";
import MainPage from "./MainPage.tsx";
import Chat from "./Chat.tsx";
import LoginPage from "./LoginPage.tsx";
import RegisterPage from "./RegisterPage.tsx";
import EditProfile from "./EditProfile.tsx";
import {useEffect} from "react";
import {fetch_, isLoggedIn} from "../common/api.ts";
import {useStore} from "../common/state.ts";

export default function AppRoutes() {
    const location = useLocation()
    const navigate = useNavigate()
    const setMyId = useStore(state => state.setMyId)
    const myId = useStore(state => state.myId)

    useEffect(() => {
        isLoggedIn().then(is => {
            if (is) {
                if (myId) return

                fetch_("/api/myid").then(res => {
                    res.json().then(json => {
                        setMyId(json.account_id)
                    })
                })
                return
            }

            if (location.pathname !== "/login") {
                navigate(`/login?redirect=${location.pathname}`)
            }
        }).catch(alert)
    }, [myId]); // ESlist marudzi, że nie ma location.pathname w deps, ale tak właśnie ma być, bo to ma sie odpalać tylko przy wejściu na stronę, a nie po każdej zmianie routa

    return (
        <Routes>
            <Route path="/">
                <Route index element={<MainPage />} />
                <Route path="chat/:userId" element={<Chat />} />
                <Route path="login" element={<LoginPage />} />
                <Route path="register" element={<RegisterPage />} />
                <Route path="me" element={<EditProfile />} />
            </Route>
        </Routes>
    )
}
