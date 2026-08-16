import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PlanForm } from "@/components/maintenance/plan-form"
import { PlanCard } from "@/components/maintenance/plan-card"
import { SuggestionForm } from "@/components/maintenance/suggestion-form"
import { SuggestionCard } from "@/components/maintenance/suggestion-card"
import { Wrench, Lightbulb } from "lucide-react"
import type { ProfileSummary } from "@/types"

export default async function MaintenancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  const [plansRes, profilesRes, suggestionsRes] = await Promise.all([
    supabase
      .from("maintenance_plans")
      .select(`
        *,
        creator:profiles!maintenance_plans_created_by_fkey(id, full_name, email, unit_number),
        assignments:maintenance_assignments(
          id, plan_id, user_id, scheduled_date, is_completed, notes, created_at,
          profile:profiles(id, full_name, email, unit_number)
        )
      `)
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name, email, unit_number").order("full_name"),
    supabase
      .from("maintenance_suggestions")
      .select("*, creator:profiles!maintenance_suggestions_created_by_fkey(id, full_name, email)")
      .order("created_at", { ascending: false }),
  ])

  const plans = plansRes.data ?? []
  const members = (profilesRes.data ?? []) as ProfileSummary[]
  const suggestions = suggestionsRes.data ?? []

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-10">
      {/* Plans section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Wrench className="h-6 w-6 text-primary" />
              Vedlikehold
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {plans.length === 0
                ? "Ingen vedlikeholdsplaner ennå"
                : `${plans.length} vedlikeholdsplan${plans.length !== 1 ? "er" : ""}`}
            </p>
          </div>
          <PlanForm />
        </div>

        {plans.length > 0 ? (
          <div className="space-y-6">
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} members={members} currentUserId={user.id} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <Wrench className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium text-foreground">Ingen vedlikeholdsplaner ennå</p>
            <p className="text-sm text-muted-foreground mt-1">
              Opprett en plan for å organisere felles oppgaver som gressklipper, snørydding osv.
            </p>
          </div>
        )}
      </div>

      {/* Suggestions section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Forslag
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {suggestions.length === 0
                ? "Ingen forslag ennå"
                : `${suggestions.length} forslag`}
            </p>
          </div>
          <SuggestionForm />
        </div>

        {suggestions.length > 0 ? (
          <div className="space-y-2">
            {suggestions.map((s) => (
              <SuggestionCard
                key={s.id}
                suggestion={s}
                currentUserId={user.id}
                isAdmin={!!profile?.is_admin}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <Lightbulb className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">Ingen forslag ennå</p>
            <p className="text-xs text-muted-foreground mt-1">
              Har du noe som bør fikses eller vedlikeholdes? Send inn et forslag!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
