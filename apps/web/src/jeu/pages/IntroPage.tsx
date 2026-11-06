import type { IntroPageProps } from "../types/entry"
import { IntroArtwork0 } from "../components/artwork/IntroArtwork"

export function IntroPage({ data, onNext, onSkip }: IntroPageProps) {
  return (
    <div
      className="intro-page"
      style={{
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        padding: "0",
        position: "relative",
        background: "#2A1B5C",
        color: "#1B1030",
        fontFamily: "'Nunito', system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        gap: "0",
        overflow: "hidden",
      }}
    >
      <div
        className="intro-header"
        style={{
          position: "absolute",
          left: "0",
          right: "0",
          top: "50px",
          display: "flex",
          justifyContent: "center",
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
            background: "#FF3E7F",
            boxShadow: "0 5px 0 #1B1030",
            fontFamily: "'Lilita One', 'Arial Black', sans-serif",
            fontWeight: "400",
            fontSize: "30px",
            color: "#FFFFFF",
            whiteSpace: "nowrap",
          }}
        >
          {data.dayLabel}
        </div>
      </div>
      <div
        className="intro-artwork"
        style={{
          position: "absolute",
          left: "0",
          right: "0",
          top: "140px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <IntroArtwork0 />
      </div>
      <div className="intro-skip" style={{ position: "absolute", right: "48px", top: "44px" }}>
        <button
          type="button"
          className="game-button"
          onClick={onSkip}
          style={{
            width: "170px",
            height: "56px",
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
            fontSize: "20px",
            lineHeight: "1.1",
            letterSpacing: "1px",
            color: "#1B1030",
            textAlign: "center",
          }}
        >
          {"PASSER ▸▸"}
        </button>
      </div>
      <div
        className="intro-card"
        style={{
          position: "absolute",
          left: "110px",
          right: "110px",
          bottom: "60px",
          padding: "34px 40px 30px",
          background: "#FFFFFF",
          border: "5px solid #1B1030",
          borderRadius: "28px",
          boxShadow: "0 10px 0 #1B1030",
        }}
      >
        <div style={{ position: "absolute", left: "34px", top: "-26px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              padding: "8px 18px",
              border: "4px solid #1B1030",
              borderRadius: "999px",
              background: "#2EE6FF",
              boxShadow: "0 5px 0 #1B1030",
              fontFamily: "'Lilita One', 'Arial Black', sans-serif",
              fontWeight: "400",
              fontSize: "20px",
              color: "#1B1030",
              whiteSpace: "nowrap",
            }}
          >
            {data.narrator}
          </div>
        </div>
        <p
          className="intro-copy"
          style={{
            margin: "0",
            fontSize: "26px",
            fontWeight: "800",
            lineHeight: "1.45",
          }}
        >
          {data.beforeHighlight}
          <span style={{ color: "#FF3E7F" }}>{data.highlight}</span>
          {data.afterHighlight}
        </p>
        <div
          className="intro-actions"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "22px",
          }}
        >
          <div
            role="img"
            aria-label={`Scène ${data.sceneNumber} sur ${data.totalScenes}`}
            style={{ display: "flex", gap: "10px" }}
          >
            {Array.from({ length: data.totalScenes }, (_, index) => (
              <span
                key={index}
                style={{
                  width: index + 1 === data.sceneNumber ? "34px" : "12px",
                  height: "12px",
                  borderRadius: "6px",
                  background: index + 1 === data.sceneNumber ? "#1B1030" : "#C9CCE0",
                }}
              />
            ))}
          </div>
          <button
            type="button"
            className="game-button"
            onClick={onNext}
            style={{
              width: "220px",
              height: "64px",
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
              fontSize: "26px",
              lineHeight: "1.1",
              letterSpacing: "1px",
              color: "#1B1030",
              textAlign: "center",
            }}
          >
            {"SUIVANT ▸"}
          </button>
        </div>
      </div>
    </div>
  )
}
