"use client"

import { useState } from "react"
import { updateAssignment } from "@/app/(dashboard)/maintenance/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Pencil } from "lucide-react"
import type { ProfileSummary } from "@/types"

type Assignment = {
  id: string
  user_id: string
  scheduled_date: string
  notes: string | null
}

type Props = { assignment: Assignment; members: ProfileSummary[] }

export function EditAssignmentForm({ assignment, members }: Props) {
  const [open, setOpen] = useState(false)
  const [userId, setUserId] = useState(assignment.user_id)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!userId) { setError("Velg en beboer"); return }
    setError(null)
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    fd.set("user_id", userId)
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
            <Label htmlFor="edit-date">Dato *</Label>
            <Input
              id="edit-date"
              name="scheduled_date"
              type="date"
              defaultValue={assignment.scheduled_date}
              required
            />
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
