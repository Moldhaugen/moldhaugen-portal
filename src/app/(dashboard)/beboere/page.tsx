import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Users, Phone, Mail } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default async function BeboerePage() {
  const supabase = await createClient()
  const [{ data: { session } }, { data: residents }] = await Promise.all([
    supabase.auth.getSession(),
    supabase.from("profiles").select("id, full_name, email, phone_number, unit_number, avatar_url").eq("is_approved", true).order("full_name"),
  ])
  if (!session?.user) redirect("/login")

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          Beboere
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {residents?.length ?? 0} godkjente beboere
        </p>
      </div>

      <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
        {residents?.map((r) => (
          <div key={r.id} className="flex items-center gap-4 px-4 py-3 bg-card hover:bg-muted/40 transition-colors">
            <Avatar className="h-9 w-9 shrink-0">
              {r.avatar_url && <AvatarImage src={r.avatar_url} alt={r.full_name ?? ""} />}
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                {(r.full_name ?? r.email ?? "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-foreground truncate">
                {r.full_name ?? <span className="text-muted-foreground italic">Ukjent navn</span>}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5">
                {r.unit_number && (
                  <span className="text-xs text-muted-foreground">nr. {r.unit_number}</span>
                )}
                {r.email && (
                  <a
                    href={`mailto:${r.email}`}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Mail className="h-3 w-3" />
                    {r.email}
                  </a>
                )}
                {r.phone_number && (
                  <a
                    href={`tel:${r.phone_number.replace(/\s/g, "")}`}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Phone className="h-3 w-3" />
                    {r.phone_number}
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
