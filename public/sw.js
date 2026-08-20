self.addEventListener("fetch", () => {})

self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    (async () => {
      await self.registration.showNotification(data.title ?? "Moldhaugen", {
        body: data.body ?? "",
        icon: "/icon.png",
        badge: "/icon.png",
        data: { url: data.url ?? "/" },
      })
      const all = await self.registration.getNotifications()
      if ("setAppBadge" in navigator) navigator.setAppBadge(all.length)
    })()
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  event.waitUntil(
    (async () => {
      const all = await self.registration.getNotifications()
      if (all.length === 0 && "clearAppBadge" in navigator) navigator.clearAppBadge()
      const url = event.notification.data.url
      const clientList = await clients.matchAll({ type: "window", includeUncontrolled: true })
      for (const client of clientList) {
        if (client.url === url && "focus" in client) return client.focus()
      }
      return clients.openWindow(url)
    })()
  )
})

self.addEventListener("notificationclose", (event) => {
  event.waitUntil(
    (async () => {
      const all = await self.registration.getNotifications()
      if (all.length === 0 && "clearAppBadge" in navigator) navigator.clearAppBadge()
    })()
  )
})
