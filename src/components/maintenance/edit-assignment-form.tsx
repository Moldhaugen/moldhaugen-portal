"use client"

import { useState } from "react"
import { updateAssignment, releaseSlot } from "@/app/(dashboard)/maintenance/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Pencil } from "lucide-react"
import type { ProfileSummary } from "@/types"

type Assignment = {
  id: string
  user_id: string | null
  scheduled_date: string | null
  scheduled_time: string | null
  notes: string | null
}

type Props = { assignment: Assignment; members: ProfileSummary[] }

export function EditAssignmentForm({ assignment, members }: Props) {
  const [open, setOpen] = useState(false)
  const [userId, setUserId] = useState(assignment.user_id ?? "")
  const [hasDate, setHasDate] = useState(!!assignment.scheduled_date)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [releasing, setReleasing] = useState(false)

  async function handleRelease() {
    setReleasing(true)
    await releaseSlot(assignment.id)
    setOpen(false)
    setReleasing(false)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!userId) { setError("Velg en beboer"); return }
    setError(null)
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    fd.set("user_id", userId)
    if (!hasDate) fd.set("scheduled_date", "")
    const result = await updateAssignment(assignment.id, fd)
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
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
          <Pencil className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Rediger oppgave</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
          )}
          <div className="space-y-2">
            <Label>Ansvarlig beboer *</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger><SelectValue placeholder="Velg beboer…" /></SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.full_name ?? m.email}
                    {m.unit_number && ` (${m.unit_number})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-date">Dato</Label>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                <Checkbox
                  checked={!hasDate}
                  onCheckedChange={(v) => setHasDate(!v)}
                  className="h-3.5 w-3.5"
                />
                Ingen dato
              </label>
            </div>
            {hasDate && (
              <div className="flex gap-2">
                <Input
                  id="edit-date"
                  name="scheduled_date"
                  type="date"
                  defaultValue={assignment.scheduled_date ?? ""}
                  className="flex-1"
                />
                <Input
                  name="scheduled_time"
                  type="time"
                  defaultValue={assignment.scheduled_time?.substring(0, 5) ?? ""}
                  className="w-28"
                  title="Tidspunkt (valgfritt)"
                />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notater</Label>
            <Textarea
              id="edit-notes"
              name="notes"
              defaultValue={assignment.notes ?? ""}
              placeholder="Valgfrie notater"
              rows={2}
            />
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              className="text-muted-foreground hover:text-destructive"
              onClick={handleRelease}
              disabled={releasing}
            >
              {releasing ? "Fjerner…" : "Fjern tildeling"}
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Avbryt</Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Lagrer…" : "Lagre"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
