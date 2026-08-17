"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { logout } from "@/app/(auth)/actions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, ShieldCheck, LogOut, Sun, Moon } from "lucide-react"
import { useTheme } from "next-themes"

type Props = {
  displayName: string
  initials: string
  avatarUrl: string | null
  isAdmin: boolean
}

export function MobileProfileMenu({ displayName, initials, avatarUrl, isAdmin }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { resolvedTheme, setTheme } = useTheme()

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener("mousedown", handleOutside)
    return () => document.removeEventListener("mousedown", handleOutside)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((v) => !v)} className="block">
        <Avatar className="h-8 w-8 ring-offset-background transition-all hover:ring-2 hover:ring-primary hover:ring-offset-1">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
          <AvatarFallback className="bg-primary text-white text-xs">{initials}</AvatarFallback>
        </Avatar>
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-52 rounded-xl border border-border bg-card shadow-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs font-semibold truncate">{displayName}</p>
          </div>

          <div className="py-1">
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
            >
              <User className="h-4 w-4 text-muted-foreground" />
              Rediger profil
            </Link>

            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
              >
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                Administrasjon
              </Link>
            )}
          </div>

          <div className="border-t border-border py-1">
            <button
              onClick={() => { setTheme(resolvedTheme === "dark" ? "light" : "dark"); setOpen(false) }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
            >
              {resolvedTheme === "dark"
                ? <Sun className="h-4 w-4 text-muted-foreground" />
                : <Moon className="h-4 w-4 text-muted-foreground" />}
              {resolvedTheme === "dark" ? "Lyst tema" : "Mørkt tema"}
            </button>
          </div>

          <div className="border-t border-border py-1">
            <form action={logout}>
              <button
                type="submit"
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Logg ut
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
