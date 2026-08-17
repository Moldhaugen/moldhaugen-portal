"use client"

import { useEffect, useState } from "react"
import { Bell, BellOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(b64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

type State = "unsupported" | "loading" | "denied" | "subscribed" | "unsubscribed"

export function PushSubscribeButton() {
  const [state, setState] = useState<State>("loading")
  const [reg, setReg] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported")
      return
    }
    navigator.serviceWorker.register("/sw.js").then(async (r) => {
      setReg(r)
      const existing = await r.pushManager.getSubscription()
      if (existing) {
        setState("subscribed")
      } else if (Notification.permission === "denied") {
        setState("denied")
      } else {
        setState("unsubscribed")
      }
    }).catch(() => setState("unsupported"))
  }, [])

  async function subscribe() {
    if (!reg) return
    setState("loading")
    try {
      const permission = await Notification.requestPermission()
      if (permission !== "granted") { setState("denied"); return }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      })

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      })
      setState("subscribed")
    } catch {
      setState("unsubscribed")
    }
  }

  async function unsubscribe() {
    if (!reg) return
    setState("loading")
    try {
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setState("unsubscribed")
    } catch {
      setState("subscribed")
    }
  }

  if (state === "unsupported") return null

  return (
    <div className="space-y-1">
      {state === "subscribed" ? (
        <Button type="button" variant="outline" size="sm" onClick={unsubscribe}>
          <BellOff className="h-4 w-4" />
          Deaktiver push på denne enheten
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={subscribe}
          disabled={state === "loading" || state === "denied"}
        >
          {state === "loading"
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Bell className="h-4 w-4" />}
          {state === "denied" ? "Varsler blokkert i nettleser" : "Aktiver push på denne enheten"}
        </Button>
      )}
      {state === "denied" && (
        <p className="text-xs text-muted-foreground">Tillat varsler i nettleserinnstillingene for å aktivere.</p>
      )}
    </div>
  )
}
