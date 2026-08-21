import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PostForm } from "@/components/oppslagstavle/post-form"
import { PostListCard } from "@/components/oppslagstavle/post-list-card"
import { Pin } from "lucide-react"

export default async function OppslagstavlePage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) redirect("/login")

  const [{ data: profile }, { data: posts }] = await Promise.all([
    supabase.from("profiles").select("is_admin, full_name").eq("id", user.id).single(),
    supabase
      .from("bulletin_posts")
      .select(`
        id, title, is_pinned, created_by, created_at,
        creator:profiles!bulletin_posts_created_by_fkey(id, full_name, email),
        comments:bulletin_comments(id)
      `)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false }),
  ])

  const allPosts = posts ?? []
  const firstName = profile?.full_name?.split(" ")[0]

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Welcome banner */}
      <div className="rounded-xl bg-primary/10 border border-primary/20 px-6 py-5 mb-8">
        <h1 className="text-xl font-bold text-foreground">
          {firstName ? `Hei, ${firstName}! 👋` : "Velkommen til Moldhaugen! 👋"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Her holder vi kontakten, planlegger dugnader og deler det som er nyttig for borettslaget.
        </p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Pin className="h-4 w-4 text-primary" />
          Oppslagstavle
        </h2>
        <PostForm />
      </div>

      {allPosts.length > 0 ? (
        <div className="space-y-2">
          {(allPosts as any[]).map((post) => (
            <PostListCard
              key={post.id}
              post={post}
              currentUserId={user.id}
              isAdmin={!!profile?.is_admin}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Pin className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium text-foreground">Ingen innlegg ennå</p>
          <p className="text-sm text-muted-foreground mt-1">
            Del nyheter, spørsmål eller beskjeder med nabolaget.
          </p>
        </div>
      )}
    </div>
  )
}
