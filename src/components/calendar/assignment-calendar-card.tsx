import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Wrench } from "lucide-react"
import type { MaintenanceAssignment } from "@/types"
import { format } from "date-fns"
import { nb } from "date-fns/locale"

type Props = { assignment: MaintenanceAssignment }

export function AssignmentCalendarCard({ assignment }: Props) {
  const person = assignment.profile?.full_name ?? assignment.profile?.email ?? "Ukjent"
  const planTitle = assignment.plan?.title ?? "Vedlikehold"

  return (
    <Card className="border-l-4 border-l-amber-400">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
            <Wrench className="h-4 w-4 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-semibold text-sm">{planTitle}</h3>
              <Badge variant="warning" className="text-xs">Vedlikehold</Badge>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="h-3 w-3 shrink-0" />
              <span>{format(new Date(assignment.scheduled_date), "d. MMMM yyyy", { locale: nb })}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Ansvarlig: <span className="font-medium text-foreground">{person}</span>
            </p>
            {assignment.notes && (
              <p className="mt-1 text-xs text-muted-foreground">{assignment.notes}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
