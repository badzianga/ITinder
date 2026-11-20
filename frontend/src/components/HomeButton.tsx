import "../styles/HomeButton.css"

export default function HomeButton({onPress}: {onPress?: (() => void)}) {
    return (
        <button className="back-to-swiping" onClick={onPress}><span className="material-icons">home</span></button>
    )
}
