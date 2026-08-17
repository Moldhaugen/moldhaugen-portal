"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Ikke innlogget" }

  const full_name = formData.get("full_name") as string
  const unit_number = formData.get("unit_number") as string
  const phone_number = (formData.get("phone_number") as string)?.trim() || null
  const email_bulletin_notifications = formData.get("email_bulletin_notifications") === "on"
  const push_notifications_enabled = formData.get("push_notifications_enabled") === "on"
  const newEmail = (formData.get("email") as string)?.trim()

  let emailConfirmationPending = false
  if (newEmail && newEmail !== user.email) {
    const { error: emailError } = await supabase.auth.updateUser({ email: newEmail })
    if (emailError) return { error: emailError.message }
    emailConfirmationPending = true
  }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name, unit_number, phone_number, email_bulletin_notifications, push_notifications_enabled, updated_at: new Date().toISOString() })
    .eq("id", user.id)

  if (error) return { error: error.message }
  revalidatePath("/profile")
  return { success: true, emailConfirmationPending }
}

export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Ikke innlogget" }

  const file = formData.get("avatar") as File
  if (!file || file.size === 0) return { error: "Ingen fil valgt" }
  if (file.size > 2 * 1024 * 1024) return { error: "Bildet må være under 2 MB" }

  const ext = file.name.split(".").pop()
  const path = `${user.id}/avatar.${ext}`

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true })

  if (uploadError) return { error: uploadError.message }

  const { data } = supabase.storage.from("avatars").getPublicUrl(path)

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: data.publicUrl, updated_at: new Date().toISOString() })
    .eq("id", user.id)

  if (updateError) return { error: updateError.message }
  revalidatePath("/profile")
  revalidatePath("/calendar")
  return { success: true, url: data.publicUrl }
}
