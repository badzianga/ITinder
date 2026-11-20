import "../styles/Login.css"
import {SERVER_URL} from "../common/api.ts";
import {Link, useNavigate, useSearchParams} from "react-router-dom";

export default function LoginPage() {
    const navigate = useNavigate()
    const [params] = useSearchParams()

    async function submit(formData: FormData) {
        const response = await fetch(`${SERVER_URL}/auth/login`, {
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
        const redirect = params.get("redirect") || "/"
        navigate(redirect)
    }

    return (
        <div className="container">
            <div className="contentLoginRegister">
            <h1>Zaloguj się</h1>

                <form action={submit}>
                    <div>
                        <label className="data" htmlFor="email">Email  </label>
                        <input required name="email" type="text" placeholder="Email..."/>
                    </div>
                    <div>
                        <label className="data" htmlFor="password">Hasło  </label>
                        <input required name="password" type="password" placeholder="Hasło..."/>
                    </div>
                    <button type="submit">Zaloguj się</button>
                    <div>
                        <label className="nieMaszKonta"> Nie masz konta?&nbsp; </label>
                        <Link to={{
                            pathname: "/register",
                            search: params.toString()
                        }}>
                            <button>Zarejestruj się</button>
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    )
}