import "../styles/Chat.css"
import {FormEvent, useEffect, useRef, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {fetch_, fetchGetJson, fetchLogOut, socket} from "../common/api.ts";
import ChatList from "./ChatList.tsx";
import {Profile} from "../common/types.ts";

type Message = {
    room_id: number,
    user_id: string,
    message: string
}

export default function Chat() {
    const navigate = useNavigate()
    const {userId} = useParams()
    const [profile, setProfile] = useState<Profile>()
    const [myId, setMyId] = useState<string>()
    const [roomId, setRoomId] = useState<number>()

    const messageInput = useRef<HTMLInputElement | null>(null);
    const [messages, setMessages] = useState<Message[]>([])

    useEffect(() => {
        let _room_id = -1
        let _my_id = "nieistnieje"

        setMessages([])

        async function fn() {
            const { account_id } = await fetchGetJson("/api/myid")
            _my_id = account_id
            setMyId(account_id)

            const { room_id } = await fetchGetJson(`/api/room/${userId}`)
            _room_id = room_id
            setRoomId(room_id)
            socket.emit("join_room", { "user_id": _my_id, "room_id": room_id })

            setMessages((await fetchGetJson(`/api/messages/${room_id}`)).messages.reverse())
        }

        fn()

        fetch_(`/api/matched_profile/${userId}`).then(response => {
            response.json().then(setProfile)
        })

        socket.on("receive_message", onReceiveMessage)

        return () => {
            socket.emit("leave_room", { "user_id": _my_id, "room_id": _room_id })
            socket.off("receive_message", onReceiveMessage)
        }
    }, [userId]);

    function onReceiveMessage(newMessage: Message) {
        setMessages(old => [newMessage, ...old])
    }

    function sendMessage(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (!messageInput.current?.value) return
        const content = messageInput.current.value
        messageInput.current.value = ""
        
        socket.emit("send_message", { "user_id": myId, "room_id": roomId, "message": content })
    }

    return (
        <div className="container">
            <ChatList />
            <main>
                <div className="chat">
                    <div className="chat-name">{profile?.name || "Loading..."}</div>

                    <div className="chat-window">
                        {messages.map((m, i) =>
                            <div className={`message-wrapper message-wrapper-${m.user_id === myId ? "from" : "to"}-me`} key={i}>
                                <div className={`message message-${m.user_id === myId ? "from" : "to"}-me`}>
                                    {m.message}
                                </div>
                            </div>
                        )}
                    </div>

                    <form className="message-form" onSubmit={sendMessage}>
                        <input autoFocus type="text" className="message-input" ref={messageInput}/>
                        <button type="submit">Wyślij</button>
                    </form>
                </div>
            </main>
            <div style={{maxWidth: "20rem"}}>
                <div>
                    <button onClick={() => {
                        fetchLogOut()
                        navigate("/login")
                    }}>
                        Wyloguj się
                    </button>
                </div>
            </div>
        </div>
    )
}
