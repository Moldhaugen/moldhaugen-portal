export const dynamic = "force-dynamic"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Hammer } from "lucide-react"
import { ToolList } from "@/components/verktoy/tool-list"
import type { Tool, ToolRequest, ProfileSummary } from "@/types"

export default async function VerktoyPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) redirect("/login")

  const { data: tools } = await supabase
    .from("tools")
    .select("*, profile:profiles(id, full_name, unit_number, phone_number, email)")
    .order("available", { ascending: false })
    .order("created_at", { ascending: false })

  const myToolIds = (tools ?? []).filter((t) => t.user_id === user.id).map((t) => t.id)
  const today = new Date().toISOString().split("T")[0]

  const [{ data: myRequests }, incomingResult, { data: activeLoans }, { data: residents }] = await Promise.all([
    supabase
      .from("tool_requests")
      .select("id, tool_id, requester_id, message, borrow_from, borrow_until, status, owner_initiated, created_at")
      .eq("requester_id", user.id)
      .order("created_at", { ascending: false }),
    myToolIds.length > 0
      ? supabase
          .from("tool_requests")
          .select("id, tool_id, requester_id, message, borrow_from, borrow_until, status, created_at, requester:profiles(id, full_name, unit_number, phone_number, email)")
          .in("tool_id", myToolIds)
          .eq("status", "pending")
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    supabase
      .from("tool_requests")
      .select("tool_id, borrow_from, borrow_until")
      .eq("status", "approved")
      .lte("borrow_from", today)
      .gte("borrow_until", today),
    supabase
      .from("profiles")
      .select("id, full_name, unit_number, email")
      .eq("is_approved", true)
      .order("full_name"),
  ])

  type LoanInfo = { tool_id: string; borrow_from: string; borrow_until: string }
  const activeLoanMap = new Map((activeLoans ?? []).map((r: LoanInfo) => [r.tool_id, r]))
  const processedTools = (tools ?? []).map((tool) => {
    const loan = activeLoanMap.get(tool.id)
    return {
      ...tool,
      available: loan ? false : tool.available,
      loan_from: loan?.borrow_from ?? null,
      loan_until: loan?.borrow_until ?? null,
    }
  })

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Hammer className="h-6 w-6 text-primary" />
          Verktøy til utlån
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Registrer verktøy du er villig til å låne ut til naboer
        </p>
      </div>
      <ToolList
        tools={processedTools as unknown as Tool[]}
        myRequests={(myRequests ?? []) as ToolRequest[]}
        incomingRequests={(incomingResult.data ?? []) as unknown as ToolRequest[]}
        residents={(residents ?? []) as ProfileSummary[]}
        currentUserId={user.id}
      />
    </div>
  )
}
