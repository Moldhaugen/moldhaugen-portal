"use client"

import { useState } from "react"
import { PlanCard } from "./plan-card"
import { PlanForm } from "./plan-form"
import { Wrench, EyeOff, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { MaintenancePlan, ProfileSummary } from "@/types"

type Props = {
  activePlans: MaintenancePlan[]
  completedPlans: MaintenancePlan[]
  members: ProfileSummary[]
  currentUserId: string
  isAdmin: boolean
}

export function PlansSection({ activePlans, completedPlans, members, currentUserId, isAdmin }: Props) {
  const [showCompleted, setShowCompleted] = useState(false)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Wrench className="h-6 w-6 text-primary" />
            Vedlikehold
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {activePlans.length === 0
              ? "Ingen aktive vedlikeholdsplaner"
              : `${activePlans.length} aktiv${activePlans.length !== 1 ? "e" : ""} plan${activePlans.length !== 1 ? "er" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {completedPlans.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              onClick={() => setShowCompleted((v) => !v)}
            >
              {showCompleted ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">
                {showCompleted ? "Skjul fullførte" : `Vis fullførte (${completedPlans.length})`}
              </span>
              <span className="sm:hidden">
                {showCompleted ? "Skjul" : `Fullførte (${completedPlans.length})`}
              </span>
            </Button>
          )}
          <PlanForm />
        </div>
      </div>

      {activePlans.length > 0 ? (
        <div className="space-y-6">
          {activePlans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} members={members} currentUserId={currentUserId} isAdmin={isAdmin} />
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

      {showCompleted && completedPlans.length > 0 && (
        <div className="mt-8 space-y-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Fullførte planer ({completedPlans.length})
          </p>
          {completedPlans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} members={members} currentUserId={currentUserId} isAdmin={isAdmin} />
          ))}
        </div>
      )}
    </div>
  )
}
