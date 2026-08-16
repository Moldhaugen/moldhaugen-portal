"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { sendEmail, eventEmail } from "@/lib/email"

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
  })

  if (!is_public && invited.length > 0) {
    await supabase.from("event_invitations").insert(
      invited.map((uid) => ({ event_id: event.id, user_id: uid }))
    )
    // email the invitees
    const { data: inviteeProfiles } = await supabase
      .from("profiles")
      .select("email")
      .in("id", invited)
      .not("email", "is", null)
    const inviteeEmails = (inviteeProfiles ?? []).map((p) => p.email!).filter((e) => e !== creator?.email)
    if (inviteeEmails.length > 0) {
      sendEmail(inviteeEmails, `Invitasjon: ${title}`, emailHtml)
    }
  } else if (is_public) {
    // notify all approved users except the creator
    const { data: allProfiles } = await supabase
      .from("profiles")
      .select("email")
      .eq("is_approved", true)
      .not("email", "is", null)
    const publicEmails = (allProfiles ?? []).map((p) => p.email!).filter((e) => e !== creator?.email)
    if (publicEmails.length > 0) {
      sendEmail(publicEmails, `Ny hendelse: ${title}`, emailHtml)
    }
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
