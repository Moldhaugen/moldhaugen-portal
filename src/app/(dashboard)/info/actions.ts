"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function addInfoEntry(fd: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Ikke innlogget" }

  const title = fd.get("title") as string
  const description = fd.get("description") as string | null
  const phone_number = fd.get("phone_number") as string | null
  const category = fd.get("category") as string

  if (!title?.trim()) return { error: "Tittel er påkrevd" }

  const { error } = await supabase.from("info_entries").insert({
    title: title.trim(),
    description: description?.trim() || null,
    phone_number: phone_number?.trim() || null,
    category: category || "Annet",
    created_by: user.id,
  })

  if (error) return { error: "Kunne ikke lagre oppføringen" }
  revalidatePath("/info")
}

export async function updateInfoEntry(id: string, fd: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Ikke innlogget" }

  const title = fd.get("title") as string
  const description = fd.get("description") as string | null
  const phone_number = fd.get("phone_number") as string | null
  const category = fd.get("category") as string

  if (!title?.trim()) return { error: "Tittel er påkrevd" }

  const { error } = await supabase
    .from("info_entries")
    .update({
      title: title.trim(),
      description: description?.trim() || null,
      phone_number: phone_number?.trim() || null,
      category: category || "Annet",
    })
    .eq("id", id)

  if (error) return { error: "Kunne ikke oppdatere oppføringen" }
  revalidatePath("/info")
}

export async function deleteInfoEntry(id: string) {
  const supabase = await createClient()
  await supabase.from("info_entries").delete().eq("id", id)
  revalidatePath("/info")
}
