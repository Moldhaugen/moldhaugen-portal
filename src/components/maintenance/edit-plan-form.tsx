"use client"

import { useState } from "react"
import { updatePlan } from "@/app/(dashboard)/maintenance/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Pencil } from "lucide-react"
import type { MaintenancePlan } from "@/types"

type Props = { plan: MaintenancePlan }

export function EditPlanForm({ plan }: Props) {
  const [open, setOpen] = useState(false)
  const [recurrence, setRecurrence] = useState<string>(plan.recurrence)
  const [startDate, setStartDate] = useState(plan.start_date ?? "")
  const [endDate, setEndDate] = useState(plan.end_date ?? "")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    fd.set("recurrence", recurrence)
    const result = await updatePlan(plan.id, fd)
    if (result?.error) {
      setError(result.error)
    } else {
      setOpen(false)
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rediger plan</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
          )}
          <div className="space-y-2">
            <Label htmlFor="edit-title">Plannavn *</Label>
            <Input id="edit-title" name="title" defaultValue={plan.title} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-description">Beskrivelse</Label>
            <Textarea id="edit-description" name="description" defaultValue={plan.description ?? ""} rows={2} />
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
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Avbryt</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Lagrer…" : "Lagre"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
