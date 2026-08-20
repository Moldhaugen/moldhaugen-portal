import { ImageResponse } from "next/og"

export const size = { width: 192, height: 192 }
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        background: "#18181b",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
        fontWeight: 900,
        fontSize: "108px",
        color: "white",
        letterSpacing: "-4px",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0px" }}>
        <div style={{ width: 0, height: 0, borderLeft: "52px solid transparent", borderRight: "52px solid transparent", borderBottom: "46px solid white" }} />
        <div style={{ width: 96, height: 56, background: "white", display: "flex", justifyContent: "center", alignItems: "flex-end" }}>
          <div style={{ width: 26, height: 36, background: "#1e293b", borderRadius: "3px 3px 0 0" }} />
        </div>
      </div>
    </div>,
    { width: 192, height: 192 },
  )
}
