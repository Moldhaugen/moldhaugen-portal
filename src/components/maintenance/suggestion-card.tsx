"use client"

import { useState } from "react"
import { deleteSuggestion, convertSuggestionToPlan } from "@/app/(dashboard)/maintenance/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Trash2, ArrowRightCircle } from "lucide-react"

type Suggestion = {
  id: string
  title: string
  description: string | null
  created_by: string
  created_at: string
  creator?: { id: string; full_name: string | null; email: string } | null
}

type Props = { suggestion: Suggestion; currentUserId: string; isAdmin: boolean }

export function SuggestionCard({ suggestion, currentUserId, isAdmin }: Props) {
  const [deleting, setDeleting] = useState(false)
  const [convertOpen, setConvertOpen] = useState(false)
  const [recurrence, setRecurrence] = useState("weekly")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canDelete = suggestion.created_by === currentUserId || isAdmin

  async function handleDelete() {
    if (!confirm(`Slett forslaget "${suggestion.title}"?`)) return
    setDeleting(true)
    await deleteSuggestion(suggestion.id)
  }

  async function handleConvert(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    fd.set("recurrence", recurrence)
    const result = await convertSuggestionToPlan(suggestion.id, fd)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setConvertOpen(false)
    }
  }

  return (
    <>
      <div className="flex items-start gap-3 rounded-lg border border-border p-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{suggestion.title}</p>
          {suggestion.description && (
            <p className="text-xs text-muted-foreground mt-0.5">{suggestion.description}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Foreslått av {suggestion.creator?.full_name ?? suggestion.creator?.email ?? "Ukjent"}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-primary"
              onClick={() => setConvertOpen(true)}
              title="Konverter til plan"
            >
              <ArrowRightCircle className="h-4 w-4" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Konverter forslag til plan</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleConvert} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="conv-title">Plannavn *</Label>
              <Input id="conv-title" name="title" defaultValue={suggestion.title} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="conv-description">Beskrivelse</Label>
              <Textarea id="conv-description" name="description" defaultValue={suggestion.description ?? ""} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Frekvens</Label>
              <Select value={recurrence} onValueChange={setRecurrence}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Ukentlig</SelectItem>
                  <SelectItem value="biweekly">Annenhver uke</SelectItem>
                  <SelectItem value="monthly">Månedlig</SelectItem>
                  <SelectItem value="custom">Tilpasset</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              Forslaget slettes automatisk når planen opprettes.
            </p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setConvertOpen(false)}>Avbryt</Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Oppretter…" : "Opprett plan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
