"use server"

import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { revalidatePath } from "next/cache"
import { sendEmail, toolBorrowRequestEmail, toolRequestApprovedEmail, toolRequestDeclinedEmail } from "@/lib/email"
import { sendPushToUsers } from "@/lib/push"

async function broadcastToolUpdate() {
  try {
    const supabase = createServiceClient()
    await supabase.channel("verktoy").send({
      type: "broadcast",
      event: "refresh",
      payload: {},
    })
  } catch { /* non-critical */ }
}

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
  await broadcastToolUpdate()
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
  await broadcastToolUpdate()
  return { success: true }
}

export async function deleteTool(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Ikke innlogget" }

  const { error } = await supabase.from("tools").delete().eq("id", id).eq("user_id", user.id)
  if (error) return { error: error.message }
  revalidatePath("/verktoy")
  await broadcastToolUpdate()
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
    supabase.from("tools").select("name, user_id, profile:profiles(full_name, email, email_tool_notifications)").eq("id", toolId).single(),
  ])

  if (tool) {
    const owner = tool.profile as unknown as { full_name: string | null; email: string | null; email_tool_notifications: boolean } | null
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ""
    const fromDate = new Date(borrowFrom + "T12:00:00Z").toLocaleDateString("nb-NO", { day: "numeric", month: "long" })
    const toDate = new Date(borrowUntil + "T12:00:00Z").toLocaleDateString("nb-NO", { day: "numeric", month: "long" })

    await Promise.all([
      owner?.email && owner.email_tool_notifications !== false
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
  await broadcastToolUpdate()
  return { success: true }
}

export async function approveBorrowRequest(requestId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Ikke innlogget" }

  const { data: request } = await supabase
    .from("tool_requests")
    .select("*, tool:tools(id, name, user_id), requester:profiles(id, full_name, email, email_tool_notifications)")
    .eq("id", requestId)
    .single()

  if (!request) return { error: "Forespørsel ikke funnet" }

  const tool = request.tool as unknown as { id: string; name: string; user_id: string } | null
  const requester = request.requester as unknown as { id: string; full_name: string | null; email: string | null; email_tool_notifications: boolean } | null

  if (tool?.user_id !== user.id) return { error: "Ikke autorisert" }

  // Prevent double-booking: reject if another approved request overlaps these dates
  const service = createServiceClient()
  const { data: conflict } = await service
    .from("tool_requests")
    .select("id")
    .eq("tool_id", tool!.id)
    .eq("status", "approved")
    .lte("borrow_from", request.borrow_until)
    .gte("borrow_until", request.borrow_from)
    .neq("id", requestId)
    .maybeSingle()

  if (conflict) {
    // Auto-decline and notify the requester with the specific reason
    const siteUrlConflict = process.env.NEXT_PUBLIC_SITE_URL ?? ""
    await service.from("tool_requests").update({ status: "declined" }).eq("id", requestId)
    if (requester) {
      await Promise.all([
        requester.email && requester.email_tool_notifications !== false
          ? sendEmail(
              requester.email,
              `Forespørsel om ${tool!.name}`,
              toolRequestDeclinedEmail({ toolName: tool!.name, portalUrl: siteUrlConflict })
            )
          : Promise.resolve(),
        sendPushToUsers(
          [requester.id],
          `Forespørsel om ${tool!.name}`,
          "Verktøyet er allerede reservert for den perioden.",
          `${siteUrlConflict}/verktoy`,
        ),
      ])
    }
    revalidatePath("/verktoy")
    await broadcastToolUpdate()
    return { conflictDeclined: true }
  }

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
      start_time: `${request.borrow_from}T00:00:00`,
      end_time: `${request.borrow_until}T00:00:00`,
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
      requester.email && requester.email_tool_notifications !== false
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
  await broadcastToolUpdate()
  return { success: true }
}

export async function assignToolToBorrower(toolId: string, borrowerId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Ikke innlogget" }

  const { data: tool } = await supabase
    .from("tools")
    .select("name, user_id")
    .eq("id", toolId)
    .single()

  if (!tool || tool.user_id !== user.id) return { error: "Ikke autorisert" }

  const today = new Date().toISOString().split("T")[0]

  // Use service client: INSERT policy on tool_requests checks requester_id = auth.uid(),
  // but here the owner is creating a request on the borrower's behalf.
  const service = createServiceClient()
  const { error } = await service
    .from("tool_requests")
    .insert({ tool_id: toolId, requester_id: borrowerId, message: "Tilbudt av eier", borrow_from: today, borrow_until: today, owner_initiated: true })

  if (error) return { error: error.message }

  const { data: borrower } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", borrowerId)
    .single()

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ""
  await sendPushToUsers(
    [borrowerId],
    `Tilbud: ${tool.name}`,
    `Du er tilbudt å låne ${tool.name}. Bekreft mottak i portalen.`,
    `${siteUrl}/verktoy`,
  )

  revalidatePath("/verktoy")
  await broadcastToolUpdate()
  return { success: true }
}

export async function acceptToolAssignment(requestId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Ikke innlogget" }

  const { data: request } = await supabase
    .from("tool_requests")
    .select("*, tool:tools(id, name, user_id)")
    .eq("id", requestId)
    .single()

  if (!request || request.requester_id !== user.id || !request.owner_initiated) return { error: "Ikke autorisert" }

  const tool = request.tool as unknown as { id: string; name: string; user_id: string }
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single()

  const service = createServiceClient()
  await Promise.all([
    service.from("tool_requests").update({ status: "approved" }).eq("id", requestId),
    service.from("tools").update({
      available: false,
      borrowed_by_name: profile?.full_name ?? null,
      updated_at: new Date().toISOString(),
    }).eq("id", tool.id),
  ])

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ""
  await sendPushToUsers(
    [tool.user_id],
    `${tool.name} bekreftet mottatt`,
    `${profile?.full_name ?? "En nabo"} har bekreftet at de har ${tool.name}.`,
    `${siteUrl}/verktoy`,
  )

  revalidatePath("/verktoy")
  await broadcastToolUpdate()
  return { success: true }
}

export async function declineToolAssignment(requestId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Ikke innlogget" }

  const { data: request } = await supabase
    .from("tool_requests")
    .select("requester_id, owner_initiated, tool:tools(name, user_id)")
    .eq("id", requestId)
    .single()

  if (!request || request.requester_id !== user.id || !request.owner_initiated) return { error: "Ikke autorisert" }

  const tool = request.tool as unknown as { name: string; user_id: string }

  const service = createServiceClient()
  await service.from("tool_requests").update({ status: "declined" }).eq("id", requestId)

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ""
  await sendPushToUsers(
    [tool.user_id],
    `${tool.name}: tilbud avslått`,
    "Personen du tilbød verktøyet til har avslått.",
    `${siteUrl}/verktoy`,
  )

  revalidatePath("/verktoy")
  await broadcastToolUpdate()
  return { success: true }
}

export async function returnTool(toolId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Ikke innlogget" }

  const service = createServiceClient()

  const [{ data: tool }, { data: approvedRequests }] = await Promise.all([
    service.from("tools").select("user_id, name").eq("id", toolId).single(),
    service.from("tool_requests").select("id, requester_id").eq("tool_id", toolId).eq("status", "approved"),
  ])

  if (!tool) return { error: "Verktøy ikke funnet" }

  const isOwner = tool.user_id === user.id
  const myApprovedRequest = (approvedRequests ?? []).find((r) => r.requester_id === user.id) ?? null
  const isBorrower = !!myApprovedRequest

  if (!isOwner && !isBorrower) return { error: "Ikke autorisert" }

  // Borrower returning: mark only their own request. Owner reclaiming: clear all approved requests.
  const requestUpdate = isBorrower && !isOwner
    ? service.from("tool_requests").update({ status: "returned" }).eq("id", myApprovedRequest!.id)
    : service.from("tool_requests").update({ status: "returned" }).eq("tool_id", toolId).eq("status", "approved")

  await Promise.all([
    service.from("tools").update({
      available: true,
      borrowed_by_name: null,
      updated_at: new Date().toISOString(),
    }).eq("id", toolId),
    requestUpdate,
  ])

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ""
  const otherBorrower = approvedRequests?.find((r) => r.requester_id !== user.id)

  if (!isOwner) {
    await sendPushToUsers([tool.user_id], `${tool.name} er levert tilbake`, "Verktøyet er markert som returnert.", `${siteUrl}/verktoy`)
  } else if (otherBorrower?.requester_id) {
    await sendPushToUsers([otherBorrower.requester_id], `${tool.name} er registrert returnert`, "Eieren har bekreftet at verktøyet er levert tilbake.", `${siteUrl}/verktoy`)
  }

  revalidatePath("/verktoy")
  revalidatePath("/calendar")
  await broadcastToolUpdate()
  return { success: true }
}

export async function declineBorrowRequest(requestId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Ikke innlogget" }

  const { data: request } = await supabase
    .from("tool_requests")
    .select("*, tool:tools(id, name, user_id), requester:profiles(id, full_name, email, email_tool_notifications)")
    .eq("id", requestId)
    .single()

  if (!request) return { error: "Forespørsel ikke funnet" }

  const tool = request.tool as unknown as { id: string; name: string; user_id: string } | null
  const requester = request.requester as unknown as { id: string; full_name: string | null; email: string | null; email_tool_notifications: boolean } | null

  if (tool?.user_id !== user.id) return { error: "Ikke autorisert" }

  await supabase.from("tool_requests").update({ status: "declined" }).eq("id", requestId)

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ""
  if (requester) {
    await Promise.all([
      requester.email && requester.email_tool_notifications !== false
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
  await broadcastToolUpdate()
  return { success: true }
}
