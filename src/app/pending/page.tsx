import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { logout } from "@/app/(auth)/actions"
import { Button } from "@/components/ui/button"
import { Clock, Home } from "lucide-react"

export default async function PendingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_approved")
    .eq("id", user.id)
    .single()

  if (profile?.is_approved) redirect("/calendar")

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
          <Clock className="h-8 w-8 text-yellow-600" />
        </div>
        <div className="flex items-center gap-2 mb-2">
          <Home className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground">Moldhaugen</span>
        </div>
        <h1 className="text-xl font-bold text-foreground">Venter på godkjenning</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Kontoen din er opprettet og venter på godkjenning fra en administrator.
          Du vil få tilgang så snart en admin har godkjent deg.
        </p>
        <p className="text-xs text-muted-foreground">
          Logget inn som <strong>{user.email}</strong>
        </p>
        <form action={logout} className="mt-2">
          <Button variant="outline" type="submit">Logg ut</Button>
        </form>
      </div>
    </div>
  )
}
