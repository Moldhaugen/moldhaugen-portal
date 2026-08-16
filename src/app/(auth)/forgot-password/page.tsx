"use client"

import { useState } from "react"
import Link from "next/link"
import { forgotPassword } from "../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    fd.set("origin", window.location.origin)
    const result = await forgotPassword(fd)
    if (result?.error) setError(result.error)
    if (result?.success) setSuccess(result.success)
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Glemt passord</CardTitle>
        <CardDescription>Skriv inn e-postadressen din, så sender vi en tilbakestillingslenke</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 border border-green-200">
              {success}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">E-post</Label>
            <Input id="email" name="email" type="email" placeholder="deg@eksempel.no" required />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading || !!success}>
            {loading ? "Sender…" : "Send tilbakestillingslenke"}
          </Button>
          <Link href="/login" className="text-sm text-primary hover:underline text-center">
            Tilbake til innlogging
          </Link>
        </CardFooter>
      </form>
    </Card>
  )
}
