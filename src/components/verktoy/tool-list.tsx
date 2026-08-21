"use client"

import { useState } from "react"
import { Hammer, Phone, Mail, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { addTool, deleteTool, setToolAvailability, requestToBorrow } from "@/app/(dashboard)/verktoy/actions"
import type { Tool } from "@/types"

type Props = { tools: Tool[]; currentUserId: string }

function AvailabilityBadge({ available }: { available: boolean }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
      available
        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
        : "bg-muted text-muted-foreground"
    }`}>
      {available ? "Tilgjengelig" : "Ikke tilgjengelig"}
    </span>
  )
}

function MyToolCard({ tool, onDelete }: { tool: Tool; onDelete: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const [borrowedByName, setBorrowedByName] = useState(tool.borrowed_by_name ?? "")
  const [saving, setSaving] = useState(false)

  async function handleMakeUnavailable() {
    setSaving(true)
    await setToolAvailability(tool.id, false, borrowedByName)
    setSaving(false)
    setOpen(false)
  }

  async function handleMakeAvailable() {
    setSaving(true)
    await setToolAvailability(tool.id, true)
    setSaving(false)
  }

  return (
    <Card>
      <CardContent className="py-3 space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{tool.name}</p>
            {tool.description && <p className="text-xs text-muted-foreground">{tool.description}</p>}
            {!tool.available && tool.borrowed_by_name && (
              <p className="text-xs text-muted-foreground mt-0.5">Hos: <span className="font-medium">{tool.borrowed_by_name}</span></p>
            )}
          </div>
          <AvailabilityBadge available={tool.available} />
          {tool.available ? (
            <button
              onClick={() => setOpen(!open)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0 flex items-center gap-0.5"
            >
              Lån ut {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          ) : (
            <button
              onClick={handleMakeAvailable}
              disabled={saving}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              Tilbake
            </button>
          )}
          <button
            onClick={() => onDelete(tool.id)}
            title="Slett"
            className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {open && (
          <div className="pt-1 border-t border-border space-y-2">
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
      </CardContent>
    </Card>
  )
}

function BorrowRequestForm({ tool, onDone }: { tool: Tool; onDone: () => void }) {
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSend() {
    if (!message.trim()) return
    setSending(true)
    await requestToBorrow(tool.id, message.trim())
    setSent(true)
    setSending(false)
  }

  if (sent) {
    return (
      <div className="pt-2 border-t border-border">
        <p className="text-xs text-green-600">Forespørsel sendt til {tool.profile?.full_name ?? "eieren"}!</p>
        <button onClick={onDone} className="text-xs text-muted-foreground hover:text-foreground mt-1">Lukk</button>
      </div>
    )
  }

  return (
    <div className="pt-2 border-t border-border space-y-2">
      <Label className="text-xs">Melding til {tool.profile?.full_name ?? "eieren"}</Label>
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Hei, kan jeg låne...?"
        className="h-8 text-sm"
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSend} disabled={sending || !message.trim()}>
          {sending ? "Sender…" : "Send forespørsel"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onDone}>Avbryt</Button>
      </div>
    </div>
  )
}

function OtherToolCard({ tool }: { tool: Tool }) {
  const [requesting, setRequesting] = useState(false)

  return (
    <Card className={tool.available ? "" : "opacity-60"}>
      <CardContent className="py-3 space-y-2">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{tool.name}</p>
            {tool.description && <p className="text-xs text-muted-foreground">{tool.description}</p>}
            <p className="text-xs text-muted-foreground mt-1">
              {tool.profile?.full_name ?? "Ukjent"}
              {tool.profile?.unit_number ? ` · nr. ${tool.profile.unit_number}` : ""}
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
            {tool.available && (
              <button
                onClick={() => setRequesting(!requesting)}
                className="text-xs text-primary hover:underline"
              >
                Spør om å låne
              </button>
            )}
          </div>
        </div>
        {requesting && <BorrowRequestForm tool={tool} onDone={() => setRequesting(false)} />}
      </CardContent>
    </Card>
  )
}

export function ToolList({ tools, currentUserId }: Props) {
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
    if (result.error) {
      setError(result.error)
    } else {
      setShowForm(false)
      ;(e.target as HTMLFormElement).reset()
    }
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
            <Plus className="h-4 w-4" />
            Legg til
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
              <MyToolCard key={tool.id} tool={tool} onDelete={handleDelete} />
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
              <OtherToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
