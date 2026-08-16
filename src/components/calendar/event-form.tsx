"use client"

import { useState } from "react"
import { createEvent } from "@/app/(dashboard)/calendar/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import type { ProfileSummary } from "@/types"

type Props = { members: ProfileSummary[]; currentUserId: string }

export function EventForm({ members, currentUserId }: Props) {
  const [open, setOpen] = useState(false)
  const [isPublic, setIsPublic] = useState(true)
  const [invited, setInvited] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const otherMembers = members.filter((m) => m.id !== currentUserId)

  function toggleInvite(id: string) {
    setInvited((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    fd.set("is_public", String(isPublic))
    invited.forEach((id) => fd.append("invited", id))
    const result = await createEvent(fd)
    if (result?.error) {
      setError(result.error)
    } else {
      setOpen(false)
      setIsPublic(true)
      setInvited([])
    }
    setLoading(false)
  }

  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  const defaultStart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours() + 1)}:00`
  const defaultEnd = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours() + 2)}:00`

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Ny hendelse</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Opprett hendelse</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
          )}
          <div className="space-y-2">
            <Label htmlFor="title">Tittel *</Label>
            <Input id="title" name="title" placeholder="Hendelsens tittel" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Beskrivelse</Label>
            <Textarea id="description" name="description" placeholder="Valgfri beskrivelse" rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Sted</Label>
            <Input id="location" name="location" placeholder="f.eks. Fellesarealet" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="start_time">Start *</Label>
              <Input id="start_time" name="start_time" type="datetime-local" defaultValue={defaultStart} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">Slutt *</Label>
              <Input id="end_time" name="end_time" type="datetime-local" defaultValue={defaultEnd} required />
            </div>
          </div>

          <div className="rounded-lg border border-border p-4 space-y-3">
            <p className="text-sm font-medium">Synlighet</p>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                  isPublic ? "border-primary bg-accent text-accent-foreground" : "border-border hover:bg-secondary"
                }`}
              >
                Offentlig
                <p className="text-xs font-normal text-muted-foreground mt-0.5">Alle beboere kan se dette</p>
              </button>
              <button
                type="button"
                onClick={() => setIsPublic(false)}
                className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                  !isPublic ? "border-primary bg-accent text-accent-foreground" : "border-border hover:bg-secondary"
                }`}
              >
                Privat
                <p className="text-xs font-normal text-muted-foreground mt-0.5">Kun inviterte beboere</p>
              </button>
            </div>

            {!isPublic && otherMembers.length > 0 && (
              <div className="space-y-2 pt-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Inviter beboere</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {otherMembers.map((member) => (
                    <div key={member.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`invite-${member.id}`}
                        checked={invited.includes(member.id)}
                        onCheckedChange={() => toggleInvite(member.id)}
                      />
                      <label htmlFor={`invite-${member.id}`} className="text-sm cursor-pointer">
                        {member.full_name ?? member.email}
                        {member.unit_number && <span className="text-muted-foreground ml-1">({member.unit_number})</span>}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!isPublic && otherMembers.length === 0 && (
              <p className="text-xs text-muted-foreground">Ingen andre beboere å invitere ennå.</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Avbryt</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Oppretter…" : "Opprett hendelse"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
