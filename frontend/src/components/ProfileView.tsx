import {Profile} from "../common/types.ts";
import {staticFileUrl} from "../common/api.ts";
import {Link} from "react-router-dom";

type ProfileViewProps = {
    profile: Profile
    className?: string
    cardIndex: number
    onDismiss: (index: number) => void
}

export default function ProfileView({profile, className = "", cardIndex, onDismiss}: ProfileViewProps) {
    return (
        <div className={`profile ${className}`}>
            <div className="match-text">MATCH</div>
            <div className="image-column">
                <img
                    src={staticFileUrl(profile.photos[0].file_name)}
                    alt="Ryszard Kramarz"/>
            </div>
            <div className="bio-column">
                <div className="info-bar">
                    <div className="name"><span style={{fontWeight: "700"}}>{profile.name}</span> {profile.age}</div>
                </div>
                <div className="bio">
                    <p>{profile.description}</p>
                </div>
                <div className="match-buttons">
                    <Link to={`/chat/${profile.account_id}`}>
                        <button>Napisz coś</button>
                    </Link>
                    <button onClick={() => onDismiss(cardIndex)}>OK</button>
                </div>
            </div>
        </div>)
}