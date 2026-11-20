import {Link} from "react-router-dom";
import HomeButton from "./HomeButton.tsx";
import ChatListItem from "./ChatListItem.tsx";
import {Chat, Match, Profile} from "../common/types.ts";
import {useCallback, useEffect, useState} from "react";
import {fetch_, getMatchedProfile, socket} from "../common/api.ts";
import {useStore} from "../common/state.ts";

export default function ChatList() {
    const [chats, setChats] = useState<Chat[]>([])
    const myId = useStore(state => state.myId)

    const onMatch = useCallback(async (match: Match) => {
        const profile = await getMatchedProfile(match, myId)
        setChats([{ profile, isNew: true }, ...chats])
    }, [myId, chats])

    useEffect(() => {
        if (!myId) return

        socket.on("match", onMatch)

        return () => {
            socket.off("match", onMatch)
        }
    }, [onMatch, myId])

    useEffect(() => {

        fetch_("/api/matched_profiles").then(res => {
            res.json().then(json => {
                setChats(json.profiles.map((p: Profile) => ({profile: p, unread: 0})))
            })
        })

    }, []);

    return (
        <nav>
            <Link to="/">
                <HomeButton/>
            </Link>
            <span className="your-chats">Twoje pary</span>
            {chats.map(chat =>
                <Link to={`/chat/${chat.profile.account_id}`} key={chat.profile.account_id}>
                    <ChatListItem chat={chat} />
                </Link>
            )}
        </nav>
    )
}
