"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createPost(fd: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Ikke innlogget" }

  const title = (fd.get("title") as string)?.trim()
  const body = (fd.get("body") as string)?.trim()
  if (!title || !body) return { error: "Tittel og innhold er påkrevd" }

  const { error } = await supabase.from("bulletin_posts").insert({ title, body, created_by: user.id })
  if (error) return { error: "Kunne ikke opprette innlegget" }
  revalidatePath("/oppslagstavle")
}

export async function deletePost(id: string) {
  const supabase = await createClient()
  await supabase.from("bulletin_posts").delete().eq("id", id)
  revalidatePath("/oppslagstavle")
}

export async function addComment(fd: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Ikke innlogget" }

  const post_id = fd.get("post_id") as string
  const body = (fd.get("body") as string)?.trim()
  if (!body) return { error: "Svar kan ikke være tomt" }

  const { error } = await supabase.from("bulletin_comments").insert({ post_id, body, created_by: user.id })
  if (error) return { error: "Kunne ikke legge til svar" }
  revalidatePath("/oppslagstavle")
}

export async function deleteComment(id: string) {
  const supabase = await createClient()
  await supabase.from("bulletin_comments").delete().eq("id", id)
  revalidatePath("/oppslagstavle")
}
