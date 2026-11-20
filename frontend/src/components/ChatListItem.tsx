import "../styles/ChatListItem.css"
import {Chat} from "../common/types.ts";
import {staticFileUrl} from "../common/api.ts";
import {useParams} from "react-router-dom";
import {useMemo} from "react";

export default function ChatListItem({chat}: {chat: Chat}) {
    const {userId} = useParams()
    const isSelected = useMemo(() => userId === chat.profile.account_id, [userId, chat])

    return (
        <div className={`chat-list-item${isSelected ? " chat-list-item-selected" : ""}${chat.isNew ? " chat-list-item-new" : ""}`}>
            <div className="chat-list-image">
                <img src={staticFileUrl(chat.profile.photos[0].file_name)} alt="Ryszard Wstrzymoczłowiek" />
            </div>

            <div>
                <div>{chat.profile.name}</div>
                <div>{chat.isNew && "new"}</div>
            </div>
        </div>
    )
}
