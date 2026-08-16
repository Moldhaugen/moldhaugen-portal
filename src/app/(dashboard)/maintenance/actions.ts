"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createPlan(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const recurrence = formData.get("recurrence") as string

  const { error } = await supabase
    .from("maintenance_plans")
    .insert({ title, description: description || null, recurrence, created_by: user.id })

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

  const { error } = await supabase
    .from("maintenance_plans")
    .update({ title, description: description || null, recurrence, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("created_by", user.id)

  if (error) return { error: error.message }
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
  const notes = formData.get("notes") as string

  const { error } = await supabase.from("maintenance_assignments").insert({
    plan_id,
    user_id,
    scheduled_date,
    notes: notes || null,
  })

  if (error) return { error: error.message }
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

  const { error } = await supabase
    .from("maintenance_assignments")
    .update({ user_id, scheduled_date, notes: notes?.trim() || null, updated_at: new Date().toISOString() })
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
