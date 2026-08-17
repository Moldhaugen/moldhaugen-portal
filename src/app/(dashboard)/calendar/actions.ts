"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { sendEmail, eventEmail } from "@/lib/email"
import { sendPushToUsers } from "@/lib/push"

export async function createEvent(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const location = formData.get("location") as string
  const start_time = formData.get("start_time") as string
  const end_time = formData.get("end_time") as string
  const is_public = formData.get("is_public") === "true"
  const invited = formData.getAll("invited") as string[]

  const { data: event, error } = await supabase
    .from("events")
    .insert({ title, description: description || null, location: location || null, start_time, end_time, is_public, created_by: user.id })
    .select()
    .single()

  if (error) return { error: error.message }

  // fetch creator name once for emails
  const { data: creator } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single()

  const emailHtml = eventEmail({
    eventTitle: title,
    startTime: start_time,
    endTime: end_time,
    location: location || null,
    description: description || null,
    isPublic: is_public,
    creatorName: creator?.full_name ?? "En beboer",
    portalUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "",
  })

  const portalUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ""

  if (!is_public && invited.length > 0) {
    await supabase.from("event_invitations").insert(
      invited.map((uid) => ({ event_id: event.id, user_id: uid }))
    )
    const { data: inviteeProfiles } = await supabase
      .from("profiles")
      .select("id, email, push_notifications_enabled")
      .in("id", invited)
    const invitees = (inviteeProfiles ?? []).filter((p) => p.email !== creator?.email)
    const inviteeEmails = invitees.map((p) => p.email).filter(Boolean) as string[]
    if (inviteeEmails.length > 0) sendEmail(inviteeEmails, `Invitasjon: ${title}`, emailHtml)
    const pushIds = invitees.filter((p) => p.push_notifications_enabled).map((p) => p.id)
    if (pushIds.length > 0) sendPushToUsers(pushIds, `Invitasjon: ${title}`, `${creator?.full_name ?? "En beboer"} har invitert deg`, `${portalUrl}/calendar`)
  } else if (is_public) {
    const { data: allProfiles } = await supabase
      .from("profiles")
      .select("id, email, push_notifications_enabled")
      .eq("is_approved", true)
    const others = (allProfiles ?? []).filter((p) => p.email !== creator?.email)
    const publicEmails = others.map((p) => p.email).filter(Boolean) as string[]
    if (publicEmails.length > 0) sendEmail(publicEmails, `Ny hendelse: ${title}`, emailHtml)
    const pushIds = others.filter((p) => p.push_notifications_enabled).map((p) => p.id)
    if (pushIds.length > 0) sendPushToUsers(pushIds, `Ny hendelse: ${title}`, `${creator?.full_name ?? "En beboer"} har lagt til en hendelse`, `${portalUrl}/calendar`)
  }

  revalidatePath("/calendar")
  return { success: true }
}

export async function deleteEvent(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", id)
    .eq("created_by", user.id)

  if (error) return { error: error.message }
  revalidatePath("/calendar")
  return { success: true }
}
