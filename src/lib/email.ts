import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.EMAIL_FROM ?? "Moldhaugen <noreply@moldhaugen.no>"

export async function sendEmail(to: string | string[], subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) return
  try {
    const toArray = Array.isArray(to) ? to : [to]
    if (toArray.length === 0) return
    if (toArray.length === 1) {
      await resend.emails.send({ from: FROM, to: toArray[0], subject, html })
    } else {
      // batch: send individually to avoid BCC leaking addresses
      await resend.batch.send(
        toArray.map((addr) => ({ from: FROM, to: addr, subject, html }))
      )
    }
  } catch {
    // email is best-effort; never block the action
  }
}

function base(content: string, portalUrl = "") {
  const footerLink = portalUrl
    ? ` · <a href="${portalUrl}" style="color:#a1a1aa">Åpne portalen</a>`
    : ""
  return `<!DOCTYPE html>
<html lang="no">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{font-family:system-ui,-apple-system,sans-serif;background:#f4f4f5;margin:0;padding:24px}
  .card{background:#fff;border-radius:12px;padding:32px;max-width:520px;margin:0 auto;border:1px solid #e4e4e7}
  .logo{font-size:18px;font-weight:700;color:#18181b;margin-bottom:24px}
  h2{font-size:20px;font-weight:600;color:#18181b;margin:0 0 12px}
  p{font-size:15px;color:#52525b;line-height:1.6;margin:0 0 12px}
  .detail{background:#f4f4f5;border-radius:8px;padding:12px 16px;margin:16px 0}
  .detail p{margin:4px 0;font-size:14px}
  .label{color:#71717a;font-size:12px;font-weight:500;text-transform:uppercase;letter-spacing:.05em}
  .btn{display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;margin-top:16px;letter-spacing:.01em}
  .footer{text-align:center;font-size:12px;color:#a1a1aa;margin-top:24px}
</style></head>
<body><div class="card">
<div class="logo">Moldhaugen</div>
${content}
<div class="footer">Moldhaugen Borettslag · Automatisk melding${footerLink}</div>
</div></body></html>`
}

export function assignmentEmail(opts: {
  planTitle: string
  assignerName: string
  scheduledDate: string | null
  notes: string | null
  portalUrl: string
}) {
  const dateStr = opts.scheduledDate
    ? new Date(opts.scheduledDate).toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" })
    : "Ingen dato"

  return base(`
<h2>Du har fått en vedlikeholdsoppgave</h2>
<p>${opts.assignerName} har tildelt deg en oppgave i Moldhaugen-portalen.</p>
<div class="detail">
  <p class="label">Oppgave</p>
  <p><strong>${opts.planTitle}</strong></p>
  <p class="label" style="margin-top:8px">Dato</p>
  <p>${dateStr}</p>
  ${opts.notes ? `<p class="label" style="margin-top:8px">Notater</p><p>${opts.notes}</p>` : ""}
</div>
<a href="${opts.portalUrl}/maintenance" class="btn" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;margin-top:16px;letter-spacing:.01em">Se oppgaven</a>`, opts.portalUrl)
}

export function approvalEmail(opts: { name: string; portalUrl: string }) {
  return base(`
<h2>Kontoen din er godkjent!</h2>
<p>Hei ${opts.name},</p>
<p>Velkommen til Moldhaugen Borettslag! Kontoen din er nå godkjent og du kan logge inn i portalen.</p>
<a href="${opts.portalUrl}/login" class="btn" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;margin-top:16px;letter-spacing:.01em">Logg inn</a>`, opts.portalUrl)
}

export function eventEmail(opts: {
  eventTitle: string
  startTime: string
  endTime: string
  location: string | null
  description: string | null
  isPublic: boolean
  creatorName: string
  portalUrl: string
}) {
  const start = new Date(opts.startTime)
  const end = new Date(opts.endTime)
  const dateStr = start.toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long" })
  const timeStr = `${start.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })}–${end.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })}`

  return base(`
<h2>${opts.isPublic ? "Ny hendelse" : "Du er invitert"}: ${opts.eventTitle}</h2>
<p>${opts.creatorName} ${opts.isPublic ? "har lagt til en hendelse i portalen" : "har invitert deg til en hendelse"}.</p>
<div class="detail">
  <p class="label">Dato og tid</p>
  <p>${dateStr}, ${timeStr}</p>
  ${opts.location ? `<p class="label" style="margin-top:8px">Sted</p><p>${opts.location}</p>` : ""}
  ${opts.description ? `<p class="label" style="margin-top:8px">Beskrivelse</p><p>${opts.description}</p>` : ""}
</div>
<a href="${opts.portalUrl}/calendar" class="btn" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;margin-top:16px;letter-spacing:.01em">Se i kalender</a>`, opts.portalUrl)
}

export function reminderEmail(opts: {
  planTitle: string
  scheduledDate: string
  scheduledTime: string | null
  isToday: boolean
  portalUrl: string
}) {
  const dateStr = new Date(opts.scheduledDate + "T12:00:00Z").toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long" })
  const timeStr = opts.scheduledTime ? opts.scheduledTime.substring(0, 5) : null

  return base(`
<h2>${opts.isToday ? "Oppgave forfaller i dag" : "Påminnelse: Oppgave forfaller i morgen"}</h2>
<p>Du har en vedlikeholdsoppgave som forfaller ${opts.isToday ? "i dag" : "i morgen"}.</p>
<div class="detail">
  <p class="label">Oppgave</p>
  <p><strong>${opts.planTitle}</strong></p>
  <p class="label" style="margin-top:8px">Dato</p>
  <p>${dateStr}${timeStr ? ` kl. ${timeStr}` : ""}</p>
</div>
<a href="${opts.portalUrl}/maintenance" class="btn" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;margin-top:16px;letter-spacing:.01em">Se oppgaven</a>`, opts.portalUrl)
}

export function bulletinPostEmail(opts: { postTitle: string; authorName: string; portalUrl: string }) {
  return base(`
<h2>Nytt innlegg på oppslagstavlen</h2>
<p>${opts.authorName} har lagt ut et nytt innlegg.</p>
<div class="detail">
  <p class="label">Innlegg</p>
  <p><strong>${opts.postTitle}</strong></p>
</div>
<a href="${opts.portalUrl}/oppslagstavle" class="btn" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;margin-top:16px;letter-spacing:.01em">Se innlegget</a>
<p style="margin-top:20px;font-size:12px;color:#a1a1aa">Du kan skru av disse varslene under <a href="${opts.portalUrl}/profile" style="color:#71717a">Min profil</a>.</p>`, opts.portalUrl)
}

export function newSignupEmail(opts: { name: string; email: string; unitNumber: string; portalUrl: string }) {
  return base(`
<h2>Ny bruker venter på godkjenning</h2>
<p>En ny bruker har registrert seg og venter på at du godkjenner kontoen.</p>
<div class="detail">
  <p class="label">Navn</p>
  <p><strong>${opts.name}</strong></p>
  <p class="label" style="margin-top:8px">E-post</p>
  <p>${opts.email}</p>
  ${opts.unitNumber ? `<p class="label" style="margin-top:8px">Leilighet</p><p>${opts.unitNumber}</p>` : ""}
</div>
<a href="${opts.portalUrl}/admin" class="btn" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;margin-top:16px;letter-spacing:.01em">Gå til administrasjon</a>`, opts.portalUrl)
}

export function announcementEmail(opts: { subject: string; body: string; senderName: string; portalUrl: string }) {
  return base(`
<h2>${opts.subject}</h2>
<p style="white-space:pre-wrap">${opts.body}</p>
<p style="margin-top:20px;font-size:13px;color:#71717a">Sendt av ${opts.senderName} via Moldhaugen-portalen</p>
<a href="${opts.portalUrl}" class="btn" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;margin-top:16px;letter-spacing:.01em">Åpne portalen</a>`, opts.portalUrl)
}
