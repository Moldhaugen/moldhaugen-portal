"use client"

import { useState } from "react"
import Link from "next/link"
import { deletePost, pinPost } from "@/app/(dashboard)/oppslagstavle/actions"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, Pin, PinOff, MessageSquare, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { nb } from "date-fns/locale"

type Post = {
  id: string
  title: string
  is_pinned: boolean
  created_by: string
  created_at: string
  creator?: { id: string; full_name: string | null; email: string } | null
  comments?: { id: string }[]
}

type Props = { post: Post; currentUserId: string; isAdmin: boolean }

export function PostListCard({ post, currentUserId, isAdmin }: Props) {
  const [pinning, setPinning] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const commentCount = post.comments?.length ?? 0
  const canDelete = post.created_by === currentUserId || isAdmin

  async function handlePin() {
    setPinning(true)
    await pinPost(post.id, !post.is_pinned)
    setPinning(false)
  }

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    if (!confirm(`Slett innlegget "${post.title}"?`)) return
    setDeleting(true)
    await deletePost(post.id)
  }

  return (
    <Card className={post.is_pinned ? "border-primary/40 bg-primary/5" : ""}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Link href={`/oppslagstavle/${post.id}`} className="flex-1 min-w-0 group">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {post.is_pinned && (
                <Badge variant="outline" className="text-xs text-primary border-primary/40 flex items-center gap-1 shrink-0">
                  <Pin className="h-2.5 w-2.5" /> Festet
                </Badge>
              )}
              <h3 className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
                {post.title}
              </h3>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{post.creator?.full_name ?? post.creator?.email ?? "Ukjent"}</span>
              <span>{format(new Date(post.created_at), "d. MMM yyyy", { locale: nb })}</span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {commentCount}
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-1 shrink-0">
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-primary"
                onClick={handlePin}
                disabled={pinning}
                title={post.is_pinned ? "Fjern festing" : "Fest øverst"}
              >
                {post.is_pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
            <Link href={`/oppslagstavle/${post.id}`}>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
