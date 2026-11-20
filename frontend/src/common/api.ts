import {Match, Profile} from "./types.ts";
import {io} from "socket.io-client";

// export const SERVER_URL = "http://172.17.54.103:5000"
export const SERVER_URL = "http://127.0.0.1:5000"
// export const SERVER_URL = "http://127.0.0.1:5001"

export const socket = io(SERVER_URL)

function getLocalToken() {
    return localStorage.getItem("access_token")
}

export function fetch_(endpoint: string, init?: RequestInit): Promise<Response> {
    const token = getLocalToken()
    return fetch(`${SERVER_URL}${endpoint}` , { ...init, headers: { ...init?.headers, "Authorization": `Bearer ${token}` } })
}

export async function fetchGetJson(endpoint: string, init?: RequestInit) {
    const response = await fetch_(endpoint, init)
    return response.json()
}

export async function fetchSecretTest() {
    const response = await fetch_("/api/secret")
    console.log(response.status)
}

export async function isLoggedIn() {
    const token = getLocalToken()
    if (!token) return false

    const response = await fetch_("/auth/is_logged_in", {method: "POST"})
    if (response.ok) return true

    localStorage.removeItem("access_token")
    return false
}

export async function fetchLogOut() {
    const response = await fetch_("/auth/logout", {method: "POST"})
    console.log(response.status)
    if (response.ok) {
        localStorage.removeItem("access_token")
    }
}

export async function myProfileExists() {
    const response = await fetch_("/api/me")
    return response.ok
}

export function staticFileUrl(fileName: string) {
    return SERVER_URL + "/static/" + fileName
}

export async function discoverProfiles(): Promise<Profile[]> {
    const response = await fetch_("/api/discover/10", {method: "GET"})
    return (await response.json()).profiles
}

export async function getMatchedProfile(match: Match, myId: string): Promise<Profile> {
    let otherId
    if (match.first_id === myId || !myId) {
        otherId = match.second_id
    }
    else if (match.second_id === myId) {
        otherId = match.first_id
    }
    else {
        console.log("nie mój match")
    }

    console.log(`my id: ${myId}, other id: ${otherId}, room: ${match.id}`)

    const response = await fetch_(`/api/matched_profile/${otherId}`)
    return response.json()
}
