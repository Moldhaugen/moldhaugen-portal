import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PlanForm } from "@/components/maintenance/plan-form"
import { PlanCard } from "@/components/maintenance/plan-card"
import { Wrench } from "lucide-react"
import type { ProfileSummary } from "@/types"

export default async function MaintenancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [plansRes, profilesRes] = await Promise.all([
    supabase
      .from("maintenance_plans")
      .select(`
        *,
        creator:profiles!maintenance_plans_created_by_fkey(id, full_name, email),
        assignments:maintenance_assignments(
          id, plan_id, user_id, scheduled_date, is_completed, notes, created_at,
          profile:profiles(id, full_name, email)
        )
      `)
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name, email").order("full_name"),
  ])

  const plans = plansRes.data ?? []
  const members = (profilesRes.data ?? []) as ProfileSummary[]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Wrench className="h-6 w-6 text-primary" />
            Maintenance
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {plans.length === 0
              ? "No maintenance plans yet"
              : `${plans.length} maintenance plan${plans.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <PlanForm />
      </div>

      {/* Plans */}
      {plans.length > 0 ? (
        <div className="space-y-6">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              members={members}
              currentUserId={user.id}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Wrench className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium text-foreground">No maintenance plans yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Create a plan to track shared responsibilities like lawn mowing, snow clearing, etc.
          </p>
        </div>
      )}
    </div>
  )
}
