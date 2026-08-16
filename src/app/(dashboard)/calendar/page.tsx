import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { EventForm } from "@/components/calendar/event-form"
import { EventCard } from "@/components/calendar/event-card"
import { AssignmentCalendarCard } from "@/components/calendar/assignment-calendar-card"
import { CalendarDays } from "lucide-react"
import type { ProfileSummary, MaintenanceAssignment } from "@/types"

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [eventsRes, profilesRes, assignmentsRes] = await Promise.all([
    supabase
      .from("events")
      .select(`
        *,
        creator:profiles!events_created_by_fkey(id, full_name, email, unit_number),
        invitations:event_invitations(id, user_id, status, profile:profiles(id, full_name, email, unit_number))
      `)
      .order("start_time", { ascending: true }),
    supabase.from("profiles").select("id, full_name, email, unit_number").order("full_name"),
    supabase
      .from("maintenance_assignments")
      .select(`
        *,
        profile:profiles(id, full_name, email, unit_number),
        plan:maintenance_plans(id, title)
      `)
      .gte("scheduled_date", new Date().toISOString().split("T")[0])
      .eq("is_completed", false)
      .order("scheduled_date", { ascending: true })
      .limit(20),
  ])

  const events = eventsRes.data ?? []
  const members = (profilesRes.data ?? []) as ProfileSummary[]
  const assignments = (assignmentsRes.data ?? []) as MaintenanceAssignment[]

  const now = new Date()
  const upcomingEvents = events.filter((e) => new Date(e.end_time) >= now)
  const pastEvents = events.filter((e) => new Date(e.end_time) < now)

  type CalendarItem =
    | { type: "event"; date: Date; data: (typeof upcomingEvents)[0] }
    | { type: "assignment"; date: Date; data: MaintenanceAssignment }

  const combined: CalendarItem[] = [
    ...upcomingEvents.map((e) => ({ type: "event" as const, date: new Date(e.start_time), data: e })),
    ...assignments.map((a) => ({ type: "assignment" as const, date: new Date(a.scheduled_date), data: a })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime())

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" />
            Kalender
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {combined.length === 0
              ? "Ingen kommende hendelser"
              : `${combined.length} kommende oppføringer`}
          </p>
        </div>
        <EventForm members={members} currentUserId={user.id} />
      </div>

      {combined.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Kommende
          </h2>
          <div className="space-y-3">
            {combined.map((item) =>
              item.type === "event" ? (
                <EventCard key={`e-${item.data.id}`} event={item.data} currentUserId={user.id} />
              ) : (
                <AssignmentCalendarCard key={`a-${item.data.id}`} assignment={item.data} />
              )
            )}
          </div>
        </section>
      )}

      {combined.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-12 text-center mb-8">
          <CalendarDays className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium text-foreground">Ingen kommende hendelser</p>
          <p className="text-sm text-muted-foreground mt-1">
            Opprett den første hendelsen for nabolaget!
          </p>
        </div>
      )}

      {pastEvents.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Tidligere hendelser
          </h2>
          <div className="space-y-3 opacity-60">
            {pastEvents.slice().reverse().map((event) => (
              <EventCard key={event.id} event={event} currentUserId={user.id} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
