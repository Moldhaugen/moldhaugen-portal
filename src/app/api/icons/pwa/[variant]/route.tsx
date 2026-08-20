import { ImageResponse } from "next/og"
import type { NextRequest } from "next/server"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ variant: string }> },
) {
  const { variant } = await params
  const isMaskable = variant.startsWith("maskable")
  const size = variant.includes("512") ? 512 : variant === "apple" ? 180 : 192
  // maskable: smaller focal content so it stays within Android's ~70% safe zone
  const fontSize = isMaskable ? size * 0.5 : size * 0.72
  const borderRadius = isMaskable ? 0 : size * 0.2

  return new ImageResponse(
    <div
      style={{
        background: "#18181b",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius,
        fontFamily: "sans-serif",
        fontWeight: 900,
        fontSize,
        color: "white",
        letterSpacing: "-0.05em",
      }}
    >
      M
    </div>,
    { width: size, height: size },
  )
}
