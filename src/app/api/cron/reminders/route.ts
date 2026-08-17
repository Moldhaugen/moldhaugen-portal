import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { sendEmail, reminderEmail } from "@/lib/email"
import { sendPushToUsers } from "@/lib/push"

const TZ = "Europe/Oslo"

function osloNow() {
  const now = new Date()
  const today = now.toLocaleDateString("en-CA", { timeZone: TZ })   // YYYY-MM-DD
  const osloHour = parseInt(now.toLocaleTimeString("en-GB", { timeZone: TZ, hour: "2-digit", hour12: false }))

  const todayMidnight = new Date(today + "T12:00:00Z")
  const tomorrowMidnight = new Date(todayMidnight.getTime() + 86_400_000)
  const tomorrow = tomorrowMidnight.toLocaleDateString("en-CA", { timeZone: TZ })

  return { today, tomorrow, osloHour }
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createServiceClient()
  const portalUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ""
  const { today, tomorrow, osloHour } = osloNow()
  const hourStr = String(osloHour).padStart(2, "0")
  const nextHour = String((osloHour + 1) % 24).padStart(2, "0")

  const sent: string[] = []

  // ── Day-before reminders at 18:00 ──────────────────────────────────────────
  if (osloHour === 18) {
    const { data: dayBefore } = await supabase
      .from("maintenance_assignments")
      .select("id, user_id, scheduled_date, scheduled_time, plan:maintenance_plans!inner(title)")
      .eq("scheduled_date", tomorrow)
      .is("reminder_day_before_sent_at", null)
      .eq("is_completed", false)

    if (dayBefore?.length) {
      const userIds = [...new Set(dayBefore.map((a) => a.user_id))]
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, email_maintenance_notifications, push_notifications_enabled")
        .in("id", userIds)

      const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]))

      for (const assignment of dayBefore) {
        const profile = profileMap[assignment.user_id]
        if (!profile) continue
        const planTitle = (assignment.plan as { title: string } | null)?.title ?? "Vedlikeholdsoppgave"
        const html = reminderEmail({ planTitle, scheduledDate: assignment.scheduled_date!, scheduledTime: assignment.scheduled_time, isToday: false, portalUrl })

        if (profile.email_maintenance_notifications && profile.email) {
          await sendEmail(profile.email, `Påminnelse: ${planTitle} forfaller i morgen`, html)
        }
        if (profile.push_notifications_enabled) {
          await sendPushToUsers([profile.id], `Oppgave i morgen: ${planTitle}`, "Husk at du har en vedlikeholdsoppgave i morgen.", `${portalUrl}/maintenance`)
        }
        sent.push(assignment.id)
      }

      if (sent.length) {
        await supabase
          .from("maintenance_assignments")
          .update({ reminder_day_before_sent_at: new Date().toISOString() })
          .in("id", sent)
        sent.length = 0
      }
    }
  }

  // ── On-day reminders: tasks with a time → at that hour; no time → at 09:00 ─
  const onDayQueries = [
    // Tasks with a specific time in the current hour window
    supabase
      .from("maintenance_assignments")
      .select("id, user_id, scheduled_date, scheduled_time, plan:maintenance_plans!inner(title)")
      .eq("scheduled_date", today)
      .gte("scheduled_time", `${hourStr}:00`)
      .lt("scheduled_time", `${nextHour}:00`)
      .is("reminder_on_day_sent_at", null)
      .eq("is_completed", false),
    // Tasks with no time, sent at 09:00
    ...(osloHour === 9
      ? [supabase
          .from("maintenance_assignments")
          .select("id, user_id, scheduled_date, scheduled_time, plan:maintenance_plans!inner(title)")
          .eq("scheduled_date", today)
          .is("scheduled_time", null)
          .is("reminder_on_day_sent_at", null)
          .eq("is_completed", false)]
      : []),
  ]

  const results = await Promise.all(onDayQueries)
  const onDayAssignments = results.flatMap((r) => r.data ?? [])

  if (onDayAssignments.length) {
    const userIds = [...new Set(onDayAssignments.map((a) => a.user_id))]
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, email_maintenance_notifications, push_notifications_enabled")
      .in("id", userIds)

    const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]))

    for (const assignment of onDayAssignments) {
      const profile = profileMap[assignment.user_id]
      if (!profile) continue
      const planTitle = (assignment.plan as { title: string } | null)?.title ?? "Vedlikeholdsoppgave"
      const html = reminderEmail({ planTitle, scheduledDate: assignment.scheduled_date!, scheduledTime: assignment.scheduled_time, isToday: true, portalUrl })

      if (profile.email_maintenance_notifications && profile.email) {
        await sendEmail(profile.email, `Påminnelse: ${planTitle} forfaller i dag`, html)
      }
      if (profile.push_notifications_enabled) {
        await sendPushToUsers([profile.id], `Oppgave i dag: ${planTitle}`, "Husk at du har en vedlikeholdsoppgave i dag.", `${portalUrl}/maintenance`)
      }
      sent.push(assignment.id)
    }

    if (sent.length) {
      await supabase
        .from("maintenance_assignments")
        .update({ reminder_on_day_sent_at: new Date().toISOString() })
        .in("id", sent)
    }
  }

  return NextResponse.json({ ok: true, today, tomorrow, osloHour })
}
