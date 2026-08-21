"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Phone, Mail, Trash2, Plus, Users } from "lucide-react"
import { addBoardMember, removeBoardMember } from "@/app/(dashboard)/info/actions"
import type { BoardMember, ProfileSummary } from "@/types"

type Props = {
  boardMembers: BoardMember[]
  residents: ProfileSummary[]
  isAdmin: boolean
}

export function StyretCard({ boardMembers, residents, isAdmin }: Props) {
  const [selectedUserId, setSelectedUserId] = useState("")
  const [role, setRole] = useState("")
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())

  const visible = boardMembers.filter((m) => !deletedIds.has(m.id))
  const available = residents.filter((r) => !boardMembers.some((m) => m.user_id === r.id))

  async function handleAdd() {
    if (!selectedUserId || !role.trim()) return
    setAddError(null)
    setAdding(true)
    const result = await addBoardMember(selectedUserId, role.trim())
    setAdding(false)
    if (result?.error) { setAddError(result.error); return }
    setSelectedUserId("")
    setRole("")
  }

  async function handleRemove(id: string) {
    setDeletedIds((prev) => new Set([...prev, id]))
    await removeBoardMember(id)
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-sm">Styret</h2>
        </div>

        {visible.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ingen styremedlemmer registrert.</p>
        ) : (
          <div className="divide-y divide-border">
            {visible.map((member) => (
              <div key={member.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{member.profile?.full_name ?? "Ukjent"}</p>
                  <p className="text-xs text-muted-foreground">{member.role}</p>
                  <div className="flex gap-3 mt-1 flex-wrap">
                    {member.profile?.phone_number && (
                      <a href={`tel:${member.profile.phone_number}`} className="flex items-center gap-1 text-xs text-primary hover:underline">
                        <Phone className="h-3 w-3" />{member.profile.phone_number}
                      </a>
                    )}
                    {member.profile?.email && (
                      <a href={`mailto:${member.profile.email}`} className="flex items-center gap-1 text-xs text-primary hover:underline">
                        <Mail className="h-3 w-3" />{member.profile.email}
                      </a>
                    )}
                  </div>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => handleRemove(member.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors shrink-0 mt-0.5"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {isAdmin && (
          <div className={`space-y-2 ${visible.length > 0 ? "mt-4 pt-4 border-t border-border" : "mt-2"}`}>
            {addError && <p className="text-xs text-destructive">{addError}</p>}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Person</Label>
                <select
                  className="w-full h-8 rounded-md border border-border bg-background px-2 text-sm"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                >
                  <option value="">Velg beboer…</option>
                  {available.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.full_name ?? "Ukjent"}{r.unit_number ? ` · nr. ${r.unit_number}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Rolle</Label>
                <Input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="f.eks. Leder"
                  className="h-8 text-sm"
                  onKeyDown={(e) => { if (e.key === "Enter") handleAdd() }}
                />
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={adding || !selectedUserId || !role.trim()}
              className="w-full"
            >
              <Plus className="h-3 w-3 mr-1" />
              {adding ? "Legger til…" : "Legg til styremedlem"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
