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

function base(content: string) {
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
  .btn{display:inline-block;background:#18181b;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:500;margin-top:16px}
  .footer{text-align:center;font-size:12px;color:#a1a1aa;margin-top:24px}
</style></head>
<body><div class="card">
<div class="logo">Moldhaugen</div>
${content}
<div class="footer">Moldhaugen Borettslag · Automatisk melding</div>
</div></body></html>`
}

export function assignmentEmail(opts: {
  planTitle: string
  assignerName: string
  scheduledDate: string | null
  notes: string | null
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
<p>Logg inn i portalen for å se alle oppgaver.</p>`)
}

export function approvalEmail(opts: { name: string; portalUrl: string }) {
  return base(`
<h2>Kontoen din er godkjent!</h2>
<p>Hei ${opts.name},</p>
<p>Velkommen til Moldhaugen Borettslag! Kontoen din er nå godkjent og du kan logge inn i portalen.</p>
<a href="${opts.portalUrl}/login" class="btn">Logg inn</a>`)
}

export function eventEmail(opts: {
  eventTitle: string
  startTime: string
  endTime: string
  location: string | null
  description: string | null
  isPublic: boolean
  creatorName: string
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
</div>`)
}

export function announcementEmail(opts: { subject: string; body: string; senderName: string }) {
  return base(`
<h2>${opts.subject}</h2>
<p style="white-space:pre-wrap">${opts.body}</p>
<p style="margin-top:20px;font-size:13px;color:#71717a">Sendt av ${opts.senderName} via Moldhaugen-portalen</p>`)
}
