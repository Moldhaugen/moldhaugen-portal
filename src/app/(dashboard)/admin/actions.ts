"use server"

import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { sendEmail, approvalEmail, announcementEmail } from "@/lib/email"
import { sendPushToUsers } from "@/lib/push"

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createAdminClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
}

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase: null, error: "Ikke innlogget" }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (!profile?.is_admin) return { supabase: null, error: "Ingen tilgang" }
  return { supabase, error: null }
}

export async function approveUser(userId: string) {
  const { supabase, error } = await requireAdmin()
  if (error || !supabase) return { error }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", userId)
    .single()

  const { error: err } = await supabase
    .from("profiles")
    .update({ is_approved: true })
    .eq("id", userId)

  if (err) return { error: err.message }

  // notify the approved user
  if (profile?.email) {
    const portalUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://moldhaugen.no"
    const html = approvalEmail({ name: profile.full_name ?? "Beboer", portalUrl })
    sendEmail(profile.email, "Kontoen din er godkjent – Moldhaugen", html)
  }

  revalidatePath("/admin")
  return { success: true }
}

export async function rejectUser(userId: string) {
  const { supabase, error } = await requireAdmin()
  if (error || !supabase) return { error }

  const { error: err } = await supabase
    .from("profiles")
    .delete()
    .eq("id", userId)

  if (err) return { error: err.message }
  revalidatePath("/admin")
  return { success: true }
}

export async function deleteUser(userId: string) {
  const { supabase, error } = await requireAdmin()
  if (error || !supabase) return { error }

  const admin = getAdminClient()
  const { error: err } = await admin.auth.admin.deleteUser(userId)
  if (err) return { error: err.message }
  revalidatePath("/admin")
  return { success: true }
}

export async function toggleAdmin(userId: string, isAdmin: boolean) {
  const { supabase, error } = await requireAdmin()
  if (error || !supabase) return { error }

  const { error: err } = await supabase
    .from("profiles")
    .update({ is_admin: isAdmin })
    .eq("id", userId)

  if (err) return { error: err.message }
  revalidatePath("/admin")
  return { success: true }
}

export async function sendAnnouncement(formData: FormData) {
  const { supabase, error } = await requireAdmin()
  if (error || !supabase) return { error }

  const subject = (formData.get("subject") as string)?.trim()
  const body = (formData.get("body") as string)?.trim()
  if (!subject || !body) return { error: "Emne og melding er påkrevd" }

  const { data: { user } } = await supabase.auth.getUser()
  const { data: sender } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user!.id)
    .single()

  const { data: recipients } = await supabase
    .from("profiles")
    .select("id, email, email_announcement_notifications, push_notifications_enabled")
    .eq("is_approved", true)

  if (!recipients || recipients.length === 0) return { error: "Ingen mottakere funnet" }

  const portalUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ""
  const senderName = sender?.full_name ?? "Administrator"

  const emails = recipients.filter((r) => r.email_announcement_notifications).map((r) => r.email).filter(Boolean) as string[]
  if (emails.length > 0) {
    await sendEmail(emails, subject, announcementEmail({ subject, body, senderName, portalUrl }))
  }

  const pushIds = recipients.filter((r) => r.push_notifications_enabled).map((r) => r.id)
  if (pushIds.length > 0) {
    sendPushToUsers(pushIds, subject, `${senderName}: ${body.slice(0, 80)}`, portalUrl)
  }

  return { success: true }
}
