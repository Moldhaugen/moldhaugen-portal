"use client"

import { useState } from "react"
import { addAssignment } from "@/app/(dashboard)/maintenance/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { UserPlus } from "lucide-react"
import type { ProfileSummary } from "@/types"

type Props = { planId: string; members: ProfileSummary[] }

export function AssignmentForm({ planId, members }: Props) {
  const [open, setOpen] = useState(false)
  const [userId, setUserId] = useState("")
  const [hasDate, setHasDate] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!userId) { setError("Velg en beboer"); return }
    setError(null)
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    fd.set("plan_id", planId)
    fd.set("user_id", userId)
    if (!hasDate) fd.set("scheduled_date", "")
    const result = await addAssignment(fd)
    if (result?.error) {
      setError(result.error)
    } else {
      setOpen(false)
      setUserId("")
      setHasDate(true)
    }
    setLoading(false)
  }

  const today = new Date().toISOString().split("T")[0]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="h-3.5 w-3.5" />
          Legg til oppgave
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Legg til oppgave</DialogTitle>
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
              <Label htmlFor="scheduled_date">Dato</Label>
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
                <Input id="scheduled_date" name="scheduled_date" type="date" defaultValue={today} className="flex-1" />
                <Input name="scheduled_time" type="time" className="w-28" title="Tidspunkt (valgfritt)" />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notater</Label>
            <Textarea id="notes" name="notes" placeholder="Valgfrie notater" rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Avbryt</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Legger til…" : "Legg til"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
