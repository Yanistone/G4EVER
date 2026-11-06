import type { MenuPageProps } from "../types/entry"
import {
  MenuArtwork0,
  MenuArtwork1,
  MenuArtwork2,
  MenuArtwork3,
} from "../components/artwork/MenuArtwork"
import "../styles/menu.css"

export function MenuPage({ data, onNewGame, onContinue, onOptions, onQuit }: MenuPageProps) {
  return (
    <div
      style={{
        width: "1280px",
        height: "720px",
        boxSizing: "border-box",
        padding: "0",
        position: "relative",
        background: "#2D6BFF",
        color: "#1B1030",
        fontFamily: "'Nunito', system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        gap: "0",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", inset: "0", overflow: "hidden" }}>
        <MenuArtwork0 />
      </div>
      <div
        style={{
          position: "absolute",
          left: "80px",
          top: "122px",
          width: "600px",
          height: "389px",
          boxSizing: "border-box",
          border: "6px solid #1B1030",
          borderRadius: "32px",
          overflow: "hidden",
          background: "#160F38",
          boxShadow: "0 12px 0 #1B1030",
        }}
      >
        <div className={"m-pan"} style={{ position: "absolute", left: "-60px", top: "-40px" }}>
          <MenuArtwork1 />
        </div>
        <div
          style={{
            position: "absolute",
            left: "16px",
            top: "16px",
            display: "flex",
            gap: "10px",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              padding: "8px 18px",
              border: "4px solid #1B1030",
              borderRadius: "999px",
              background: "#FFFFFF",
              boxShadow: "0 5px 0 #1B1030",
              fontFamily: "'Lilita One', 'Arial Black', sans-serif",
              fontWeight: "400",
              fontSize: "18px",
              color: "#1B1030",
              whiteSpace: "nowrap",
            }}
          >
            <MenuArtwork2 />
            {`Boucle n°${data.loopNumber}`}
          </div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              padding: "8px 18px",
              border: "4px solid #1B1030",
              borderRadius: "999px",
              background: "#FF3E7F",
              boxShadow: "0 5px 0 #1B1030",
              fontFamily: "'Lilita One', 'Arial Black', sans-serif",
              fontWeight: "400",
              fontSize: "18px",
              color: "#FFFFFF",
              whiteSpace: "nowrap",
            }}
          >
            {data.time.split(":")[0]}
            <span className={"m-blink"}>{":"}</span>
            {data.time.split(":")[1]}
          </div>
        </div>
        <div style={{ position: "absolute", right: "16px", top: "16px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              padding: "8px 18px",
              border: "4px solid #1B1030",
              borderRadius: "999px",
              background: "#1B1030",
              boxShadow: "0 5px 0 #1B1030",
              fontWeight: "800",
              fontSize: "15px",
              color: "#FFFFFF",
              whiteSpace: "nowrap",
            }}
          >
            <span
              className={"m-blink"}
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: "#FF4B3E",
              }}
            />
            {"APERÇU DU GAMEPLAY"}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            left: "0",
            right: "0",
            bottom: "0",
            height: "12px",
            background: "rgba(255,255,255,.25)",
          }}
        >
          <div
            className={"m-fill"}
            style={{
              height: "100%",
              background: "linear-gradient(90deg,#2EE6FF,#FF3E7F)",
            }}
          />
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: "20px",
          transform: "translateX(-50%)",
          width: "120px",
          height: "120px",
          border: "4px solid #1B1030",
          borderRadius: "26px",
          overflow: "hidden",
          boxShadow: "0 6px 0 #1B1030",
        }}
      >
        <MenuArtwork3 />
      </div>
      <div
        style={{
          position: "absolute",
          right: "150px",
          top: "120px",
          display: "flex",
          flexDirection: "column",
          gap: "26px",
        }}
      >
        <button
          type="button"
          className="game-button"
          onClick={onNewGame}
          style={{
            width: "380px",
            height: "84px",
            boxSizing: "border-box",
            border: "5px solid #1B1030",
            borderRadius: "22px",
            background: "linear-gradient(180deg,#FFF27A,#FFAA00)",
            boxShadow: "0 8px 0 #1B1030",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'Lilita One', 'Arial Black', sans-serif",
            fontWeight: "400",
            fontSize: "32px",
            lineHeight: "1.1",
            letterSpacing: "1px",
            color: "#1B1030",
            textAlign: "center",
          }}
        >
          {"NOUVELLE PARTIE"}
        </button>
        <button
          type="button"
          className="game-button"
          onClick={onContinue}
          disabled={!data.canContinue}
          style={{
            width: "380px",
            height: "84px",
            boxSizing: "border-box",
            border: "5px solid #1B1030",
            borderRadius: "22px",
            background: "#2EE6FF",
            boxShadow: "0 8px 0 #1B1030",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'Lilita One', 'Arial Black', sans-serif",
            fontWeight: "400",
            fontSize: "30px",
            lineHeight: "1.1",
            letterSpacing: "1px",
            color: "#1B1030",
            textAlign: "center",
          }}
        >
          {"CONTINUER"}
          <span
            style={{
              display: "block",
              fontFamily: "Nunito, sans-serif",
              fontWeight: "800",
              fontSize: "14px",
              letterSpacing: "0",
            }}
          >
            {`Boucle n°${data.savedLoopNumber} · ${data.savedTime}`}
          </span>
        </button>
        <button
          type="button"
          className="game-button"
          onClick={onOptions}
          style={{
            width: "380px",
            height: "72px",
            boxSizing: "border-box",
            border: "5px solid #1B1030",
            borderRadius: "22px",
            background: "#FFFFFF",
            boxShadow: "0 8px 0 #1B1030",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'Lilita One', 'Arial Black', sans-serif",
            fontWeight: "400",
            fontSize: "26px",
            lineHeight: "1.1",
            letterSpacing: "1px",
            color: "#1B1030",
            textAlign: "center",
          }}
        >
          {"OPTIONS"}
        </button>
        <button
          type="button"
          className="game-button"
          onClick={onQuit}
          style={{
            width: "380px",
            height: "72px",
            boxSizing: "border-box",
            border: "5px solid #1B1030",
            borderRadius: "22px",
            background: "#FFFFFF",
            boxShadow: "0 8px 0 #1B1030",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'Lilita One', 'Arial Black', sans-serif",
            fontWeight: "400",
            fontSize: "26px",
            lineHeight: "1.1",
            letterSpacing: "1px",
            color: "#1B1030",
            textAlign: "center",
          }}
        >
          {"QUITTER"}
        </button>
      </div>
      <div style={{ position: "absolute", right: "40px", top: "32px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            padding: "8px 18px",
            border: "4px solid #1B1030",
            borderRadius: "999px",
            background: "#FFFFFF",
            boxShadow: "0 5px 0 #1B1030",
            fontWeight: "800",
            fontSize: "16px",
            color: "#1B1030",
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              width: "14px",
              height: "14px",
              borderRadius: "50%",
              background: "#3DDC6A",
              border: "3px solid #1B1030",
            }}
          />
          {data.statusLabel}
        </div>
      </div>
      <p
        style={{
          position: "absolute",
          left: "44px",
          bottom: "30px",
          margin: "0",
          fontSize: "16px",
          fontWeight: "800",
          color: "#FFFFFF",
        }}
      >
        {data.versionLabel}
      </p>
      <p
        style={{
          position: "absolute",
          right: "44px",
          bottom: "30px",
          margin: "0",
          fontSize: "16px",
          fontWeight: "800",
          color: "#FFFFFF",
        }}
      >
        {`Meilleur temps : ${data.bestTime}`}
      </p>
    </div>
  )
}
