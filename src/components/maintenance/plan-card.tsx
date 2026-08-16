"use client"

import { useState } from "react"
import { deletePlan, toggleAssignment, deleteAssignment } from "@/app/(dashboard)/maintenance/actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { AssignmentForm } from "./assignment-form"
import { EditPlanForm } from "./edit-plan-form"
import { EditAssignmentForm } from "./edit-assignment-form"
import { Trash2, CalendarDays, RepeatIcon, CheckCircle2 } from "lucide-react"
import type { MaintenancePlan, ProfileSummary } from "@/types"
import { format } from "date-fns"
import { nb } from "date-fns/locale"

type Props = { plan: MaintenancePlan; members: ProfileSummary[]; currentUserId: string }

const RECURRENCE_LABELS: Record<string, string> = {
  weekly: "Ukentlig",
  biweekly: "Annenhver uke",
  monthly: "Månedlig",
  once: "Engangs",
  custom: "Tilpasset",
}

export function PlanCard({ plan, members, currentUserId }: Props) {
  const [deletingPlan, setDeletingPlan] = useState(false)
  const isOwner = plan.created_by === currentUserId

  const assignments = plan.assignments ?? []
  const upcoming = assignments
    .filter((a) => !a.is_completed)
    .sort((a, b) => (a.scheduled_date ?? "").localeCompare(b.scheduled_date ?? ""))
  const completed = assignments.filter((a) => a.is_completed)

  async function handleDeletePlan() {
    if (!confirm(`Slett planen "${plan.title}" og alle oppgaver?`)) return
    setDeletingPlan(true)
    await deletePlan(plan.id)
  }

  return (
    <Card id={plan.id}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base">{plan.title}</CardTitle>
            {plan.description && <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>}
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs flex items-center gap-1 whitespace-nowrap shrink-0">
                <RepeatIcon className="h-3 w-3" />
                {RECURRENCE_LABELS[plan.recurrence] ?? plan.recurrence}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Av {plan.creator?.full_name ?? plan.creator?.email ?? "Ukjent"}
              </span>
            </div>
          </div>
          {isOwner && (
            <div className="flex items-center gap-1 shrink-0">
              <EditPlanForm plan={plan} />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={handleDeletePlan}
                disabled={deletingPlan}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {upcoming.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Kommende</p>
            {upcoming.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <Checkbox
                  checked={a.is_completed}
                  onCheckedChange={() => toggleAssignment(a.id, !a.is_completed)}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {a.profile?.full_name ?? a.profile?.email ?? "Ukjent"}
                    {a.profile?.unit_number && (
                      <span className="text-muted-foreground font-normal ml-1">({a.profile.unit_number})</span>
                    )}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <CalendarDays className="h-3 w-3" />
                    {a.scheduled_date
                      ? format(new Date(a.scheduled_date), "d. MMMM yyyy", { locale: nb })
                      : "Ingen dato"}
                    {a.notes && <span className="ml-1">· {a.notes}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <EditAssignmentForm assignment={a} members={members} />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteAssignment(a.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Ingen kommende oppgaver. Legg til en nedenfor.</p>
        )}

        {completed.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Fullført ({completed.length})
            </p>
            <div className="space-y-1.5 opacity-60">
              {completed.slice(0, 3).map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-lg border border-border p-2.5">
                  <Checkbox
                    checked={a.is_completed}
                    onCheckedChange={() => toggleAssignment(a.id, !a.is_completed)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-through text-muted-foreground">
                      {a.profile?.full_name ?? a.profile?.email ?? "Ukjent"}
                    </p>
                    {a.scheduled_date && (
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(a.scheduled_date), "d. MMMM yyyy", { locale: nb })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {plan.recurrence === "once" && assignments.length > 0 && upcoming.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
            <p className="text-sm font-medium text-green-700 dark:text-green-400">Oppgave fullført</p>
          </div>
        ) : (
          <AssignmentForm planId={plan.id} members={members} />
        )}
      </CardContent>
    </Card>
  )
}
