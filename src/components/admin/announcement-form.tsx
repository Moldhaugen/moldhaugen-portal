"use client"

import { useState } from "react"
import { sendAnnouncement } from "@/app/(dashboard)/admin/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Send } from "lucide-react"

export function AnnouncementForm({ recipientCount }: { recipientCount: number }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)
    const result = await sendAnnouncement(new FormData(e.currentTarget))
    if (result?.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      ;(e.target as HTMLFormElement).reset()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
      )}
      {success && (
        <div className="rounded-md bg-green-500/10 border border-green-500/20 px-3 py-2 text-sm text-green-700 dark:text-green-400">
          Melding sendt til {recipientCount} beboer{recipientCount !== 1 ? "e" : ""}!
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="subject">Emne</Label>
        <Input id="subject" name="subject" placeholder="Skriv emne…" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="body">Melding</Label>
        <Textarea id="body" name="body" placeholder="Skriv meldingen din…" rows={5} required />
      </div>
      <Button type="submit" disabled={loading} className="gap-2">
        <Send className="h-4 w-4" />
        {loading ? "Sender…" : `Send til alle (${recipientCount})`}
      </Button>
    </form>
  )
}
