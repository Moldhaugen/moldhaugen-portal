"use client"

import { useState } from "react"
import { deleteInfoEntry } from "@/app/(dashboard)/info/actions"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Phone, Trash2 } from "lucide-react"

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
  const canDelete = entry.created_by === currentUserId || isAdmin

  async function handleDelete() {
    if (!confirm(`Slett "${entry.title}"?`)) return
    setDeleting(true)
    await deleteInfoEntry(entry.id)
  }

  return (
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
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
