"use client"

import { useState } from "react"
import { deleteInfoEntry, updateInfoEntry } from "@/app/(dashboard)/info/actions"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Phone, Trash2, Pencil } from "lucide-react"

const CATEGORIES = ["Tjenester", "Kontakter", "Nødhjelp", "Annet"]

type InfoEntry = {
  id: string
  title: string
  description: string | null
  phone_number: string | null
  category: string
  created_by: string
  creator?: { id: string; full_name: string | null; email: string } | null
}

type Props = { entry: InfoEntry; currentUserId: string; isAdmin: boolean }

export function InfoCard({ entry, currentUserId, isAdmin }: Props) {
  const [deleting, setDeleting] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editCategory, setEditCategory] = useState(entry.category)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const canEdit = entry.created_by === currentUserId || isAdmin

  async function handleDelete() {
    if (!confirm(`Slett "${entry.title}"?`)) return
    setDeleting(true)
    await deleteInfoEntry(entry.id)
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEditError(null)
    setEditLoading(true)
    const fd = new FormData(e.currentTarget)
    fd.set("category", editCategory)
    const result = await updateInfoEntry(entry.id, fd)
    if (result?.error) {
      setEditError(result.error)
      setEditLoading(false)
    } else {
      setEditOpen(false)
      setEditLoading(false)
    }
  }

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{entry.title}</p>
              {entry.phone_number && (
                <a
                  href={`tel:${entry.phone_number.replace(/\s/g, "")}`}
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-1"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {entry.phone_number}
                </a>
              )}
              {entry.description && (
                <p className="text-sm text-muted-foreground mt-1">{entry.description}</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Lagt til av {entry.creator?.full_name ?? entry.creator?.email ?? "Ukjent"}
              </p>
            </div>
            {canEdit && (
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => { setEditOpen(true); setEditCategory(entry.category) }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rediger oppføring</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            {editError && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{editError}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-title">Tittel *</Label>
              <Input id="edit-title" name="title" defaultValue={entry.title} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Telefonnummer</Label>
              <Input id="edit-phone" name="phone_number" type="tel" defaultValue={entry.phone_number ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-desc">Beskrivelse</Label>
              <Textarea id="edit-desc" name="description" defaultValue={entry.description ?? ""} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select value={editCategory} onValueChange={setEditCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Avbryt</Button>
              <Button type="submit" disabled={editLoading}>{editLoading ? "Lagrer…" : "Lagre"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
