import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Hammer } from "lucide-react"
import { ToolList } from "@/components/verktoy/tool-list"
import type { Tool, ToolRequest } from "@/types"

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

  const [{ data: myRequests }, incomingResult] = await Promise.all([
    supabase
      .from("tool_requests")
      .select("id, tool_id, message, borrow_from, borrow_until, status, created_at")
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
  ])

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
        tools={(tools ?? []) as Tool[]}
        myRequests={(myRequests ?? []) as ToolRequest[]}
        incomingRequests={(incomingResult.data ?? []) as unknown as ToolRequest[]}
        currentUserId={user.id}
      />
    </div>
  )
}
