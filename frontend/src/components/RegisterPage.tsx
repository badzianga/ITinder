import "../styles/Login.css"
import {SERVER_URL} from "../common/api.ts";
import {useNavigate} from "react-router-dom";

export default function RegisterPage() {
    const navigate = useNavigate()

    async function submit(formData: FormData) {
        const password = formData.get("password")
        const password2 = formData.get("password2")
        formData.delete("password2")

        if (password !== password2) {
            alert("Hasła są różne!")
            return
        }
        const response = await fetch(`${SERVER_URL}/auth/register`, {
            method: "POST",
            body: formData
        })

        const body = await response.json()
        if (!response.ok) {
            alert(body.message)
            return
        }
        const token = body.access_token
        localStorage.setItem("access_token", token)
        navigate("/me")
    }

    return (
        <div className="container">
            <div className="contentLoginRegister">
                <h1>Zarejestruj się</h1>

                <div className="formContainer">
                    <form action={submit}>
                        <div className="formGroup">
                            <label className="data" htmlFor="email">Email  </label>
                            <input required name="email" type="text" placeholder="Email..."/>
                        </div>
                        <div className="formGroup">
                            <label className="data" htmlFor="password">Hasło  </label>
                            <input required name="password" type="password" placeholder="Hasło..."/>
                        </div>
                        <div className="formGroup">
                            <label className="data" htmlFor="password2">Powtórz hasło  </label>
                            <input required name="password2" type="password" placeholder="Powtórz hasło..."/>
                        </div>
                        <button type="submit">Zarejestruj się</button>
                    </form>
                </div>
            </div>
        </div>
    )
}