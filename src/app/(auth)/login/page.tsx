"use client"

import { useState } from "react"
import Link from "next/link"
import { login } from "../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const result = await login(new FormData(e.currentTarget))
    if (result?.error) setError(result.error)
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logg inn</CardTitle>
        <CardDescription>Skriv inn e-post og passord for å få tilgang</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">E-post</Label>
            <Input id="email" name="email" type="email" placeholder="deg@eksempel.no" required />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Passord</Label>
              <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                Glemt passord?
              </Link>
            </div>
            <Input id="password" name="password" type="password" required />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Logger inn…" : "Logg inn"}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            Har du ikke konto?{" "}
            <Link href="/signup" className="text-primary hover:underline">
              Opprett konto
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
