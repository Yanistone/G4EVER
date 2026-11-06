import { useCallback, useEffect, useRef } from "react"
import type { LaunchPageProps } from "../types/entry"
import {
  LaunchArtwork0,
  LaunchArtwork1,
  LaunchArtwork2,
  LaunchArtwork3,
  LaunchArtwork4,
  LaunchArtwork5,
  LaunchArtwork6,
  LaunchArtwork7,
  LaunchArtwork8,
  LaunchArtwork9,
} from "../components/artwork/LaunchArtwork"
import "../styles/launch.css"

export function LaunchPage({ data, onStart }: LaunchPageProps) {
  const hasStarted = useRef(false)
  const start = useCallback(() => {
    if (hasStarted.current) return
    hasStarted.current = true
    onStart()
  }, [onStart])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return
      if (event.key === "Enter" || event.key.length === 1) {
        event.preventDefault()
        start()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [start])
  return (
    <div
      onClick={start}
      role="region"
      aria-label="Écran de lancement G4EVER"
      style={{
        width: "1280px",
        height: "720px",
        boxSizing: "border-box",
        padding: "0",
        position: "relative",
        background: "#0E0A26",
        color: "#1B1030",
        fontFamily: "'Nunito', system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        gap: "0",
        overflow: "hidden",
      }}
    >
      <div className={"sp-all"} style={{ position: "absolute", inset: "0" }}>
        <div
          className={"sp-rays"}
          style={{ position: "absolute", inset: "0", background: "#2D6BFF" }}
        >
          <LaunchArtwork0 />
        </div>
        <div
          className={"sp-term"}
          style={{
            position: "absolute",
            left: "180px",
            top: "200px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <p
            className={"sp-l0"}
            style={{
              margin: "0",
              fontFamily: "'Courier New', ui-monospace, monospace",
              fontSize: "22px",
              fontWeight: "700",
              color: "#C9D1FF",
            }}
          >
            {data.terminalLines[0]}
          </p>
          <p
            className={"sp-l1"}
            style={{
              margin: "0",
              fontFamily: "'Courier New', ui-monospace, monospace",
              fontSize: "22px",
              fontWeight: "700",
              color: "#3DDC6A",
            }}
          >
            {data.terminalLines[1]}
          </p>
          <p
            className={"sp-l2"}
            style={{
              margin: "0",
              fontFamily: "'Courier New', ui-monospace, monospace",
              fontSize: "22px",
              fontWeight: "700",
              color: "#3DDC6A",
            }}
          >
            {data.terminalLines[2]}
          </p>
          <p
            className={"sp-l3"}
            style={{
              margin: "0",
              fontFamily: "'Courier New', ui-monospace, monospace",
              fontSize: "22px",
              fontWeight: "700",
              color: "#FFD93B",
            }}
          >
            {data.terminalLines[3]}
          </p>
          <p
            className={"sp-l4"}
            style={{
              margin: "0",
              fontFamily: "'Courier New', ui-monospace, monospace",
              fontSize: "22px",
              fontWeight: "700",
              color: "#FF4B3E",
            }}
          >
            {data.terminalLines[4]}
          </p>
          <p
            className={"sp-l4"}
            style={{
              margin: "0",
              width: "14px",
              height: "24px",
              background: "#FFFFFF",
            }}
          />
        </div>
        <div className={"sp-split"} style={{ position: "absolute", inset: "0" }}>
          <div
            style={{
              position: "absolute",
              left: "0",
              right: "0",
              top: "180px",
              height: "26px",
              background: "#FF3E7F",
              transform: "translateX(40px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "0",
              right: "0",
              top: "300px",
              height: "14px",
              background: "#2EE6FF",
              transform: "translateX(-60px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "0",
              right: "0",
              top: "470px",
              height: "40px",
              background: "#FF3E7F",
              opacity: ".7",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "0",
              right: "0",
              top: "560px",
              height: "10px",
              background: "#2EE6FF",
            }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            left: "490px",
            top: "80px",
            width: "300px",
            height: "300px",
          }}
        >
          <div className={"sp-logo"} style={{ width: "300px", height: "300px" }}>
            <div
              className={"sp-bob"}
              style={{
                width: "300px",
                height: "300px",
                border: "6px solid #1B1030",
                borderRadius: "52px",
                overflow: "hidden",
                boxShadow: "0 12px 0 #1B1030",
                boxSizing: "border-box",
              }}
            >
              <LaunchArtwork1 />
            </div>
          </div>
        </div>
        <LaunchArtwork2 />
        <LaunchArtwork3 />
        <LaunchArtwork4 />
        <LaunchArtwork5 />
        <div
          className={"sp-bar"}
          style={{
            position: "absolute",
            left: "440px",
            top: "438px",
            width: "400px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            alignItems: "center",
          }}
        >
          <p
            style={{
              margin: "0",
              fontSize: "18px",
              fontWeight: "800",
              letterSpacing: "3px",
              color: "#FFFFFF",
            }}
          >
            {data.loadingLabel}
          </p>
          <div
            style={{
              width: "400px",
              height: "26px",
              border: "4px solid #1B1030",
              borderRadius: "999px",
              background: "#FFFFFF",
              overflow: "hidden",
              boxSizing: "border-box",
            }}
          >
            <div
              className={"sp-fill"}
              style={{
                height: "100%",
                background: "linear-gradient(90deg,#2EE6FF,#FF3E7F)",
              }}
            />
          </div>
        </div>
        <div
          className={"sp-press"}
          style={{
            position: "absolute",
            left: "0",
            right: "0",
            top: "446px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <button
            type="button"
            className="game-button sp-pulse"
            aria-label={data.startLabel}
            style={{
              padding: "14px 34px",
              border: "5px solid #1B1030",
              borderRadius: "22px",
              background: "linear-gradient(180deg,#FFF27A,#FFAA00)",
              boxShadow: "0 8px 0 #1B1030",
              fontFamily: "'Lilita One', 'Arial Black', sans-serif",
              fontWeight: "400",
              fontSize: "32px",
              letterSpacing: "1px",
              color: "#1B1030",
            }}
          >
            {data.startLabel}
          </button>
        </div>
        <div className={"sp-walk"} style={{ position: "absolute", left: "0", top: "560px" }}>
          <div className={"wk2"}>
            <div>
              <LaunchArtwork6 />
            </div>
            <div>
              <LaunchArtwork7 />
            </div>
            <div>
              <LaunchArtwork8 />
            </div>
            <div>
              <LaunchArtwork9 />
            </div>
          </div>
        </div>
        <p
          className={"sp-press"}
          style={{
            position: "absolute",
            left: "32px",
            bottom: "22px",
            margin: "0",
            fontSize: "15px",
            fontWeight: "800",
            color: "#FFFFFF",
          }}
        >
          {data.versionLabel}
        </p>
        <p
          className={"sp-press"}
          style={{
            position: "absolute",
            right: "32px",
            bottom: "22px",
            margin: "0",
            fontSize: "15px",
            fontWeight: "800",
            color: "#FFFFFF",
          }}
        >
          {data.dayLabel}
        </p>
      </div>
      <div
        aria-hidden="true"
        className={"sp-flash"}
        style={{ position: "absolute", inset: "0", background: "#FFFFFF" }}
      />
    </div>
  )
}
