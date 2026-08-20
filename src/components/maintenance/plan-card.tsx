"use client"

import { useState } from "react"
import {
  deletePlan,
  toggleAssignment,
  deleteAssignment,
  claimSlot,
  assignSlot,
  releaseSlot,
} from "@/app/(dashboard)/maintenance/actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AssignmentForm } from "./assignment-form"
import { EditPlanForm } from "./edit-plan-form"
import { EditAssignmentForm } from "./edit-assignment-form"
import { Trash2, CalendarDays, RepeatIcon, CheckCircle2, RotateCcw } from "lucide-react"
import type { MaintenancePlan, MaintenanceAssignment, ProfileSummary } from "@/types"
import { format, addDays, addMonths } from "date-fns"
import { nb } from "date-fns/locale"

type Props = {
  plan: MaintenancePlan
  members: ProfileSummary[]
  currentUserId: string
  isAdmin: boolean
}

const RECURRENCE_LABELS: Record<string, string> = {
  weekly: "1-ukers vakter",
  biweekly: "2-ukers vakter",
  monthly: "Månedlige vakter",
  once: "Engangs",
  custom: "Tilpasset",
}

function formatSlotRange(startDate: string | null, recurrence: string): string {
  if (!startDate) return "Ingen dato"
  const start = new Date(startDate + "T00:00:00")
  let end: Date | null = null
  if (recurrence === "weekly") end = addDays(start, 6)
  else if (recurrence === "biweekly") end = addDays(start, 13)
  else if (recurrence === "monthly") end = addMonths(start, 1)

  if (!end) return format(start, "d. MMMM yyyy", { locale: nb })

  return start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()
    ? `${format(start, "d.", { locale: nb })} – ${format(end, "d. MMMM yyyy", { locale: nb })}`
    : `${format(start, "d. MMM", { locale: nb })} – ${format(end, "d. MMMM yyyy", { locale: nb })}`
}

function OpenSlotRow({
  assignment,
  members,
  isAdmin,
  planRecurrence,
}: {
  assignment: MaintenanceAssignment
  members: ProfileSummary[]
  isAdmin: boolean
  planRecurrence: string
}) {
  const [claiming, setClaiming] = useState(false)
  const [assignUserId, setAssignUserId] = useState("")
  const [assigning, setAssigning] = useState(false)

  async function handleClaim() {
    setClaiming(true)
    await claimSlot(assignment.id)
    setClaiming(false)
  }

  async function handleAssign() {
    if (!assignUserId) return
    setAssigning(true)
    await assignSlot(assignment.id, assignUserId)
    setAssignUserId("")
    setAssigning(false)
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-dashed border-border p-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarDays className="h-3 w-3 shrink-0" />
          <span>{formatSlotRange(assignment.scheduled_date, planRecurrence)}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
        {isAdmin && (
          <>
            <Select value={assignUserId} onValueChange={setAssignUserId}>
              <SelectTrigger className="h-7 text-xs w-36">
                <SelectValue placeholder="Tildel til…" />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id} className="text-xs">
                    {m.full_name ?? m.email}{m.unit_number && ` (${m.unit_number})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {assignUserId && (
              <Button size="sm" className="h-7 text-xs px-2" onClick={handleAssign} disabled={assigning}>
                {assigning ? "…" : "Tildel"}
              </Button>
            )}
          </>
        )}
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs px-2"
          onClick={handleClaim}
          disabled={claiming}
        >
          {claiming ? "…" : "Ta vakt"}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={() => deleteAssignment(assignment.id)}
          title="Slett vakt"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

export function PlanCard({ plan, members, currentUserId, isAdmin }: Props) {
  const [deletingPlan, setDeletingPlan] = useState(false)
  const isOwner = plan.created_by === currentUserId

  const assignments = plan.assignments ?? []
  const openSlots = assignments
    .filter((a) => a.user_id === null && !a.is_completed)
    .sort((a, b) => (a.scheduled_date ?? "").localeCompare(b.scheduled_date ?? ""))
  const upcoming = assignments
    .filter((a) => a.user_id !== null && !a.is_completed)
    .sort((a, b) => (a.scheduled_date ?? "").localeCompare(b.scheduled_date ?? ""))
  const completed = assignments.filter((a) => a.is_completed)

  const isCompleted = plan.is_completed || (assignments.length > 0 && openSlots.length === 0 && upcoming.length === 0)

  async function handleDeletePlan() {
    if (!confirm(`Slett planen "${plan.title}" og alle oppgaver?`)) return
    setDeletingPlan(true)
    await deletePlan(plan.id)
  }

  return (
    <Card id={plan.id} className={isCompleted ? "opacity-60" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base">{plan.title}</CardTitle>
            {plan.description && <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="outline" className="text-xs flex items-center gap-1 whitespace-nowrap shrink-0">
                <RepeatIcon className="h-3 w-3" />
                {RECURRENCE_LABELS[plan.recurrence] ?? plan.recurrence}
              </Badge>
              {plan.start_date && (
                <span className="text-xs text-muted-foreground">
                  {format(new Date(plan.start_date + "T00:00:00"), "d. MMM yyyy", { locale: nb })}
                  {plan.end_date && ` – ${format(new Date(plan.end_date + "T00:00:00"), "d. MMM yyyy", { locale: nb })}`}
                </span>
              )}
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
        {openSlots.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Ledige vakter ({openSlots.length})
            </p>
            {openSlots.map((a) => (
              <OpenSlotRow
                key={a.id}
                assignment={a}
                members={members}
                isAdmin={isAdmin}
                planRecurrence={plan.recurrence}
              />
            ))}
          </div>
        )}

        {upcoming.length > 0 && (
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
                      ? formatSlotRange(a.scheduled_date, plan.recurrence)
                      : "Ingen dato"}
                    {a.notes && <span className="ml-1">· {a.notes}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  {(a.user_id === currentUserId || isAdmin) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      title="Gi tilbake"
                      onClick={() => releaseSlot(a.id)}
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  )}
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
                        {formatSlotRange(a.scheduled_date, plan.recurrence)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isCompleted && (
          <div className="flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
            <p className="text-sm font-medium text-green-700 dark:text-green-400">
              Alle oppgaver fullført
            </p>
          </div>
        )}

        <AssignmentForm planId={plan.id} members={members} />
      </CardContent>
    </Card>
  )
}
