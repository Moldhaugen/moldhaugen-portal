"use client"

import { useState } from "react"
import { deletePlan, toggleAssignment, deleteAssignment } from "@/app/(dashboard)/maintenance/actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { AssignmentForm } from "./assignment-form"
import { Trash2, CalendarDays, RepeatIcon } from "lucide-react"
import type { MaintenancePlan, ProfileSummary } from "@/types"
import { format } from "date-fns"

type Props = {
  plan: MaintenancePlan
  members: ProfileSummary[]
  currentUserId: string
}

const RECURRENCE_LABELS: Record<string, string> = {
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  monthly: "Monthly",
  custom: "Custom",
}

export function PlanCard({ plan, members, currentUserId }: Props) {
  const [deletingPlan, setDeletingPlan] = useState(false)
  const isOwner = plan.created_by === currentUserId

  const assignments = plan.assignments ?? []
  const upcoming = assignments.filter((a) => !a.is_completed).sort(
    (a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
  )
  const completed = assignments.filter((a) => a.is_completed)

  async function handleDeletePlan() {
    if (!confirm(`Delete plan "${plan.title}" and all its assignments?`)) return
    setDeletingPlan(true)
    await deletePlan(plan.id)
  }

  async function handleToggle(id: string, current: boolean) {
    await toggleAssignment(id, !current)
  }

  async function handleDeleteAssignment(id: string) {
    await deleteAssignment(id)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base">{plan.title}</CardTitle>
            {plan.description && (
              <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <RepeatIcon className="h-3 w-3" />
                {RECURRENCE_LABELS[plan.recurrence] ?? plan.recurrence}
              </Badge>
              <span className="text-xs text-muted-foreground">
                By {plan.creator?.full_name ?? plan.creator?.email ?? "Unknown"}
              </span>
            </div>
          </div>
          {isOwner && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
              onClick={handleDeletePlan}
              disabled={deletingPlan}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Upcoming assignments */}
        {upcoming.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Upcoming
            </p>
            {upcoming.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <Checkbox
                  checked={a.is_completed}
                  onCheckedChange={() => handleToggle(a.id, a.is_completed)}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {a.profile?.full_name ?? a.profile?.email ?? "Unknown"}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <CalendarDays className="h-3 w-3" />
                    {format(new Date(a.scheduled_date), "d. MMM yyyy")}
                    {a.notes && <span className="ml-1">· {a.notes}</span>}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => handleDeleteAssignment(a.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No upcoming assignments. Add one below.</p>
        )}

        {/* Completed */}
        {completed.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Completed ({completed.length})
            </p>
            <div className="space-y-1.5 opacity-60">
              {completed.slice(0, 3).map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-lg border border-border p-2.5">
                  <Checkbox
                    checked={a.is_completed}
                    onCheckedChange={() => handleToggle(a.id, a.is_completed)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-through text-muted-foreground">
                      {a.profile?.full_name ?? a.profile?.email ?? "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(a.scheduled_date), "d. MMM yyyy")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add assignment button */}
        <AssignmentForm planId={plan.id} members={members} />
      </CardContent>
    </Card>
  )
}
