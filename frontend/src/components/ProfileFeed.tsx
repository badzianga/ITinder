import ProfileView from "./ProfileView.tsx";
import {useCallback, useEffect, useState} from "react";
import {Match, Profile} from "../common/types.ts";
import {discoverProfiles, fetch_, getMatchedProfile} from "../common/api.ts";
import {socket} from "../common/api.ts"
import {useStore} from "../common/state.ts";
import {wait} from "../common/utils.ts";

export default function ProfileFeed() {
    const [profiles, setProfiles] = useState<{profile: Profile, state: number}[]>([])
    const myId = useStore(state => state.myId)

    const onMatch = useCallback(async (match: Match) => {
        const profile = await getMatchedProfile(match, myId)
        const index = profiles.findIndex(p => p.profile.account_id === profile.account_id)
        if (index === -1) return
        profiles[index].state = 2
        setProfiles([...profiles])
    }, [myId, profiles])


    useEffect(() => {
        discoverProfiles().then(profiles => {
            setProfiles(profiles.map(profile => ({ profile, state: 0 })))
        })
    }, []);

    useEffect(() => {
        if (!myId) return

        socket.on("match", onMatch)

        return () => {
            socket.off("match", onMatch)
        }
    }, [onMatch, myId]);

    async function onNot() {
        let currentIndex = profiles.length - 1
        while (true) {
            if (profiles[currentIndex].state === 0) break
            currentIndex--
            if (currentIndex < 0) {
                return
            }
        }
        profiles[currentIndex].state = -1

        fetch_("/api/react", {
            method: "POST",
            body: JSON.stringify({
                reacted_id: profiles[currentIndex].profile.account_id,
                reaction: 0
            }),
            headers: {"Content-Type": "application/json"}
        })

        setProfiles([...profiles])
        await wait(2500);
        hideProfile(currentIndex)
    }

    async function onHot() {
        let currentIndex = profiles.length - 1
        while (true) {
            if (profiles[currentIndex].state === 0) break
            currentIndex--
            if (currentIndex < 0) {
                return
            }
        }
        profiles[currentIndex].state = 1
        // setProfiles([...profiles])
        // return

        fetch_("/api/react", {
            method: "POST",
            body: JSON.stringify({
                reacted_id: profiles[currentIndex].profile.account_id,
                reaction: 1
            }),
            headers: {"Content-Type": "application/json"}
        })

        setProfiles([...profiles])
        await wait(2500);
        hideProfile(currentIndex)
    }

    const hideProfile = useCallback((index: number) => {
        if (profiles[index].state !== 2) {
            profiles[index].state = -2
            setProfiles([...profiles])
        }
    }, [profiles])

    const onDismiss = useCallback((index: number) => {
        profiles[index].state = 3
        setProfiles([...profiles])
    }, [profiles])

    const getProfileClass = useCallback((state: number) => {
        switch (state) {
            case -1:
                return "not-profile"
            case 1:
                return "hot-profile"
            case 2:
                return "match-profile"
            case 3:
                return "dismiss-profile"
            default:
                return ""
        }
    }, [])

    return (
        <div>
            <div className="profile-window">
                <div className="no-more-profiles">
                    <div>
                        <div><span style={{fontSize: "x-large", fontWeight: "bold"}}>To już koniec</span></div>
                        <div><span>Aby przeglądać więcej nowych osób, poczekaj na nowych użytkowników, lub poszerz swoje preferencje</span>
                        </div>
                    </div>
                </div>
                {profiles.map((p, i) => <>
                    {p.state !== -2 && <ProfileView
                        profile={p.profile}
                        className={getProfileClass(p.state)}
                        cardIndex={i}
                        onDismiss={onDismiss}
                        key={p.profile.account_id}
                    />}
                </>)}
            </div>
            <div className="hot-or-not">
                <button className="hot-button" onClick={onHot}>HOT<span className="material-icons">local_fire_department</span></button>
                <button className="not-button" onClick={onNot}>NOT<span className="material-icons">close</span></button>
            </div>
            <button className="not-button" onClick={() => {
                fetch_("/api/react", {method: "DELETE"})
            }}>CLEAR DATABASE</button>
        </div>
    )
}
