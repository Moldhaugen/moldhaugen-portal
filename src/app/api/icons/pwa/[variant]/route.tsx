import { ImageResponse } from "next/og"
import type { NextRequest } from "next/server"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ variant: string }> },
) {
  const { variant } = await params
  const isMaskable = variant.startsWith("maskable")
  const size = variant.includes("512") ? 512 : variant === "apple" ? 180 : 192
  // maskable: shrink house to ~65% so it stays within the safe zone
  const s = ((isMaskable ? size * 0.65 : size) / 192)

  return new ImageResponse(
    <div
      style={{
        background: "#18181b",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div
          style={{
            width: 0,
            height: 0,
            borderLeft: `${Math.round(52 * s)}px solid transparent`,
            borderRight: `${Math.round(52 * s)}px solid transparent`,
            borderBottom: `${Math.round(46 * s)}px solid white`,
          }}
        />
        <div
          style={{
            width: Math.round(96 * s),
            height: Math.round(56 * s),
            background: "white",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
          }}
        >
          <div
            style={{
              width: Math.round(26 * s),
              height: Math.round(36 * s),
              background: "#18181b",
              borderRadius: `${Math.round(3 * s)}px ${Math.round(3 * s)}px 0 0`,
            }}
          />
        </div>
      </div>
    </div>,
    { width: size, height: size },
  )
}
