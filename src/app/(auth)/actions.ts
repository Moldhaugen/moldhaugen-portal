"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { sendEmail, newSignupEmail } from "@/lib/email"

export async function login(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: "Feil e-post eller passord." }

  redirect("/calendar")
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const fullName = formData.get("full_name") as string
  const unitNumber = formData.get("unit_number") as string

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, unit_number: unitNumber },
    },
  })
  if (error) return { error: error.message }

  const adminEmail = process.env.ADMIN_EMAIL
  if (adminEmail) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ""
    await sendEmail(
      adminEmail,
      "Ny bruker venter på godkjenning",
      newSignupEmail({ name: fullName, email, unitNumber, portalUrl: siteUrl })
    )
  }

  return { success: "Sjekk e-posten din for å bekrefte kontoen." }
}

export async function forgotPassword(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get("email") as string
  const origin = formData.get("origin") as string

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/api/auth/callback?next=/reset-password`,
  })
  if (error) return { error: error.message }

  return { success: "Tilbakestillingslenke er sendt til e-posten din." }
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()
  const password = formData.get("password") as string

  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: error.message }

  redirect("/calendar")
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
