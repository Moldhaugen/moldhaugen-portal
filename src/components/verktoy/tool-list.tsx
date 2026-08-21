"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Camera, Hammer, Phone, Mail, Plus, Trash2, ChevronDown, ChevronUp, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { addTool, deleteTool, createBorrowRequest, approveBorrowRequest, declineBorrowRequest, returnTool, uploadToolImage, assignToolToBorrower, acceptToolAssignment, declineToolAssignment } from "@/app/(dashboard)/verktoy/actions"
import type { Tool, ToolRequest, ProfileSummary } from "@/types"

type Props = {
  tools: Tool[]
  myRequests: ToolRequest[]
  incomingRequests: ToolRequest[]
  residents: ProfileSummary[]
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

function ToolImageUpload({ toolId, currentUrl }: { toolId: string; currentUrl: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(currentUrl)
  const [uploading, setUploading] = useState(false)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setUploading(true)
    const fd = new FormData()
    fd.set("image", file)
    await uploadToolImage(toolId, fd)
    setUploading(false)
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      title="Endre bilde"
      className="relative h-12 w-12 rounded-lg overflow-hidden border border-border bg-muted shrink-0 flex items-center justify-center hover:opacity-80 transition-opacity"
    >
      {preview ? (
        <img src={preview} alt="" className="h-full w-full object-cover" />
      ) : (
        <Camera className="h-4 w-4 text-muted-foreground" />
      )}
      {uploading && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <span className="text-white text-xs">…</span>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
    </button>
  )
}

function MyToolCard({ tool, requests, residents, onDelete }: {
  tool: Tool
  requests: ToolRequest[]
  residents: ProfileSummary[]
  onDelete: (id: string) => void
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [showRequests, setShowRequests] = useState(requests.length > 0)
  const [selectedBorrowerId, setSelectedBorrowerId] = useState("")
  const [saving, setSaving] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)
  const [localRequests, setLocalRequests] = useState(requests)

  useEffect(() => { setLocalRequests(requests) }, [requests])
  useEffect(() => { if (requests.length > 0) setShowRequests(true) }, [requests])

  async function handleAssign() {
    if (!selectedBorrowerId) return
    setAssignError(null)
    setSaving(true)
    const result = await assignToolToBorrower(tool.id, selectedBorrowerId)
    setSaving(false)
    if (result?.error) { setAssignError(result.error); return }
    setOpen(false)
    setSelectedBorrowerId("")
    router.refresh()
  }

  async function handleReturn() {
    setSaving(true)
    const result = await returnTool(tool.id)
    setSaving(false)
    if (result?.error) { alert(result.error); return }
    router.refresh()
  }

  async function handleApprove(requestId: string) {
    await approveBorrowRequest(requestId)
    setLocalRequests((prev) => prev.filter((r) => r.id !== requestId))
    router.refresh()
  }

  async function handleDecline(requestId: string) {
    await declineBorrowRequest(requestId)
    setLocalRequests((prev) => prev.filter((r) => r.id !== requestId))
    router.refresh()
  }

  return (
    <Card>
      <CardContent className="py-3 space-y-3">
        <div className="flex items-center gap-3">
          <ToolImageUpload toolId={tool.id} currentUrl={tool.image_url} />
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
              <Label className="text-xs">Hvem vil du låne til?</Label>
              <select
                className="w-full h-8 rounded-md border border-border bg-background px-2 text-sm"
                value={selectedBorrowerId}
                onChange={(e) => setSelectedBorrowerId(e.target.value)}
              >
                <option value="">Velg nabo…</option>
                {residents.filter((p) => p.id !== tool.user_id).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name ?? "Ukjent"}{p.unit_number ? ` · nr. ${p.unit_number}` : ""}
                  </option>
                ))}
              </select>
            </div>
            {assignError && <p className="text-xs text-destructive">{assignError}</p>}
            <p className="text-xs text-muted-foreground">De får varsel og må bekrefte at de har det.</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAssign} disabled={saving || !selectedBorrowerId}>
                {saving ? "Sender…" : "Send forespørsel"}
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
  const [message, setMessage] = useState(`Hei! Kan jeg låne ${tool.name}?`)
  const [borrowFrom, setBorrowFrom] = useState("")
  const [borrowUntil, setBorrowUntil] = useState("")
  const router = useRouter()
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [returning, setReturning] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [declining, setDeclining] = useState(false)

  if (existingRequest) {
    // Owner offered this tool to the current user — show confirm/decline
    if (existingRequest.owner_initiated && existingRequest.status === "pending") {
      return (
        <div className="pt-2 border-t border-border space-y-2">
          <p className="text-xs text-muted-foreground">Eieren ønsker å låne deg dette verktøyet.</p>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="h-7 text-xs"
              disabled={accepting || declining}
              onClick={async () => {
                setAccepting(true)
                onDone()
                router.refresh()
                await acceptToolAssignment(existingRequest.id)
                router.refresh()
              }}
            >
              {accepting ? "…" : "Bekreft mottak"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              disabled={accepting || declining}
              onClick={async () => {
                setDeclining(true)
                onDone()
                router.refresh()
                await declineToolAssignment(existingRequest.id)
                router.refresh()
              }}
            >
              {declining ? "…" : "Avslå"}
            </Button>
          </div>
        </div>
      )
    }

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
              const result = await returnTool(tool.id)
              setReturning(false)
              if (result?.error) { alert(result.error); return }
              onDone()
              router.refresh()
            }}
          >
            {returning ? "Returnerer…" : "Returner"}
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

  const today = new Date().toISOString().split("T")[0]

  async function buildAndSend(from: string, until: string) {
    setError(null)
    if (!message.trim()) { setError("Fyll ut melding"); return }
    setSending(true)
    const fd = new FormData()
    fd.set("tool_id", tool.id)
    fd.set("message", message)
    fd.set("borrow_from", from)
    fd.set("borrow_until", until)
    const result = await createBorrowRequest(fd)
    if (result.error) { setError(result.error); setSending(false); return }
    setSent(true)
    setSending(false)
    router.refresh()
  }

  return (
    <div className="pt-2 border-t border-border space-y-2">
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="space-y-1">
        <Label className="text-xs">Melding</Label>
        <Input value={message} onChange={(e) => setMessage(e.target.value)} className="h-8 text-sm" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Fra</Label>
          <Input
            type="date"
            value={borrowFrom}
            min={today}
            onChange={(e) => {
              const val = e.target.value
              setBorrowFrom(val)
              if (!borrowUntil || borrowUntil < val) setBorrowUntil(val)
            }}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Til</Label>
          <Input type="date" value={borrowUntil} min={borrowFrom || today} onChange={(e) => setBorrowUntil(e.target.value)} className="h-8 text-sm" />
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" onClick={() => buildAndSend(today, today)} disabled={sending}>
          {sending ? "Sender…" : "Lån i dag"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => { if (borrowFrom && borrowUntil) buildAndSend(borrowFrom, borrowUntil); else setError("Velg datoer") }} disabled={sending}>
          Send forespørsel
        </Button>
        <Button size="sm" variant="ghost" onClick={onDone}>Avbryt</Button>
      </div>
    </div>
  )
}

function OtherToolCard({ tool, myRequest }: { tool: Tool; myRequest?: ToolRequest }) {
  const activeRequest = (myRequest?.status === "pending" || myRequest?.status === "approved") ? myRequest : undefined
  const [requesting, setRequesting] = useState(!!activeRequest)

  useEffect(() => {
    if (!activeRequest) setRequesting(false)
  }, [activeRequest])

  const canOpen = tool.available && !requesting

  return (
    <Card
      className={`${tool.available || myRequest?.status === "approved" ? "" : "opacity-60"} ${canOpen ? "cursor-pointer hover:border-primary/50 transition-colors" : ""}`}
      onClick={canOpen ? () => setRequesting(true) : undefined}
    >
      <CardContent className="py-3 space-y-2">
        <div className="flex items-start gap-3">
          {tool.image_url && (
            <img src={tool.image_url} alt={tool.name} className="h-12 w-12 rounded-lg object-cover shrink-0 border border-border" />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{tool.name}</p>
            {tool.description && <p className="text-xs text-muted-foreground">{tool.description}</p>}
            <p className="text-xs text-muted-foreground mt-1">
              {tool.profile?.full_name ?? "Ukjent"}{tool.profile?.unit_number ? ` · nr. ${tool.profile.unit_number}` : ""}
            </p>
            {!tool.available && tool.borrowed_by_name && (
              <p className="text-xs text-muted-foreground">Hos: <span className="font-medium">{tool.borrowed_by_name}</span></p>
            )}
            <div className="flex gap-3 mt-1" onClick={(e) => e.stopPropagation()}>
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
          <AvailabilityBadge available={tool.available} />
        </div>
        {requesting && (
          <BorrowRequestForm
            tool={tool}
            existingRequest={activeRequest}
            onDone={() => !activeRequest && setRequesting(false)}
          />
        )}
      </CardContent>
    </Card>
  )
}

export function ToolList({ tools, myRequests, incomingRequests, residents, currentUserId }: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel("verktoy")
      .on("broadcast", { event: "refresh" }, () => router.refresh())
      .subscribe()
    const poll = setInterval(() => router.refresh(), 5_000)
    return () => { supabase.removeChannel(channel); clearInterval(poll) }
  }, [router])

  const myTools = tools.filter((t) => t.user_id === currentUserId && !deletedIds.has(t.id))
  const othersTools = tools.filter((t) => t.user_id !== currentUserId && !deletedIds.has(t.id))

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const result = await addTool(new FormData(e.currentTarget))
    if (result.error) { setError(result.error) } else { setShowForm(false); setImagePreview(null); (e.target as HTMLFormElement).reset(); router.refresh() }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    setDeletedIds((prev) => new Set([...prev, id]))
    await deleteTool(id)
    router.refresh()
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
                <div className="space-y-1">
                  <Label htmlFor="image">Bilde (valgfritt)</Label>
                  <div className="flex items-center gap-3">
                    <label htmlFor="image" className="flex items-center gap-2 cursor-pointer h-8 px-3 rounded-md border border-border bg-background text-sm hover:bg-muted transition-colors">
                      <Camera className="h-4 w-4 text-muted-foreground" />
                      Velg bilde
                    </label>
                    <input
                      id="image"
                      name="image"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        setImagePreview(file ? URL.createObjectURL(file) : null)
                      }}
                    />
                    {imagePreview && (
                      <img src={imagePreview} alt="" className="h-8 w-8 rounded object-cover border border-border" />
                    )}
                  </div>
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
                residents={residents}
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
