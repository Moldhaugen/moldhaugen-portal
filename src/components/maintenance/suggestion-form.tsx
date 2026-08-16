"use client"

import { useState } from "react"
import { addSuggestion } from "@/app/(dashboard)/maintenance/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Lightbulb } from "lucide-react"

export function SuggestionForm() {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const result = await addSuggestion(new FormData(e.currentTarget))
    if (result?.error) {
      setError(result.error)
    } else {
      setOpen(false)
      ;(e.target as HTMLFormElement).reset()
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Lightbulb className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Kom med forslag</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Foreslå vedlikeholdsoppgave</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
          )}
          <div className="space-y-2">
            <Label htmlFor="title">Hva bør gjøres? *</Label>
            <Input id="title" name="title" placeholder="f.eks. Fikse gjerde ved innkjørselen" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Mer detaljer</Label>
            <Textarea id="description" name="description" placeholder="Beskriv problemet eller oppgaven nærmere" rows={3} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Avbryt</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Sender…" : "Send forslag"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
