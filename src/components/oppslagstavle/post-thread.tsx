"use client"

import { useState } from "react"
import { addComment, deleteComment } from "@/app/(dashboard)/oppslagstavle/actions"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Trash2, Send } from "lucide-react"
import { format } from "date-fns"
import { nb } from "date-fns/locale"

type Profile = { id: string; full_name: string | null; email: string }

type Comment = {
  id: string
  body: string
  created_by: string
  created_at: string
  creator?: Profile | null
}

type Props = {
  postId: string
  comments: Comment[]
  currentUserId: string
  isAdmin: boolean
}

export function PostThread({ postId, comments, currentUserId, isAdmin }: Props) {
  const [replyBody, setReplyBody] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!replyBody.trim()) return
    setSubmitting(true)
    setError(null)
    const fd = new FormData()
    fd.set("post_id", postId)
    fd.set("body", replyBody)
    const result = await addComment(fd)
    if (result?.error) {
      setError(result.error)
    } else {
      setReplyBody("")
    }
    setSubmitting(false)
  }

  async function handleDeleteComment(id: string) {
    if (!confirm("Slett dette svaret?")) return
    await deleteComment(id)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        {comments.length === 0 ? "Ingen svar ennå" : `${comments.length} svar`}
      </h2>

      {comments.map((c) => (
        <div key={c.id} className="flex items-start gap-3">
          <div className="flex-1 min-w-0 rounded-xl border border-border bg-card px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              {c.creator?.full_name ?? c.creator?.email ?? "Ukjent"}
              {" · "}
              {format(new Date(c.created_at), "d. MMMM yyyy HH:mm", { locale: nb })}
            </p>
            <p className="text-sm whitespace-pre-wrap">{c.body}</p>
          </div>
          {(c.created_by === currentUserId || isAdmin) && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0 mt-1"
              onClick={() => handleDeleteComment(c.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ))}

      <form onSubmit={handleSubmit} className="space-y-2 pt-2">
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Textarea
          value={replyBody}
          onChange={(e) => setReplyBody(e.target.value)}
          placeholder="Skriv et svar…"
          rows={3}
          className="resize-none"
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={submitting || !replyBody.trim()}>
            <Send className="h-3.5 w-3.5" />
            {submitting ? "Sender…" : "Send svar"}
          </Button>
        </div>
      </form>
    </div>
  )
}
