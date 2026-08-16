import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminUserList } from "@/components/admin/user-list"
import { ShieldCheck } from "lucide-react"

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: me } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (!me?.is_admin) redirect("/calendar")

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, unit_number, is_approved, is_admin, created_at")
    .order("created_at", { ascending: true })

  const pending = (profiles ?? []).filter((p) => !p.is_approved)
  const approved = (profiles ?? []).filter((p) => p.is_approved)

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          Administrasjon
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Godkjenn nye beboere og administrer tilganger
        </p>
      </div>

      <AdminUserList pending={pending} approved={approved} currentUserId={user.id} />
    </div>
  )
}
