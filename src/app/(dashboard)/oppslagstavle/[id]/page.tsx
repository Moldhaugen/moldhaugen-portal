import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { PostThread } from "@/components/oppslagstavle/post-thread"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Pin } from "lucide-react"
import { format } from "date-fns"
import { nb } from "date-fns/locale"

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  const { data: post } = await supabase
    .from("bulletin_posts")
    .select(`
      *,
      creator:profiles!bulletin_posts_created_by_fkey(id, full_name, email),
      comments:bulletin_comments(
        id, body, created_by, created_at,
        creator:profiles!bulletin_comments_created_by_fkey(id, full_name, email)
      )
    `)
    .eq("id", id)
    .single()

  if (!post) notFound()

  const comments = (post.comments ?? []).sort(
    (a: { created_at: string }, b: { created_at: string }) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/oppslagstavle">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground -ml-2">
            <ArrowLeft className="h-4 w-4" />
            Oppslagstavle
          </Button>
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 mb-6">
        <div className="flex items-start gap-2 mb-2 flex-wrap">
          {post.is_pinned && (
            <Badge variant="outline" className="text-xs text-primary border-primary/40 flex items-center gap-1">
              <Pin className="h-2.5 w-2.5" /> Festet
            </Badge>
          )}
          <h1 className="text-xl font-bold text-foreground leading-tight">{post.title}</h1>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          {post.creator?.full_name ?? post.creator?.email ?? "Ukjent"}
          {" · "}
          {format(new Date(post.created_at), "d. MMMM yyyy HH:mm", { locale: nb })}
        </p>
        <p className="text-sm whitespace-pre-wrap text-foreground">{post.body}</p>
      </div>

      <PostThread
        postId={post.id}
        comments={comments}
        currentUserId={user.id}
        isAdmin={!!profile?.is_admin}
      />
    </div>
  )
}
