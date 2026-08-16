"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { updateProfile, uploadAvatar } from "@/app/(dashboard)/profile/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Loader2 } from "lucide-react"
import type { Profile } from "@/types"

type Props = { profile: Profile | null; email: string }

export function ProfileForm({ profile, email }: Props) {
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [avatarMsg, setAvatarMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const displayName = profile?.full_name ?? email
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  async function handleProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setProfileMsg(null)
    setProfileLoading(true)
    const result = await updateProfile(new FormData(e.currentTarget))
    setProfileMsg(result.error
      ? { type: "error", text: result.error }
      : { type: "success", text: "Profil oppdatert!" })
    setProfileLoading(false)
  }

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarMsg(null)
    setAvatarLoading(true)
    const fd = new FormData()
    fd.append("avatar", file)
    const result = await uploadAvatar(fd)
    if (result.error) {
      setAvatarMsg({ type: "error", text: result.error })
    } else {
      setAvatarUrl(result.url ?? null)
      setAvatarMsg({ type: "success", text: "Profilbilde oppdatert!" })
    }
    setAvatarLoading(false)
  }

  return (
    <div className="space-y-6">
      {/* Avatar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Profilbilde</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-5">
          <div className="relative">
            <Avatar className="h-20 w-20">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
              <AvatarFallback className="bg-primary text-white text-xl">{initials}</AvatarFallback>
            </Avatar>
            {avatarLoading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                <Loader2 className="h-5 w-5 text-white animate-spin" />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleAvatar}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={avatarLoading}
            >
              <Camera className="h-4 w-4" />
              Velg bilde
            </Button>
            <p className="text-xs text-muted-foreground">PNG, JPG eller WebP. Maks 2 MB.</p>
            {avatarMsg && (
              <p className={`text-xs ${avatarMsg.type === "error" ? "text-destructive" : "text-green-600"}`}>
                {avatarMsg.text}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Profile info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Profilinformasjon</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfile} className="space-y-4">
            {profileMsg && (
              <div className={`rounded-md px-3 py-2 text-sm ${
                profileMsg.type === "error"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-green-50 text-green-700 border border-green-200"
              }`}>
                {profileMsg.text}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="full_name">Fullt navn</Label>
              <Input id="full_name" name="full_name" defaultValue={profile?.full_name ?? ""} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit_number">Nummer</Label>
              <Input
                id="unit_number"
                name="unit_number"
                defaultValue={profile?.unit_number ?? ""}
                placeholder="f.eks. 12A"
              />
            </div>
            <div className="space-y-2">
              <Label>E-post</Label>
              <Input value={email} disabled className="opacity-60" />
              <p className="text-xs text-muted-foreground">E-post kan ikke endres her</p>
            </div>
            <Button type="submit" disabled={profileLoading}>
              {profileLoading ? "Lagrer…" : "Lagre endringer"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
