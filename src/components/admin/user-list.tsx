"use client"

import { useState } from "react"
import { approveUser, rejectUser, toggleAdmin, deleteUser } from "@/app/(dashboard)/admin/actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Check, X, ShieldCheck, ShieldOff, Trash2 } from "lucide-react"
import { format } from "date-fns"

type UserRow = {
  id: string
  full_name: string | null
  email: string | null
  unit_number: string | null
  is_approved: boolean
  is_admin: boolean
  created_at: string
}

type Props = {
  pending: UserRow[]
  approved: UserRow[]
  currentUserId: string
}

function initials(u: UserRow) {
  return (u.full_name ?? u.email ?? "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function DeleteConfirmDialog({ user, onConfirm, onCancel, loading }: {
  user: UserRow
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onCancel() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Er du sikker?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Dette vil permanent slette brukerkontoen til{" "}
          <span className="font-semibold text-foreground">{user.full_name ?? user.email}</span>.
          Handlingen kan ikke angres.
        </p>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel} disabled={loading}>Avbryt</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? "Sletter…" : "Ja, slett bruker"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function UserCard({ user, currentUserId, onApprove, onReject, onToggleAdmin, onDelete, loading }: {
  user: UserRow
  currentUserId: string
  onApprove?: () => void
  onReject?: () => void
  onToggleAdmin?: () => void
  onDelete?: () => void
  loading: boolean
}) {
  const isSelf = user.id === currentUserId
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarFallback className="bg-primary text-white text-xs">{initials(user)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium">{user.full_name ?? "—"}</p>
          {user.unit_number && <Badge variant="outline" className="text-xs">{user.unit_number}</Badge>}
          {user.is_admin && <Badge variant="default" className="text-xs">Admin</Badge>}
          {isSelf && <Badge variant="secondary" className="text-xs">Deg</Badge>}
        </div>
        <p className="text-xs text-muted-foreground">{user.email}</p>
        <p className="text-xs text-muted-foreground">
          Registrert {format(new Date(user.created_at), "d. MMM yyyy")}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {onApprove && (
          <Button size="sm" onClick={onApprove} disabled={loading} className="gap-1">
            <Check className="h-3.5 w-3.5" /> Godkjenn
          </Button>
        )}
        {onReject && (
          <Button size="sm" variant="destructive" onClick={onReject} disabled={loading} className="gap-1">
            <X className="h-3.5 w-3.5" /> Avvis
          </Button>
        )}
        {onToggleAdmin && !isSelf && (
          <Button
            size="sm"
            variant="outline"
            onClick={onToggleAdmin}
            disabled={loading}
            title={user.is_admin ? "Fjern admin" : "Gjør til admin"}
          >
            {user.is_admin ? <ShieldOff className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
          </Button>
        )}
        {onDelete && !isSelf && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            disabled={loading}
            className="text-muted-foreground hover:text-destructive"
            title="Slett bruker"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}

export function AdminUserList({ pending, approved, currentUserId }: Props) {
  const [loading, setLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<UserRow | null>(null)

  async function handle(fn: () => Promise<unknown>) {
    setLoading(true)
    await fn()
    setLoading(false)
  }

  async function handleDelete(user: UserRow) {
    setConfirmDelete(user)
  }

  async function confirmDeleteUser() {
    if (!confirmDelete) return
    setLoading(true)
    await deleteUser(confirmDelete.id)
    setConfirmDelete(null)
    setLoading(false)
  }

  return (
    <>
      {confirmDelete && (
        <DeleteConfirmDialog
          user={confirmDelete}
          onConfirm={confirmDeleteUser}
          onCancel={() => setConfirmDelete(null)}
          loading={loading}
        />
      )}

      <div className="space-y-8">
        {/* Pending */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              Venter på godkjenning
              {pending.length > 0 && (
                <Badge variant="warning" className="text-xs">{pending.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pending.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ingen ventende brukere.</p>
            ) : (
              pending.map((u) => (
                <UserCard
                  key={u.id}
                  user={u}
                  currentUserId={currentUserId}
                  loading={loading}
                  onApprove={() => handle(() => approveUser(u.id))}
                  onReject={() => handle(() => rejectUser(u.id))}
                  onDelete={() => handleDelete(u)}
                />
              ))
            )}
          </CardContent>
        </Card>

        {/* Approved */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Godkjente beboere ({approved.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {approved.map((u) => (
              <UserCard
                key={u.id}
                user={u}
                currentUserId={currentUserId}
                loading={loading}
                onToggleAdmin={() => handle(() => toggleAdmin(u.id, !u.is_admin))}
                onDelete={() => handleDelete(u)}
              />
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
