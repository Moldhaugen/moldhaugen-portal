"use client"

import { useState } from "react"
import { Hammer, Phone, Mail, Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { addTool, deleteTool, toggleToolAvailability } from "@/app/(dashboard)/verktoy/actions"
import type { Tool } from "@/types"

type Props = { tools: Tool[]; currentUserId: string }

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

  async function handleToggle(tool: Tool) {
    setOptimisticTools((prev) =>
      prev.map((t) => (t.id === tool.id ? { ...t, available: !t.available } : t))
    )
    await toggleToolAvailability(tool.id, !tool.available)
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
                  <Button type="submit" size="sm" disabled={loading}>
                    {loading ? "Lagrer…" : "Lagre"}
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                    Avbryt
                  </Button>
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
              <Card key={tool.id}>
                <CardContent className="py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{tool.name}</p>
                    {tool.description && <p className="text-xs text-muted-foreground">{tool.description}</p>}
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                    tool.available
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {tool.available ? "Tilgjengelig" : "Ikke tilgjengelig"}
                  </span>
                  <button
                    onClick={() => handleToggle(tool)}
                    title={tool.available ? "Merk som utilgjengelig" : "Merk som tilgjengelig"}
                    className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  >
                    {tool.available
                      ? <ToggleRight className="h-5 w-5 text-green-600" />
                      : <ToggleLeft className="h-5 w-5" />}
                  </button>
                  <button
                    onClick={() => handleDelete(tool.id)}
                    title="Slett"
                    className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </CardContent>
              </Card>
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
            <p className="text-xs text-muted-foreground mt-1">
              Naboer som registrerer verktøy vil dukke opp her.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {othersTools.map((tool) => (
              <Card key={tool.id} className={tool.available ? "" : "opacity-50"}>
                <CardContent className="py-3 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{tool.name}</p>
                    {tool.description && <p className="text-xs text-muted-foreground">{tool.description}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      {tool.profile?.full_name ?? "Ukjent"}
                      {tool.profile?.unit_number ? ` · nr. ${tool.profile.unit_number}` : ""}
                    </p>
                    <div className="flex gap-3 mt-1">
                      {tool.profile?.phone_number && (
                        <a
                          href={`tel:${tool.profile.phone_number}`}
                          className="flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <Phone className="h-3 w-3" />
                          {tool.profile.phone_number}
                        </a>
                      )}
                      {tool.profile?.email && (
                        <a
                          href={`mailto:${tool.profile.email}`}
                          className="flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <Mail className="h-3 w-3" />
                          {tool.profile.email}
                        </a>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${
                    tool.available
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {tool.available ? "Tilgjengelig" : "Ikke tilgjengelig"}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
