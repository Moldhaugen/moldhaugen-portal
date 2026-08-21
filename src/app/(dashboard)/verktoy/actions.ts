"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

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

export async function toggleToolAvailability(id: string, available: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Ikke innlogget" }

  const { error } = await supabase
    .from("tools")
    .update({ available, updated_at: new Date().toISOString() })
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
