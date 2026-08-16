import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { EventForm } from "@/components/calendar/event-form"
import { EventCard } from "@/components/calendar/event-card"
import { CalendarDays } from "lucide-react"
import type { ProfileSummary } from "@/types"

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [eventsRes, profilesRes] = await Promise.all([
    supabase
      .from("events")
      .select(`
        *,
        creator:profiles!events_created_by_fkey(id, full_name, email),
        invitations:event_invitations(id, user_id, status, profile:profiles(id, full_name, email))
      `)
      .order("start_time", { ascending: true }),
    supabase.from("profiles").select("id, full_name, email").order("full_name"),
  ])

  const events = eventsRes.data ?? []
  const members = (profilesRes.data ?? []) as ProfileSummary[]

  const upcoming = events.filter((e) => new Date(e.end_time) >= new Date())
  const past = events.filter((e) => new Date(e.end_time) < new Date())

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" />
            Calendar
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {upcoming.length === 0
              ? "No upcoming events"
              : `${upcoming.length} upcoming event${upcoming.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <EventForm members={members} currentUserId={user.id} />
      </div>

      {/* Upcoming events */}
      {upcoming.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Upcoming
          </h2>
          <div className="space-y-3">
            {upcoming.map((event) => (
              <EventCard key={event.id} event={event} currentUserId={user.id} />
            ))}
          </div>
        </section>
      )}

      {upcoming.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-12 text-center mb-8">
          <CalendarDays className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium text-foreground">No upcoming events</p>
          <p className="text-sm text-muted-foreground mt-1">
            Create the first event for the neighborhood!
          </p>
        </div>
      )}

      {/* Past events */}
      {past.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Past events
          </h2>
          <div className="space-y-3 opacity-60">
            {past.slice().reverse().map((event) => (
              <EventCard key={event.id} event={event} currentUserId={user.id} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
