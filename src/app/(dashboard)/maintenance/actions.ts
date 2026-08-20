"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { sendEmail, assignmentEmail } from "@/lib/email"
import { sendPushToUsers } from "@/lib/push"

function generateSlotDates(startDate: string, endDate: string | null, recurrence: string): string[] {
  if (recurrence === "once" || recurrence === "custom") return []

  const toStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

  const slots: string[] = []
  const cur = new Date(startDate + "T00:00:00")
  const end = endDate ? new Date(endDate + "T00:00:00") : null

  while (slots.length < 104) {
    if (end && cur > end) break
    slots.push(toStr(cur))
    if (!end) break

    if (recurrence === "weekly") cur.setDate(cur.getDate() + 7)
    else if (recurrence === "biweekly") cur.setDate(cur.getDate() + 14)
    else if (recurrence === "monthly") cur.setMonth(cur.getMonth() + 1)
    else break
  }

  return slots
}

export async function createPlan(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const recurrence = formData.get("recurrence") as string
  const start_date = (formData.get("start_date") as string) || null
  const end_date = (formData.get("end_date") as string) || null

  const { data: plan, error } = await supabase
    .from("maintenance_plans")
    .insert({ title, description: description || null, recurrence, start_date, end_date, created_by: user.id })
    .select("id")
    .single()

  if (error || !plan) return { error: error?.message ?? "Noe gikk galt" }

  if (start_date) {
    const slotDates = generateSlotDates(start_date, end_date, recurrence)
    if (slotDates.length > 0) {
      await supabase.from("maintenance_assignments").insert(
        slotDates.map((date) => ({ plan_id: plan.id, user_id: null, scheduled_date: date }))
      )
    }
  }

  revalidatePath("/maintenance")
  return { success: true }
}

export async function claimSlot(assignmentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Ikke innlogget" }

  const { error } = await supabase
    .from("maintenance_assignments")
    .update({ user_id: user.id, updated_at: new Date().toISOString() })
    .eq("id", assignmentId)
    .is("user_id", null)

  if (error) return { error: error.message }
  revalidatePath("/maintenance")
  return { success: true }
}

export async function assignSlot(assignmentId: string, userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Ikke innlogget" }

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()
  if (!profile?.is_admin) return { error: "Ingen tilgang" }

  const { data: assignment } = await supabase
    .from("maintenance_assignments")
    .select("plan_id, scheduled_date, notes")
    .eq("id", assignmentId)
    .single()
  if (!assignment) return { error: "Oppgaven finnes ikke" }

  const { error } = await supabase
    .from("maintenance_assignments")
    .update({ user_id: userId, updated_at: new Date().toISOString() })
    .eq("id", assignmentId)
  if (error) return { error: error.message }

  const [planRes, assigneeRes, assignerRes] = await Promise.all([
    supabase.from("maintenance_plans").select("title").eq("id", assignment.plan_id).single(),
    supabase.from("profiles").select("email, full_name, email_maintenance_notifications, push_notifications_enabled").eq("id", userId).single(),
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
  ])
  if (planRes.data) {
    const portalUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ""
    const assignerName = assignerRes.data?.full_name ?? "En administrator"
    if (assigneeRes.data?.email && assigneeRes.data?.email_maintenance_notifications) {
      const html = assignmentEmail({
        planTitle: planRes.data.title,
        assignerName,
        scheduledDate: assignment.scheduled_date,
        notes: assignment.notes,
        portalUrl,
      })
      sendEmail(assigneeRes.data.email, `Vedlikeholdsoppgave: ${planRes.data.title}`, html)
    }
    if (assigneeRes.data?.push_notifications_enabled) {
      sendPushToUsers([userId], `Ny vedlikeholdsoppgave`, `${assignerName}: ${planRes.data.title}`, `${portalUrl}/maintenance`)
    }
  }

  revalidatePath("/maintenance")
  return { success: true }
}

export async function releaseSlot(assignmentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Ikke innlogget" }

  const { data: assignment } = await supabase
    .from("maintenance_assignments")
    .select("user_id")
    .eq("id", assignmentId)
    .single()

  const { data: adminProfile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()

  if (!assignment) return { error: "Oppgaven finnes ikke" }
  if (assignment.user_id !== user.id && !adminProfile?.is_admin) return { error: "Ingen tilgang" }

  const { error } = await supabase
    .from("maintenance_assignments")
    .update({ user_id: null, is_completed: false, updated_at: new Date().toISOString() })
    .eq("id", assignmentId)

  if (error) return { error: error.message }
  revalidatePath("/maintenance")
  return { success: true }
}

export async function updatePlan(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const recurrence = formData.get("recurrence") as string
  const start_date = (formData.get("start_date") as string) || null
  const end_date = (formData.get("end_date") as string) || null

  const { error } = await supabase
    .from("maintenance_plans")
    .update({ title, description: description || null, recurrence, start_date, end_date, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("created_by", user.id)

  if (error) return { error: error.message }

  if (start_date) {
    await supabase.from("maintenance_assignments").delete().eq("plan_id", id).is("user_id", null)

    const { data: assigned } = await supabase
      .from("maintenance_assignments")
      .select("id, scheduled_date")
      .eq("plan_id", id)
      .not("user_id", "is", null)

    const newSlotDates = generateSlotDates(start_date, end_date, recurrence)
    const usedAssignmentIds = new Set<string>()
    const openSlotDates: string[] = []

    for (const slotDate of newSlotDates) {
      const slotStart = new Date(slotDate + "T00:00:00")
      const slotEnd = new Date(slotStart)
      if (recurrence === "weekly") slotEnd.setDate(slotEnd.getDate() + 6)
      else if (recurrence === "biweekly") slotEnd.setDate(slotEnd.getDate() + 13)
      else if (recurrence === "monthly") slotEnd.setMonth(slotEnd.getMonth() + 1)

      const overlapping = (assigned ?? []).filter((a) => {
        if (!a.scheduled_date || usedAssignmentIds.has(a.id)) return false
        const d = new Date(a.scheduled_date + "T00:00:00")
        return d >= slotStart && d <= slotEnd
      })

      if (overlapping.length > 0) {
        await supabase
          .from("maintenance_assignments")
          .update({ scheduled_date: slotDate, updated_at: new Date().toISOString() })
          .eq("id", overlapping[0].id)
        usedAssignmentIds.add(overlapping[0].id)
        for (const extra of overlapping.slice(1)) {
          await supabase.from("maintenance_assignments").delete().eq("id", extra.id)
          usedAssignmentIds.add(extra.id)
        }
      } else {
        openSlotDates.push(slotDate)
      }
    }

    const unhandledIds = (assigned ?? [])
      .filter((a) => !usedAssignmentIds.has(a.id))
      .map((a) => a.id)
    if (unhandledIds.length > 0) {
      await supabase.from("maintenance_assignments").delete().in("id", unhandledIds)
    }

    if (openSlotDates.length > 0) {
      await supabase.from("maintenance_assignments").insert(
        openSlotDates.map((date) => ({ plan_id: id, user_id: null, scheduled_date: date }))
      )
    }
  }

  revalidatePath("/maintenance")
  return { success: true }
}

export async function deletePlan(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const { error } = await supabase
    .from("maintenance_plans")
    .delete()
    .eq("id", id)
    .eq("created_by", user.id)

  if (error) return { error: error.message }
  revalidatePath("/maintenance")
  return { success: true }
}

export async function addAssignment(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const plan_id = formData.get("plan_id") as string
  const user_id = formData.get("user_id") as string
  const scheduled_date = formData.get("scheduled_date") as string
  const scheduled_time = formData.get("scheduled_time") as string
  const notes = formData.get("notes") as string

  const { error } = await supabase.from("maintenance_assignments").insert({
    plan_id,
    user_id,
    scheduled_date: scheduled_date || null,
    scheduled_time: scheduled_time || null,
    notes: notes || null,
  })

  if (error) return { error: error.message }

  // new assignment means the plan is no longer fully completed
  await supabase.from("maintenance_plans").update({ is_completed: false }).eq("id", plan_id)

  // send email notification to assigned user (best-effort)
  const [planRes, assigneeRes, assignerRes] = await Promise.all([
    supabase.from("maintenance_plans").select("title").eq("id", plan_id).single(),
    supabase.from("profiles").select("email, full_name, email_maintenance_notifications, push_notifications_enabled").eq("id", user_id).single(),
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
  ])
  if (planRes.data) {
    const portalUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ""
    const assignerName = assignerRes.data?.full_name ?? "En administrator"
    if (assigneeRes.data?.email && assigneeRes.data?.email_maintenance_notifications) {
      const html = assignmentEmail({
        planTitle: planRes.data.title,
        assignerName,
        scheduledDate: scheduled_date || null,
        notes: notes || null,
        portalUrl,
      })
      sendEmail(assigneeRes.data.email, `Vedlikeholdsoppgave: ${planRes.data.title}`, html)
    }
    if (assigneeRes.data?.push_notifications_enabled) {
      sendPushToUsers([user_id], `Ny vedlikeholdsoppgave`, `${assignerName}: ${planRes.data.title}`, `${portalUrl}/maintenance`)
    }
  }

  revalidatePath("/maintenance")
  return { success: true }
}

export async function toggleAssignment(id: string, is_completed: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("maintenance_assignments")
    .update({ is_completed, updated_at: new Date().toISOString() })
    .eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/maintenance")
  return { success: true }
}

export async function updateAssignment(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Ikke innlogget" }

  const user_id = formData.get("user_id") as string
  const scheduled_date = formData.get("scheduled_date") as string
  const notes = formData.get("notes") as string

  const scheduled_time = formData.get("scheduled_time") as string

  const { error } = await supabase
    .from("maintenance_assignments")
    .update({ user_id, scheduled_date: scheduled_date || null, scheduled_time: scheduled_time || null, notes: notes?.trim() || null, updated_at: new Date().toISOString() })
    .eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/maintenance")
  return { success: true }
}

export async function deleteAssignment(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("maintenance_assignments")
    .delete()
    .eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/maintenance")
  return { success: true }
}

export async function convertSuggestionToPlan(suggestionId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Ikke innlogget" }

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()
  if (!profile?.is_admin) return { error: "Ingen tilgang" }

  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const recurrence = formData.get("recurrence") as string

  if (!title?.trim()) return { error: "Tittel er påkrevd" }

  const { error } = await supabase.from("maintenance_plans").insert({
    title: title.trim(),
    description: description?.trim() || null,
    recurrence: recurrence || "weekly",
    created_by: user.id,
  })

  if (error) return { error: error.message }

  await supabase.from("maintenance_suggestions").delete().eq("id", suggestionId)
  revalidatePath("/maintenance")
  return { success: true }
}

export async function addSuggestion(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Ikke innlogget" }

  const title = formData.get("title") as string
  const description = formData.get("description") as string

  if (!title?.trim()) return { error: "Tittel er påkrevd" }

  const { error } = await supabase.from("maintenance_suggestions").insert({
    title: title.trim(),
    description: description?.trim() || null,
    created_by: user.id,
  })

  if (error) return { error: error.message }
  revalidatePath("/maintenance")
  return { success: true }
}

export async function deleteSuggestion(id: string) {
  const supabase = await createClient()
  await supabase.from("maintenance_suggestions").delete().eq("id", id)
  revalidatePath("/maintenance")
  return { success: true }
}
