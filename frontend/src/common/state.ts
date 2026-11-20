import { create } from 'zustand'

interface Store {
    myId: string
    setMyId: (myId: string) => void
}

export const useStore = create<Store>((set) => ({
    myId: "",
    setMyId: myId => set(() => ({ myId }))
}))
