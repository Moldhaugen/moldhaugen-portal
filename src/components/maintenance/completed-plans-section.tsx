"use client"

import { useState } from "react"
import { PlanCard } from "./plan-card"
import { ChevronDown, ChevronRight } from "lucide-react"
import type { MaintenancePlan, ProfileSummary } from "@/types"

type Props = {
  plans: MaintenancePlan[]
  members: ProfileSummary[]
  currentUserId: string
  isAdmin?: boolean
}

export function CompletedPlansSection({ plans, members, currentUserId, isAdmin = false }: Props) {
  const [visible, setVisible] = useState(false)

  if (plans.length === 0) return null

  return (
    <div className="mt-8">
      <button
        onClick={() => setVisible((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors mb-4"
      >
        {visible ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        Fullførte planer ({plans.length})
      </button>

      {visible && (
        <div className="space-y-6">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} members={members} currentUserId={currentUserId} isAdmin={isAdmin} />
          ))}
        </div>
      )}
    </div>
  )
}
