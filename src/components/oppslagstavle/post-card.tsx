"use client"

import { useState } from "react"
import { deletePost, addComment, deleteComment } from "@/app/(dashboard)/oppslagstavle/actions"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Trash2, MessageSquare, ChevronDown, ChevronUp, Send } from "lucide-react"
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

type Post = {
  id: string
  title: string
  body: string
  created_by: string
  created_at: string
  creator?: Profile | null
  comments?: Comment[]
}

type Props = { post: Post; currentUserId: string; isAdmin: boolean }

export function PostCard({ post, currentUserId, isAdmin }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [replyBody, setReplyBody] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [replyError, setReplyError] = useState<string | null>(null)

  const comments = post.comments ?? []
  const canDeletePost = post.created_by === currentUserId || isAdmin

  async function handleDeletePost() {
    if (!confirm(`Slett innlegget "${post.title}"?`)) return
    await deletePost(post.id)
  }

  async function handleSubmitReply(e: React.FormEvent) {
    e.preventDefault()
    if (!replyBody.trim()) return
    setSubmitting(true)
    setReplyError(null)
    const fd = new FormData()
    fd.set("post_id", post.id)
    fd.set("body", replyBody)
    const result = await addComment(fd)
    if (result?.error) {
      setReplyError(result.error)
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
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base leading-tight">{post.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {post.creator?.full_name ?? post.creator?.email ?? "Ukjent"}
              {" · "}
              {format(new Date(post.created_at), "d. MMM yyyy", { locale: nb })}
            </p>
          </div>
          {canDeletePost && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
              onClick={handleDeletePost}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm whitespace-pre-wrap">{post.body}</p>

        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          {comments.length === 0
            ? "Svar"
            : `${comments.length} svar`}
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>

        {expanded && (
          <div className="space-y-3 pt-1 border-t border-border">
            {comments.length > 0 && (
              <div className="space-y-2">
                {comments.map((c) => (
                  <div key={c.id} className="flex items-start gap-2">
                    <div className="flex-1 min-w-0 rounded-lg bg-muted/50 px-3 py-2">
                      <p className="text-xs font-medium text-muted-foreground mb-0.5">
                        {c.creator?.full_name ?? c.creator?.email ?? "Ukjent"}
                        {" · "}
                        {format(new Date(c.created_at), "d. MMM", { locale: nb })}
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{c.body}</p>
                    </div>
                    {(c.created_by === currentUserId || isAdmin) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0 mt-0.5"
                        onClick={() => handleDeleteComment(c.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmitReply} className="flex gap-2 items-end">
              <div className="flex-1">
                {replyError && (
                  <p className="text-xs text-destructive mb-1">{replyError}</p>
                )}
                <Textarea
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder="Skriv et svar…"
                  rows={2}
                  className="text-sm resize-none"
                />
              </div>
              <Button type="submit" size="icon" disabled={submitting || !replyBody.trim()} className="shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
