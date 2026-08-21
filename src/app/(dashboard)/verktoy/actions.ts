"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { sendEmail, toolBorrowRequestEmail, toolRequestApprovedEmail, toolRequestDeclinedEmail } from "@/lib/email"
import { sendPushToUsers } from "@/lib/push"

export async function addTool(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Ikke innlogget" }

  const name = (formData.get("name") as string)?.trim()
  const description = (formData.get("description") as string)?.trim() || null
  if (!name) return { error: "Navn er påkrevd" }

  const { data: tool, error } = await supabase
    .from("tools")
    .insert({ user_id: user.id, name, description })
    .select("id")
    .single()

  if (error || !tool) return { error: error?.message ?? "Noe gikk galt" }

  const image = formData.get("image") as File | null
  if (image && image.size > 0) {
    const ext = image.name.split(".").pop() ?? "jpg"
    const path = `${user.id}/${tool.id}.${ext}`
    const { error: uploadError } = await supabase.storage.from("tools").upload(path, image, { upsert: true })
    if (!uploadError) {
      const { data: urlData } = supabase.storage.from("tools").getPublicUrl(path)
      await supabase.from("tools").update({ image_url: urlData.publicUrl }).eq("id", tool.id)
    }
  }

  revalidatePath("/verktoy")
  return { success: true }
}

export async function uploadToolImage(toolId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Ikke innlogget" }

  const image = formData.get("image") as File
  if (!image || image.size === 0) return { error: "Ingen fil valgt" }
  if (image.size > 5 * 1024 * 1024) return { error: "Bildet må være under 5 MB" }

  const ext = image.name.split(".").pop() ?? "jpg"
  const path = `${user.id}/${toolId}.${ext}`

  const { error: uploadError } = await supabase.storage.from("tools").upload(path, image, { upsert: true })
  if (uploadError) return { error: uploadError.message }

  const { data } = supabase.storage.from("tools").getPublicUrl(path)

  const { error: updateError } = await supabase
    .from("tools")
    .update({ image_url: data.publicUrl })
    .eq("id", toolId)
    .eq("user_id", user.id)

  if (updateError) return { error: updateError.message }
  revalidatePath("/verktoy")
  return { success: true, url: data.publicUrl }
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

  const { error } = await supabase.from("tools").delete().eq("id", id).eq("user_id", user.id)
  if (error) return { error: error.message }
  revalidatePath("/verktoy")
  return { success: true }
}

export async function createBorrowRequest(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Ikke innlogget" }

  const toolId = formData.get("tool_id") as string
  const message = (formData.get("message") as string)?.trim()
  const borrowFrom = formData.get("borrow_from") as string
  const borrowUntil = formData.get("borrow_until") as string

  if (!message || !borrowFrom || !borrowUntil) return { error: "Fyll ut alle feltene" }
  if (borrowUntil < borrowFrom) return { error: "Sluttdato må være etter startdato" }

  const { error } = await supabase
    .from("tool_requests")
    .insert({ tool_id: toolId, requester_id: user.id, message, borrow_from: borrowFrom, borrow_until: borrowUntil })

  if (error) return { error: error.message }

  const [{ data: requester }, { data: tool }] = await Promise.all([
    supabase.from("profiles").select("full_name, phone_number, email").eq("id", user.id).single(),
    supabase.from("tools").select("name, user_id, profile:profiles(full_name, email)").eq("id", toolId).single(),
  ])

  if (tool) {
    const owner = tool.profile as unknown as { full_name: string | null; email: string | null } | null
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ""
    const fromDate = new Date(borrowFrom + "T12:00:00Z").toLocaleDateString("nb-NO", { day: "numeric", month: "long" })
    const toDate = new Date(borrowUntil + "T12:00:00Z").toLocaleDateString("nb-NO", { day: "numeric", month: "long" })

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
              message: `${message}\n\nPeriode: ${fromDate} – ${toDate}`,
              portalUrl: siteUrl,
            })
          )
        : Promise.resolve(),
      sendPushToUsers(
        [tool.user_id],
        `Låneforespørsel: ${tool.name}`,
        `${requester?.full_name ?? "En nabo"} ønsker å låne ${fromDate}–${toDate}`,
        `${siteUrl}/verktoy`,
      ),
    ])
  }

  revalidatePath("/verktoy")
  return { success: true }
}

export async function approveBorrowRequest(requestId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Ikke innlogget" }

  const { data: request } = await supabase
    .from("tool_requests")
    .select("*, tool:tools(id, name, user_id), requester:profiles(id, full_name, email)")
    .eq("id", requestId)
    .single()

  if (!request) return { error: "Forespørsel ikke funnet" }

  const tool = request.tool as unknown as { id: string; name: string; user_id: string } | null
  const requester = request.requester as unknown as { id: string; full_name: string | null; email: string | null } | null

  if (tool?.user_id !== user.id) return { error: "Ikke autorisert" }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ""
  const fromDate = new Date(request.borrow_from + "T12:00:00Z").toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" })
  const toDate = new Date(request.borrow_until + "T12:00:00Z").toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" })

  await Promise.all([
    // Update request status
    supabase.from("tool_requests").update({ status: "approved" }).eq("id", requestId),
    // Mark tool as unavailable
    supabase.from("tools").update({
      available: false,
      borrowed_by_name: requester?.full_name ?? null,
      updated_at: new Date().toISOString(),
    }).eq("id", tool!.id),
  ])

  // Create calendar event
  const { data: event } = await supabase
    .from("events")
    .insert({
      title: `${tool!.name} utlånt`,
      description: `Lånt ut til ${requester?.full_name ?? "ukjent"}`,
      start_time: `${request.borrow_from}T08:00:00`,
      end_time: `${request.borrow_until}T20:00:00`,
      is_public: true,
      created_by: user.id,
    })
    .select("id")
    .single()

  // Invite requester to event so it appears in their calendar
  if (event && requester?.id) {
    await supabase.from("event_invitations").insert({
      event_id: event.id,
      user_id: requester.id,
      status: "accepted",
    })
  }

  // Notify requester
  if (requester) {
    await Promise.all([
      requester.email
        ? sendEmail(
            requester.email,
            `Forespørsel godkjent: ${tool!.name}`,
            toolRequestApprovedEmail({ toolName: tool!.name, fromDate, toDate, portalUrl: siteUrl })
          )
        : Promise.resolve(),
      sendPushToUsers(
        [requester.id],
        "Forespørsel godkjent! 🎉",
        `Du kan låne ${tool!.name} ${fromDate}–${toDate}`,
        `${siteUrl}/verktoy`,
      ),
    ])
  }

  revalidatePath("/verktoy")
  revalidatePath("/calendar")
  return { success: true }
}

export async function returnTool(toolId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Ikke innlogget" }

  const [{ data: tool }, { data: approvedRequest }] = await Promise.all([
    supabase.from("tools").select("user_id, name").eq("id", toolId).single(),
    supabase.from("tool_requests")
      .select("id, requester_id")
      .eq("tool_id", toolId)
      .eq("status", "approved")
      .maybeSingle(),
  ])

  if (!tool) return { error: "Verktøy ikke funnet" }

  const isOwner = tool.user_id === user.id

  if (!isOwner && approvedRequest?.requester_id !== user.id) {
    return { error: "Ikke autorisert" }
  }

  await Promise.all([
    supabase.from("tools").update({
      available: true,
      borrowed_by_name: null,
      updated_at: new Date().toISOString(),
    }).eq("id", toolId),
    approvedRequest
      ? supabase.from("tool_requests").update({ status: "returned" }).eq("id", approvedRequest.id)
      : Promise.resolve(),
  ])

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ""

  if (!isOwner) {
    await sendPushToUsers([tool.user_id], `${tool.name} er levert tilbake`, "Verktøyet er markert som returnert.", `${siteUrl}/verktoy`)
  } else if (approvedRequest?.requester_id) {
    await sendPushToUsers([approvedRequest.requester_id], `${tool.name} er registrert returnert`, "Eieren har bekreftet at verktøyet er levert tilbake.", `${siteUrl}/verktoy`)
  }

  revalidatePath("/verktoy")
  revalidatePath("/calendar")
  return { success: true }
}

export async function declineBorrowRequest(requestId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Ikke innlogget" }

  const { data: request } = await supabase
    .from("tool_requests")
    .select("*, tool:tools(id, name, user_id), requester:profiles(id, full_name, email)")
    .eq("id", requestId)
    .single()

  if (!request) return { error: "Forespørsel ikke funnet" }

  const tool = request.tool as unknown as { id: string; name: string; user_id: string } | null
  const requester = request.requester as unknown as { id: string; full_name: string | null; email: string | null } | null

  if (tool?.user_id !== user.id) return { error: "Ikke autorisert" }

  await supabase.from("tool_requests").update({ status: "declined" }).eq("id", requestId)

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ""
  if (requester) {
    await Promise.all([
      requester.email
        ? sendEmail(
            requester.email,
            `Forespørsel om ${tool!.name}`,
            toolRequestDeclinedEmail({ toolName: tool!.name, portalUrl: siteUrl })
          )
        : Promise.resolve(),
      sendPushToUsers(
        [requester.id],
        `Forespørsel om ${tool!.name}`,
        "Dessverre er ikke verktøyet tilgjengelig i den perioden.",
        `${siteUrl}/verktoy`,
      ),
    ])
  }

  revalidatePath("/verktoy")
  return { success: true }
}
