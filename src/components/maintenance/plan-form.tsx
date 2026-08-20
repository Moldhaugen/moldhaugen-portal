"use client"

import { useState, useMemo } from "react"
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

function countSlots(startDate: string, endDate: string, recurrence: string): number {
  if (!startDate || recurrence === "once" || recurrence === "custom") return 0
  let count = 0
  const cur = new Date(startDate + "T00:00:00")
  const end = endDate ? new Date(endDate + "T00:00:00") : null
  while (count < 104) {
    if (end && cur > end) break
    count++
    if (!end) break
    if (recurrence === "weekly") cur.setDate(cur.getDate() + 7)
    else if (recurrence === "biweekly") cur.setDate(cur.getDate() + 14)
    else if (recurrence === "monthly") cur.setMonth(cur.getMonth() + 1)
    else break
  }
  return count
}

const SHIFT_LABELS: Record<string, string> = {
  weekly: "1 uke",
  biweekly: "2 uker",
  monthly: "1 måned",
}

export function PlanForm() {
  const [open, setOpen] = useState(false)
  const [recurrence, setRecurrence] = useState("weekly")
  const [title, setTitle] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const slotCount = useMemo(
    () => countSlots(startDate, endDate, recurrence),
    [startDate, endDate, recurrence]
  )

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
      setStartDate("")
      setEndDate("")
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4" /><span className="hidden sm:inline">Ny plan</span></Button>
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
            <Label>Vaktlengde per person</Label>
            <Select value={recurrence} onValueChange={setRecurrence}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="once">Engangs</SelectItem>
                <SelectItem value="weekly">1 uke</SelectItem>
                <SelectItem value="biweekly">2 uker</SelectItem>
                <SelectItem value="monthly">1 måned</SelectItem>
                <SelectItem value="custom">Tilpasset (manuell)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              Planperiode{" "}
              <span className="text-muted-foreground font-normal">(valgfritt)</span>
            </Label>
            <div className="flex gap-2">
              <div className="flex-1 space-y-1">
                <span className="text-xs text-muted-foreground">Fra</span>
                <Input
                  name="start_date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="flex-1 space-y-1">
                <span className="text-xs text-muted-foreground">Til</span>
                <Input
                  name="end_date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                />
              </div>
            </div>
            {startDate && slotCount > 0 ? (
              <p className="text-xs text-muted-foreground">
                → Oppretter {slotCount} ledige vakt{slotCount !== 1 ? "er" : ""}
                {SHIFT_LABELS[recurrence] ? ` à ${SHIFT_LABELS[recurrence]}` : ""}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Uten datoer: legg til oppgaver manuelt etter opprettelse
              </p>
            )}
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
