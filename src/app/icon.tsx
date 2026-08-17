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
      M
    </div>,
    { width: 192, height: 192 },
  )
}
