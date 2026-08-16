"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

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

  const { error: err } = await supabase
    .from("profiles")
    .update({ is_approved: true })
    .eq("id", userId)

  if (err) return { error: err.message }
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
