"use client"

import { useState } from "react"
import { Hammer, Phone, Mail, Plus, Trash2, ChevronDown, ChevronUp, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { addTool, deleteTool, setToolAvailability, createBorrowRequest, approveBorrowRequest, declineBorrowRequest, returnTool } from "@/app/(dashboard)/verktoy/actions"
import type { Tool, ToolRequest } from "@/types"

type Props = {
  tools: Tool[]
  myRequests: ToolRequest[]
  incomingRequests: ToolRequest[]
  currentUserId: string
}

function formatDate(date: string) {
  return new Date(date + "T12:00:00Z").toLocaleDateString("nb-NO", { day: "numeric", month: "short" })
}

function AvailabilityBadge({ available }: { available: boolean }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
      available
        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
        : "bg-muted text-muted-foreground"
    }`}>
      {available ? "Tilgjengelig" : "Utlånt"}
    </span>
  )
}

function IncomingRequestCard({ request, onApprove, onDecline }: {
  request: ToolRequest
  onApprove: (id: string) => Promise<void>
  onDecline: (id: string) => Promise<void>
}) {
  const [loading, setLoading] = useState<"approve" | "decline" | null>(null)
  const requester = request.requester

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium">{requester?.full_name ?? "Ukjent"}{requester?.unit_number ? ` · nr. ${requester.unit_number}` : ""}</p>
          <p className="text-xs text-muted-foreground">{formatDate(request.borrow_from)} – {formatDate(request.borrow_until)}</p>
          <p className="text-xs text-foreground mt-1">"{request.message}"</p>
          <div className="flex gap-3 mt-1">
            {requester?.phone_number && (
              <a href={`tel:${requester.phone_number}`} className="flex items-center gap-1 text-xs text-primary hover:underline">
                <Phone className="h-3 w-3" />{requester.phone_number}
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          className="h-7 text-xs"
          disabled={!!loading}
          onClick={async () => { setLoading("approve"); await onApprove(request.id); setLoading(null) }}
        >
          <Check className="h-3 w-3" />
          {loading === "approve" ? "Godkjenner…" : "Godkjenn"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          disabled={!!loading}
          onClick={async () => { setLoading("decline"); await onDecline(request.id); setLoading(null) }}
        >
          <X className="h-3 w-3" />
          {loading === "decline" ? "Avslår…" : "Avslå"}
        </Button>
      </div>
    </div>
  )
}

function MyToolCard({ tool, requests, onDelete }: {
  tool: Tool
  requests: ToolRequest[]
  onDelete: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [showRequests, setShowRequests] = useState(requests.length > 0)
  const [borrowedByName, setBorrowedByName] = useState(tool.borrowed_by_name ?? "")
  const [saving, setSaving] = useState(false)
  const [localRequests, setLocalRequests] = useState(requests)

  async function handleMakeUnavailable() {
    setSaving(true)
    await setToolAvailability(tool.id, false, borrowedByName)
    setSaving(false)
    setOpen(false)
  }

  async function handleReturn() {
    setSaving(true)
    await returnTool(tool.id)
    setSaving(false)
  }

  async function handleApprove(requestId: string) {
    await approveBorrowRequest(requestId)
    setLocalRequests((prev) => prev.filter((r) => r.id !== requestId))
  }

  async function handleDecline(requestId: string) {
    await declineBorrowRequest(requestId)
    setLocalRequests((prev) => prev.filter((r) => r.id !== requestId))
  }

  return (
    <Card>
      <CardContent className="py-3 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm">{tool.name}</p>
              {localRequests.length > 0 && (
                <button
                  onClick={() => setShowRequests(!showRequests)}
                  className="flex items-center gap-1 text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-medium"
                >
                  {localRequests.length} forespørsel{localRequests.length > 1 ? "er" : ""}
                  {showRequests ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
              )}
            </div>
            {tool.description && <p className="text-xs text-muted-foreground">{tool.description}</p>}
            {!tool.available && tool.borrowed_by_name && (
              <p className="text-xs text-muted-foreground">Hos: <span className="font-medium">{tool.borrowed_by_name}</span></p>
            )}
          </div>
          <AvailabilityBadge available={tool.available} />
          {tool.available ? (
            <button onClick={() => setOpen(!open)} className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0 flex items-center gap-0.5">
              Lån ut {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          ) : (
            <button onClick={handleReturn} disabled={saving} className="text-xs text-primary hover:underline transition-colors shrink-0">
              {saving ? "…" : "Marker returnert"}
            </button>
          )}
          <button onClick={() => onDelete(tool.id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {open && (
          <div className="pt-2 border-t border-border space-y-2">
            <div className="space-y-1">
              <Label htmlFor={`borrower-${tool.id}`} className="text-xs">Hvem har den? (valgfritt)</Label>
              <Input
                id={`borrower-${tool.id}`}
                value={borrowedByName}
                onChange={(e) => setBorrowedByName(e.target.value)}
                placeholder="f.eks. Kari Nordmann"
                className="h-8 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleMakeUnavailable} disabled={saving}>
                {saving ? "Lagrer…" : "Marker som utlånt"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Avbryt</Button>
            </div>
          </div>
        )}

        {showRequests && localRequests.length > 0 && (
          <div className="pt-2 border-t border-border space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Forespørsler</p>
            {localRequests.map((req) => (
              <IncomingRequestCard
                key={req.id}
                request={req}
                onApprove={handleApprove}
                onDecline={handleDecline}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function BorrowRequestForm({ tool, existingRequest, onDone }: {
  tool: Tool
  existingRequest?: ToolRequest
  onDone: () => void
}) {
  const [message, setMessage] = useState("")
  const [borrowFrom, setBorrowFrom] = useState("")
  const [borrowUntil, setBorrowUntil] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [returning, setReturning] = useState(false)

  if (existingRequest) {
    const statusLabel = existingRequest.status === "pending"
      ? "Venter på svar"
      : existingRequest.status === "approved"
        ? "Godkjent ✓"
        : existingRequest.status === "returned"
          ? "Returnert"
          : "Avslått"
    const statusColor = existingRequest.status === "approved"
      ? "text-green-600"
      : existingRequest.status === "declined"
        ? "text-destructive"
        : existingRequest.status === "returned"
          ? "text-muted-foreground"
          : "text-muted-foreground"

    return (
      <div className="pt-2 border-t border-border space-y-2">
        <p className="text-xs text-muted-foreground">
          Din forespørsel ({formatDate(existingRequest.borrow_from)}–{formatDate(existingRequest.borrow_until)}):
          <span className={` font-medium ml-1 ${statusColor}`}>{statusLabel}</span>
        </p>
        {existingRequest.status === "approved" && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            disabled={returning}
            onClick={async () => {
              setReturning(true)
              await returnTool(tool.id)
              setReturning(false)
            }}
          >
            {returning ? "Sender…" : "Meld tilbake"}
          </Button>
        )}
      </div>
    )
  }

  if (sent) {
    return (
      <div className="pt-2 border-t border-border">
        <p className="text-xs text-green-600">Forespørsel sendt! Eieren varsles.</p>
        <button onClick={onDone} className="text-xs text-muted-foreground hover:text-foreground mt-1">Lukk</button>
      </div>
    )
  }

  async function handleSend() {
    setError(null)
    if (!message.trim() || !borrowFrom || !borrowUntil) { setError("Fyll ut alle feltene"); return }
    setSending(true)
    const fd = new FormData()
    fd.set("tool_id", tool.id)
    fd.set("message", message)
    fd.set("borrow_from", borrowFrom)
    fd.set("borrow_until", borrowUntil)
    const result = await createBorrowRequest(fd)
    if (result.error) { setError(result.error); setSending(false); return }
    setSent(true)
    setSending(false)
  }

  const today = new Date().toISOString().split("T")[0]

  return (
    <div className="pt-2 border-t border-border space-y-2">
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Fra</Label>
          <Input type="date" value={borrowFrom} min={today} onChange={(e) => setBorrowFrom(e.target.value)} className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Til</Label>
          <Input type="date" value={borrowUntil} min={borrowFrom || today} onChange={(e) => setBorrowUntil(e.target.value)} className="h-8 text-sm" />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Melding</Label>
        <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Hei, kan jeg låne...?" className="h-8 text-sm" />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSend} disabled={sending}>
          {sending ? "Sender…" : "Send forespørsel"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onDone}>Avbryt</Button>
      </div>
    </div>
  )
}

function OtherToolCard({ tool, myRequest }: { tool: Tool; myRequest?: ToolRequest }) {
  const [requesting, setRequesting] = useState(!!myRequest)

  return (
    <Card className={tool.available ? "" : "opacity-60"}>
      <CardContent className="py-3 space-y-2">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{tool.name}</p>
            {tool.description && <p className="text-xs text-muted-foreground">{tool.description}</p>}
            <p className="text-xs text-muted-foreground mt-1">
              {tool.profile?.full_name ?? "Ukjent"}{tool.profile?.unit_number ? ` · nr. ${tool.profile.unit_number}` : ""}
            </p>
            {!tool.available && tool.borrowed_by_name && (
              <p className="text-xs text-muted-foreground">Hos: <span className="font-medium">{tool.borrowed_by_name}</span></p>
            )}
            <div className="flex gap-3 mt-1">
              {tool.profile?.phone_number && (
                <a href={`tel:${tool.profile.phone_number}`} className="flex items-center gap-1 text-xs text-primary hover:underline">
                  <Phone className="h-3 w-3" />{tool.profile.phone_number}
                </a>
              )}
              {tool.profile?.email && (
                <a href={`mailto:${tool.profile.email}`} className="flex items-center gap-1 text-xs text-primary hover:underline">
                  <Mail className="h-3 w-3" />{tool.profile.email}
                </a>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <AvailabilityBadge available={tool.available} />
            {!requesting && tool.available && (
              <button onClick={() => setRequesting(true)} className="text-xs text-primary hover:underline">
                Spør om å låne
              </button>
            )}
          </div>
        </div>
        {requesting && (
          <BorrowRequestForm
            tool={tool}
            existingRequest={myRequest}
            onDone={() => !myRequest && setRequesting(false)}
          />
        )}
      </CardContent>
    </Card>
  )
}

export function ToolList({ tools, myRequests, incomingRequests, currentUserId }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [optimisticTools, setOptimisticTools] = useState(tools)

  const myTools = optimisticTools.filter((t) => t.user_id === currentUserId)
  const othersTools = optimisticTools.filter((t) => t.user_id !== currentUserId)

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const result = await addTool(new FormData(e.currentTarget))
    if (result.error) { setError(result.error) } else { setShowForm(false); (e.target as HTMLFormElement).reset() }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    setOptimisticTools((prev) => prev.filter((t) => t.id !== id))
    await deleteTool(id)
  }

  return (
    <div className="space-y-8">
      {/* My tools */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Mine verktøy</h2>
          <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4" />Legg til
          </Button>
        </div>

        {showForm && (
          <Card className="mb-3">
            <CardContent className="pt-4">
              <form onSubmit={handleAdd} className="space-y-3">
                {error && <p className="text-sm text-destructive">{error}</p>}
                <div className="space-y-1">
                  <Label htmlFor="name">Verktøy</Label>
                  <Input id="name" name="name" placeholder="f.eks. Gressklipper" required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="description">Beskrivelse (valgfritt)</Label>
                  <Input id="description" name="description" placeholder="f.eks. Elektrisk, passer til hekk" />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={loading}>{loading ? "Lagrer…" : "Lagre"}</Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}>Avbryt</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {myTools.length === 0 && !showForm ? (
          <p className="text-sm text-muted-foreground">Du har ikke registrert noen verktøy ennå.</p>
        ) : (
          <div className="space-y-2">
            {myTools.map((tool) => (
              <MyToolCard
                key={tool.id}
                tool={tool}
                requests={incomingRequests.filter((r) => r.tool_id === tool.id)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Others' tools */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Tilgjengelig fra naboer
        </h2>
        {othersTools.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <Hammer className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium text-sm">Ingen verktøy registrert ennå</p>
            <p className="text-xs text-muted-foreground mt-1">Naboer som registrerer verktøy vil dukke opp her.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {othersTools.map((tool) => (
              <OtherToolCard
                key={tool.id}
                tool={tool}
                myRequest={myRequests.find((r) => r.tool_id === tool.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
