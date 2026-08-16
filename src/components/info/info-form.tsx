"use client"

import { useState } from "react"
import { addInfoEntry } from "@/app/(dashboard)/info/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Plus } from "lucide-react"

const CATEGORIES = ["Tjenester", "Kontakter", "Nødhjelp", "Annet"]

export function InfoForm() {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState("Tjenester")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    fd.set("category", category)
    const result = await addInfoEntry(fd)
    if (result?.error) {
      setError(result.error)
    } else {
      setOpen(false)
      setCategory("Tjenester")
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4" /><span className="hidden sm:inline">Legg til</span></Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Legg til nyttig info</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
          )}
          <div className="space-y-2">
            <Label htmlFor="title">Tittel *</Label>
            <Input id="title" name="title" placeholder="f.eks. Snømåking AS" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone_number">Telefonnummer</Label>
            <Input id="phone_number" name="phone_number" type="tel" placeholder="f.eks. 815 00 555" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Beskrivelse</Label>
            <Textarea id="description" name="description" placeholder="Kort beskrivelse" rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Kategori</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Avbryt</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Lagrer…" : "Legg til"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
