import webpush from "web-push"
import { createServiceClient } from "@/lib/supabase/service"

if (process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? `mailto:${process.env.EMAIL_FROM}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY,
  )
}

export async function sendPushToUsers(
  userIds: string[],
  title: string,
  body: string,
  url: string,
) {
  if (!process.env.VAPID_PRIVATE_KEY || userIds.length === 0) return

  const supabase = createServiceClient()

  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .in("user_id", userIds)

  if (!subscriptions || subscriptions.length === 0) return

  const payload = JSON.stringify({ title, body, url })
  const stale: string[] = []

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        )
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode
        if (status === 410 || status === 404) stale.push(sub.id)
      }
    }),
  )

  if (stale.length > 0) {
    await supabase.from("push_subscriptions").delete().in("id", stale)
  }
}
