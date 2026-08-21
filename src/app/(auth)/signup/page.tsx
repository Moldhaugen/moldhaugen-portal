"use client"

import { useState } from "react"
import Link from "next/link"
import { signup } from "../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const result = await signup(new FormData(e.currentTarget))
    if (result?.error) setError(result.error)
    else setDone(true)
    setLoading(false)
  }

  if (done) {
    return (
      <Card>
        <CardContent className="pt-8 pb-8 flex flex-col items-center text-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-7 w-7 text-green-600" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Konto opprettet!</h2>
            <p className="text-sm text-muted-foreground">En administrator vil sjekke og slippe deg inn.</p>
            <p className="text-sm text-muted-foreground">Du får en epost når dette er gjort.</p>
          </div>
          <Link href="/login" className="text-sm text-primary hover:underline mt-2">
            Tilbake til innlogging
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Opprett konto</CardTitle>
        <CardDescription>Bli med i Moldhaugen nabolagsportal</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="full_name">Fullt navn</Label>
            <Input id="full_name" name="full_name" type="text" placeholder="Ola Nordmann" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unit_number">Nummer</Label>
            <Input
              id="unit_number"
              name="unit_number"
              type="text"
              placeholder="f.eks. 12A"
              pattern="[0-9]+[A-Za-z]?"
              title="Oppgi et husnummer eller leilighetsnummer, f.eks. 12A"
              required
            />
            <p className="text-xs text-muted-foreground">Husnummer eller leilighetsnummer</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-post</Label>
            <Input id="email" name="email" type="email" placeholder="deg@eksempel.no" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Passord</Label>
            <Input id="password" name="password" type="password" minLength={6} required />
            <p className="text-xs text-muted-foreground">Minst 6 tegn</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Oppretter konto…" : "Opprett konto"}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            Har du allerede konto?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Logg inn
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
