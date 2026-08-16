import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PlansSection } from "@/components/maintenance/plans-section"
import { SuggestionForm } from "@/components/maintenance/suggestion-form"
import { SuggestionCard } from "@/components/maintenance/suggestion-card"
import { Lightbulb } from "lucide-react"
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

  const allPlans = plansRes.data ?? []

  function isPlanCompleted(p: typeof allPlans[number]) {
    if (p.is_completed) return true
    const assignments = (p.assignments ?? []) as Array<{ is_completed: boolean }>
    return assignments.length > 0 && assignments.every((a) => a.is_completed)
  }

  const activePlans = allPlans.filter((p) => !isPlanCompleted(p))
  const completedPlans = allPlans.filter((p) => isPlanCompleted(p))
  const members = (profilesRes.data ?? []) as ProfileSummary[]
  const suggestions = suggestionsRes.data ?? []

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-10">
      <PlansSection
        activePlans={activePlans}
        completedPlans={completedPlans}
        members={members}
        currentUserId={user.id}
      />

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
