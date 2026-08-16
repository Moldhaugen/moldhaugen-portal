"use client"

import { useState } from "react"
import { deleteSuggestion } from "@/app/(dashboard)/maintenance/actions"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

type Suggestion = {
  id: string
  title: string
  description: string | null
  created_by: string
  created_at: string
  creator?: { id: string; full_name: string | null; email: string } | null
}

type Props = { suggestion: Suggestion; currentUserId: string; isAdmin: boolean }

export function SuggestionCard({ suggestion, currentUserId, isAdmin }: Props) {
  const [deleting, setDeleting] = useState(false)
  const canDelete = suggestion.created_by === currentUserId || isAdmin

  async function handleDelete() {
    if (!confirm(`Slett forslaget "${suggestion.title}"?`)) return
    setDeleting(true)
    await deleteSuggestion(suggestion.id)
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border p-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{suggestion.title}</p>
        {suggestion.description && (
          <p className="text-xs text-muted-foreground mt-0.5">{suggestion.description}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Foreslått av {suggestion.creator?.full_name ?? suggestion.creator?.email ?? "Ukjent"}
        </p>
      </div>
      {canDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
          onClick={handleDelete}
          disabled={deleting}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}
