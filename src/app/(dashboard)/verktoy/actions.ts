"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { sendEmail, toolBorrowRequestEmail } from "@/lib/email"
import { sendPushToUsers } from "@/lib/push"

export async function addTool(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Ikke innlogget" }

  const name = (formData.get("name") as string)?.trim()
  const description = (formData.get("description") as string)?.trim() || null

  if (!name) return { error: "Navn er påkrevd" }

  const { error } = await supabase
    .from("tools")
    .insert({ user_id: user.id, name, description })

  if (error) return { error: error.message }
  revalidatePath("/verktoy")
  return { success: true }
}

export async function setToolAvailability(id: string, available: boolean, borrowedByName?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Ikke innlogget" }

  const { error } = await supabase
    .from("tools")
    .update({
      available,
      borrowed_by_name: available ? null : (borrowedByName?.trim() || null),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) return { error: error.message }
  revalidatePath("/verktoy")
  return { success: true }
}

export async function deleteTool(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Ikke innlogget" }

  const { error } = await supabase
    .from("tools")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) return { error: error.message }
  revalidatePath("/verktoy")
  return { success: true }
}

export async function requestToBorrow(toolId: string, message: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Ikke innlogget" }

  const [{ data: requester }, { data: tool }] = await Promise.all([
    supabase.from("profiles").select("full_name, phone_number, email").eq("id", user.id).single(),
    supabase.from("tools").select("name, user_id, profile:profiles(full_name, email)").eq("id", toolId).single(),
  ])

  if (!tool) return { error: "Verktøy ikke funnet" }

  const owner = tool.profile as { full_name: string | null; email: string | null } | null
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ""

  await Promise.all([
    owner?.email
      ? sendEmail(
          owner.email,
          `${requester?.full_name ?? "En nabo"} ønsker å låne ${tool.name}`,
          toolBorrowRequestEmail({
            toolName: tool.name,
            requesterName: requester?.full_name ?? "Ukjent",
            requesterPhone: requester?.phone_number ?? null,
            requesterEmail: requester?.email ?? user.email ?? null,
            message,
            portalUrl: siteUrl,
          })
        )
      : Promise.resolve(),
    sendPushToUsers(
      [tool.user_id],
      `Låneforespørsel: ${tool.name}`,
      `${requester?.full_name ?? "En nabo"}: ${message}`,
      `${siteUrl}/verktoy`,
    ),
  ])

  return { success: true }
}
