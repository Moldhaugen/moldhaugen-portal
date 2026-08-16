import Link from "next/link"
import { redirect } from "next/navigation"
import { CalendarDays, Wrench, Home, LogOut, Menu } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { logout } from "@/app/(auth)/actions"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const navItems = [
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/maintenance", label: "Maintenance", icon: Wrench },
]

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single()

  const displayName = profile?.full_name ?? profile?.email ?? user.email ?? "User"
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="flex h-full min-h-screen">
      {/* Sidebar */}
      <aside
        className="hidden md:flex w-64 flex-col"
        style={{ background: "var(--sidebar-bg)", color: "var(--sidebar-fg)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Home className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-sm leading-tight" style={{ color: "var(--sidebar-fg)" }}>
              Moldhaugen
            </p>
            <p className="text-xs" style={{ color: "var(--sidebar-muted-fg)" }}>
              Nabolagsportalen
            </p>
          </div>
        </div>

        <Separator style={{ background: "var(--sidebar-border)" }} />

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-white/10"
              style={{ color: "var(--sidebar-fg)" }}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        <Separator style={{ background: "var(--sidebar-border)" }} />

        {/* User section */}
        <div className="flex items-center gap-3 px-4 py-4">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary text-white text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: "var(--sidebar-fg)" }}>
              {displayName}
            </p>
            <p className="text-xs truncate" style={{ color: "var(--sidebar-muted-fg)" }}>
              {user.email}
            </p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              title="Sign out"
              className="rounded p-1 hover:bg-white/10 transition-colors"
              style={{ color: "var(--sidebar-muted-fg)" }}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-primary">
            <Home className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-sm">Moldhaugen</span>
        </div>
        <div className="flex items-center gap-2">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} title={label}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Icon className="h-4 w-4" />
              </Button>
            </Link>
          ))}
          <form action={logout}>
            <Button variant="ghost" size="icon" className="h-8 w-8" type="submit" title="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-background md:pt-0 pt-14">
        {children}
      </main>
    </div>
  )
}
