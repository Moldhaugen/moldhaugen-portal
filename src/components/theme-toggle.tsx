"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Sun, Moon } from "lucide-react"

type Props = {
  className?: string
  style?: React.CSSProperties
}

export function ThemeToggle({ className, style }: Props) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <span className="h-4 w-4" />

  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      title={resolvedTheme === "dark" ? "Bytt til lyst modus" : "Bytt til mørkt modus"}
      className={className}
      style={style}
    >
      {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}
