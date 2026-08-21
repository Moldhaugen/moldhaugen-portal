export type Profile = {
  id: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
  unit_number: string | null
  is_approved: boolean
  is_admin: boolean
  email_bulletin_notifications: boolean
  email_event_notifications: boolean
  email_maintenance_notifications: boolean
  email_announcement_notifications: boolean
  push_notifications_enabled: boolean
  phone_number: string | null
  created_at: string
  updated_at: string
}

export type ProfileSummary = Pick<Profile, "id" | "full_name" | "email" | "unit_number">

export type Event = {
  id: string
  title: string
  description: string | null
  location: string | null
  start_time: string
  end_time: string
  is_public: boolean
  created_by: string
  created_at: string
  updated_at: string
  creator?: ProfileSummary
  invitations?: EventInvitation[]
}

export type EventInvitation = {
  id: string
  event_id: string
  user_id: string
  status: "pending" | "accepted" | "declined"
  created_at: string
  profile?: ProfileSummary
}

export type MaintenancePlan = {
  id: string
  title: string
  description: string | null
  recurrence: "weekly" | "biweekly" | "monthly" | "custom" | "once"
  is_completed: boolean
  start_date: string | null
  end_date: string | null
  created_by: string
  created_at: string
  updated_at: string
  creator?: ProfileSummary
  assignments?: MaintenanceAssignment[]
}

export type Tool = {
  id: string
  user_id: string
  name: string
  description: string | null
  available: boolean
  created_at: string
  updated_at: string
  profile?: Pick<Profile, "id" | "full_name" | "unit_number" | "phone_number" | "email">
}

export type MaintenanceAssignment = {
  id: string
  plan_id: string
  user_id: string | null
  scheduled_date: string | null
  scheduled_time: string | null
  is_completed: boolean
  notes: string | null
  created_at: string
  updated_at: string
  profile?: ProfileSummary
  plan?: Pick<MaintenancePlan, "id" | "title" | "recurrence">
}
