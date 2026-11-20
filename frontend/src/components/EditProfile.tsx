import {FormEvent, useEffect, useState} from "react";
import "../styles/EditProfile.css"
import {Preference, Profile} from "../common/types.ts";
import {fetch_, staticFileUrl} from "../common/api.ts";
import {useNavigate} from "react-router-dom";

export default function EditProfile() {
    const navigate = useNavigate()

    const [profile, setProfile] = useState<Profile | undefined>()
    const [preference, setPreference] = useState<Preference | undefined>()
    const [photo, setPhoto] = useState<string | undefined>()
    const [isFirst, setIsFirst] = useState(true)

    useEffect(() => {
        // TODO: jak nie jest zalogowany, to i tak sie wysyła, bo ten useEffect jest wcześniej niż ten w AppRoutes, nic strasznego, ale trochę bez sensu
        fetch_("/api/me").then(async response => {
            if (response.ok) {
                setIsFirst(false)
                const body = await response.json()
                setProfile(body.profile)
                setPreference(body.preference)
                setPhoto(staticFileUrl(body.profile.photos[0].file_name))
            }
        })
    }, []);

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)

        await fetch_("/api/me", {
            method: isFirst ? "PUT" : "POST",
            body: formData
        })
        navigate("/")
    }

    return (
        <div className="containerEdit">
           <div>
                <h1>{isFirst ? "Utwórz profil" : "Edytuj profil"}</h1>

                    <div className="formContainer">
                        <form onSubmit={submit}>
                            <img className="imgEdit"
                                src={photo}
                                style={{width: "15rem", marginBottom: "3rem"}}
                            />

                            <div className="formGroup2">
                                <label className="data" htmlFor="name">Imię</label>
                                <input required name="name" type="text" placeholder="Imię..." defaultValue={profile?.name}/>
                            </div>
                            <div className="formGroup2">
                                <label className="data" htmlFor="age">Wiek</label>
                                <input required name="age" type="number" min="18" max="99" placeholder="Wiek..."
                                    defaultValue={profile?.age}/>
                            </div>
                            <div className="formGroup2">
                                <label className="data" htmlFor="gender">Płeć</label>
                                <select name="gender" value={profile?.gender} onChange={event => {
                                    if (profile) {
                                        setProfile({...profile, gender: event.target.value as "Male" | "Female"})
                                    }
                                }}>
                                    <option value="Male">Mężczyzna</option>
                                    <option value="Female">Kobieta</option>
                                </select>
                            </div>
                            <div className="formGroup2">
                                <label className="data" htmlFor="description">Opis</label>
                                <textarea required name="description" placeholder="Opis..." defaultValue={profile?.description}/>
                            </div>
                            <div className="formGroup2">
                            <label className="data" htmlFor="photo">Your hottest photo</label>
                            <div className="file-input-container">
                                <label className="file-label">
                                <span className="file-button">Wybierz plik</span>
                                <span className="file-name">Nie wybrano pliku</span>
                                <input 
                                    className="file-input"
                                    name="photo"
                                    placeholder="Upload your hottest photo!"
                                    required={isFirst}
                                    type="file"
                                    onChange={(event) => {
                                        if (!event.target.files?.length) return;
                                        const fileName = event.target.files[0]?.name || "Nie wybrano pliku";
                                        const fileNameElement = event.target.parentElement?.querySelector(".file-name");
                                        if (fileNameElement) {
                                            fileNameElement.textContent = fileName;
                                        }
                                        const fileUrl = URL.createObjectURL(event.target.files[0]);
                                        setPhoto(fileUrl);
                                    }}
                                />
                                </label>
                            </div>
                            </div>

                            <div style={{height: "3rem"}}></div>
                            <span className="data">Preferencje</span>

                            <div className="formGroup2">
                                <label className="data" htmlFor="age">Minimalny wiek</label>
                                <input required name="preferred_min_age" type="number" min="18" max="99"
                                    placeholder="Wiek..." defaultValue={preference?.preferred_min_age}
                                />
                            </div>
                            <div className="formGroup2">
                                <label className="data" htmlFor="age">Maksymalny wiek</label>
                                <input required name="preferred_max_age" type="number" min="18" max="99"
                                    placeholder="Wiek..." defaultValue={preference?.preferred_max_age}
                                />
                            </div>
                            <div className="formGroup2">
                                <label className="data" htmlFor="gender">Preferowana płeć</label>
                                <select name="preferred_gender" value={preference?.preferred_gender} onChange={event => {
                                    if (preference) {
                                        setPreference({...preference, preferred_gender: event.target.value as "Male" | "Female"})
                                    }
                                }}>
                                    <option value="Male">Mężczyźni</option>
                                    <option value="Female">Kobiety</option>
                                </select>
                            </div>

                            <div style={{height: "3rem"}}></div>
                            <button type="submit">Zapisz</button>
                        </form>
                    </div>
            </div>
        </div>
    )
}