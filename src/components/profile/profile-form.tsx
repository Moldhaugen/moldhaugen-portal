"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { updateProfile, uploadAvatar, changePassword } from "@/app/(dashboard)/profile/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Loader2, KeyRound } from "lucide-react"
import { PushSubscribeButton } from "@/components/push/push-subscribe-button"
import type { Profile } from "@/types"

type Props = { profile: Profile | null; email: string }

export function ProfileForm({ profile, email }: Props) {
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [avatarMsg, setAvatarMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const passwordFormRef = useRef<HTMLFormElement>(null)
  const currentEmail = profile?.email ?? email

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
    if (result.error) {
      setProfileMsg({ type: "error", text: result.error })
    } else if (result.emailConfirmationPending) {
      setProfileMsg({ type: "success", text: "Profil oppdatert! En bekreftelseslenke er sendt til den nye e-postadressen." })
    } else {
      setProfileMsg({ type: "success", text: "Profil oppdatert!" })
    }
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

  async function handlePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPasswordMsg(null)
    const fd = new FormData(e.currentTarget)
    if (fd.get("new_password") !== fd.get("confirm_password")) {
      setPasswordMsg({ type: "error", text: "Passordene stemmer ikke overens" })
      return
    }
    setPasswordLoading(true)
    const result = await changePassword(fd)
    if (result.error) {
      setPasswordMsg({ type: "error", text: result.error })
    } else {
      setPasswordMsg({ type: "success", text: "Passord oppdatert!" })
      passwordFormRef.current?.reset()
    }
    setPasswordLoading(false)
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
              <Label htmlFor="unit_number">Telefon</Label>
              <Input
                id="phone_number"
                name="phone_number"
                type="tel"
                defaultValue={profile?.phone_number ?? ""}
                placeholder="f.eks. 90 12 34 56"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-post</Label>
              <Input id="email" name="email" type="email" defaultValue={currentEmail} />
              <p className="text-xs text-muted-foreground">En bekreftelseslenke sendes til ny adresse</p>
            </div>
            <div className="space-y-3">
              <Label>E-postvarsler</Label>
              {[
                { name: "email_bulletin_notifications",     checked: profile?.email_bulletin_notifications     ?? true, label: "Oppslagstavle",   desc: "Nye innlegg" },
                { name: "email_event_notifications",        checked: profile?.email_event_notifications        ?? true, label: "Kalender",         desc: "Nye hendelser og invitasjoner" },
                { name: "email_maintenance_notifications",  checked: profile?.email_maintenance_notifications  ?? true, label: "Vedlikehold",      desc: "Når du tildeles en oppgave" },
                { name: "email_announcement_notifications", checked: profile?.email_announcement_notifications ?? true, label: "Kunngjøringer",    desc: "Meldinger fra administrator" },
                { name: "email_tool_notifications",         checked: profile?.email_tool_notifications         ?? true, label: "Verktøy",           desc: "Låneforespørsler og svar" },
              ].map(({ name, checked, label, desc }) => (
                <label key={name} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name={name}
                    defaultChecked={checked}
                    className="h-4 w-4 rounded border-input accent-primary"
                  />
                  <div>
                    <p className="text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </label>
              ))}
            </div>
            <div className="space-y-3">
              <Label>Push-varsler</Label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="push_notifications_enabled"
                  defaultChecked={profile?.push_notifications_enabled ?? true}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                <div>
                  <p className="text-sm">Aktiver push-varsler</p>
                  <p className="text-xs text-muted-foreground">Varsler for nye innlegg, hendelser, oppgaver og kunngjøringer</p>
                </div>
              </label>
            </div>
            <Button type="submit" disabled={profileLoading}>
              {profileLoading ? "Lagrer…" : "Lagre endringer"}
            </Button>
          </form>

          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm font-medium mb-2">Denne enheten</p>
            <PushSubscribeButton />
          </div>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-muted-foreground" />
            Endre passord
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form ref={passwordFormRef} onSubmit={handlePassword} className="space-y-4">
            {passwordMsg && (
              <div className={`rounded-md px-3 py-2 text-sm ${
                passwordMsg.type === "error"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-green-50 text-green-700 border border-green-200"
              }`}>
                {passwordMsg.text}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="current_password">Nåværende passord</Label>
              <Input id="current_password" name="current_password" type="password" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_password">Nytt passord</Label>
              <Input id="new_password" name="new_password" type="password" minLength={6} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm_password">Bekreft nytt passord</Label>
              <Input id="confirm_password" name="confirm_password" type="password" minLength={6} required />
            </div>
            <Button type="submit" disabled={passwordLoading}>
              {passwordLoading ? "Oppdaterer…" : "Oppdater passord"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
