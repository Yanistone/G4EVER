import { useState } from "react"
import type { PlayerProfile } from "../types/profile"
import { LaunchArtwork1 } from "../components/artwork/LaunchArtwork"
import "../styles/auth.css"

interface AuthPageProps {
  profiles: readonly PlayerProfile[]
  error: string | null
  onLogin: (nickname: string) => boolean
  onRegister: (nickname: string) => boolean
  onSuccess: () => void
  onClearError: () => void
}

export function AuthPage({
  profiles,
  error,
  onLogin,
  onRegister,
  onSuccess,
  onClearError,
}: AuthPageProps) {
  const [mode, setMode] = useState<"login" | "register">(profiles.length ? "login" : "register")
  const [nickname, setNickname] = useState("")
  const changeMode = (next: "login" | "register") => {
    setMode(next)
    onClearError()
  }
  return (
    <div className="auth-page">
      <div className="auth-rays" aria-hidden="true"></div>
      <div className="auth-brand">
        <LaunchArtwork1 />
        <h1>
          TA JOURNÉE.
          <br />
          TES CHOIX.
          <br />
          <span>TA BOUCLE.</span>
        </h1>
        <p>Retrouve Noah, explore le campus et remonte à l’origine du bug.</p>
      </div>
      <section className="auth-card" aria-label="Connexion aux profils locaux">
        <div className="auth-tabs" role="tablist" aria-label="Accès au jeu">
          <button
            role="tab"
            aria-selected={mode === "login"}
            className={mode === "login" ? "is-active" : ""}
            onClick={() => changeMode("login")}
          >
            CONNEXION
          </button>
          <button
            role="tab"
            aria-selected={mode === "register"}
            className={mode === "register" ? "is-active" : ""}
            onClick={() => changeMode("register")}
          >
            CRÉER UN PROFIL
          </button>
        </div>
        <h2>{mode === "login" ? "Bon retour, aventurier !" : "Prêt à briser la boucle ?"}</h2>
        <p className="auth-description">
          {mode === "login"
            ? "Choisis ton profil pour retrouver ta progression."
            : "Choisis ton pseudo. Tes découvertes seront sauvegardées automatiquement."}
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            if ((mode === "login" ? onLogin : onRegister)(nickname)) onSuccess()
          }}
        >
          <label htmlFor="nickname">TON PSEUDO</label>
          <input
            id="nickname"
            name="nickname"
            autoComplete="nickname"
            minLength={2}
            maxLength={24}
            required
            value={nickname}
            onChange={(event) => {
              setNickname(event.target.value)
              onClearError()
            }}
            placeholder="Ex. Robin"
            aria-describedby="profile-note"
          />
          {mode === "login" && profiles.length > 0 && (
            <div className="profile-list" aria-label="Profils disponibles">
              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  className="profile-chip"
                  onClick={() => setNickname(profile.nickname)}
                >
                  {profile.nickname}
                </button>
              ))}
            </div>
          )}
          {error && (
            <p role="alert" className="auth-error">
              {error}
            </p>
          )}
          <button className="game-button auth-submit" type="submit">
            {mode === "login" ? "SE CONNECTER ▸" : "CRÉER ET JOUER ▸"}
          </button>
        </form>
        <p id="profile-note" className="auth-local-note">
          <strong>Profils locaux de démonstration.</strong>
          <br />
          Enregistrés sur cet appareil, sans mot de passe ni compte serveur.
        </p>
      </section>
      <p className="auth-footer">Institut G4 · G4EVER</p>
    </div>
  )
}
