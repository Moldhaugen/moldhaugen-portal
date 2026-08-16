"use client"

import { useState } from "react"
import { createPlan } from "@/app/(dashboard)/maintenance/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Plus } from "lucide-react"

const DUGNAD_SUGGESTIONS = [
  "Gressklipper",
  "Snørydding",
  "Raking av løv",
  "Rengjøring av fellesarealer",
  "Klippe hekk",
  "Vaske trapper",
  "Vedlikeholde sandkasse",
  "Planting og hagearbeid",
  "Male gjerde",
  "Rydde søppelrom",
]

export function PlanForm() {
  const [open, setOpen] = useState(false)
  const [recurrence, setRecurrence] = useState("weekly")
  const [title, setTitle] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    fd.set("recurrence", recurrence)
    const result = await createPlan(fd)
    if (result?.error) {
      setError(result.error)
    } else {
      setOpen(false)
      setRecurrence("weekly")
      setTitle("")
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4" />Ny plan</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Opprett vedlikeholdsplan</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
          )}

          <div className="space-y-2">
            <Label>Dugnadsforslag</Label>
            <div className="flex flex-wrap gap-2">
              {DUGNAD_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setTitle(s)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    title === s
                      ? "border-primary bg-accent text-accent-foreground"
                      : "border-border hover:bg-secondary"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Plannavn *</Label>
            <Input
              id="title"
              name="title"
              placeholder="f.eks. Gressklipper"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beskrivelse</Label>
            <Textarea id="description" name="description" placeholder="Detaljer om oppgaven" rows={2} />
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Avbryt</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Oppretter…" : "Opprett plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
