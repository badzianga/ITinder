export type Profile = {
    account_id: string
    name: string
    age: number
    gender: "Male" | "Female"
    description: string
    photos: Photo[]
}

export type Photo = {
    file_name: string
    position: number
}

export type Preference = {
    preferred_min_age: number
    preferred_max_age: number
    preferred_gender: "Male" | "Female"
}

export type Chat = {
    profile: Profile
    isNew: boolean
}

export type Match = {
    first_id: string
    second_id: string
    id: number
}
