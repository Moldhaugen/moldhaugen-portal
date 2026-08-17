export type Profile = {
  id: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
  unit_number: string | null
  is_approved: boolean
  is_admin: boolean
  email_bulletin_notifications: boolean
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
  created_by: string
  created_at: string
  updated_at: string
  creator?: ProfileSummary
  assignments?: MaintenanceAssignment[]
}

export type MaintenanceAssignment = {
  id: string
  plan_id: string
  user_id: string
  scheduled_date: string | null
  is_completed: boolean
  notes: string | null
  created_at: string
  updated_at: string
  profile?: ProfileSummary
  plan?: Pick<MaintenancePlan, "id" | "title" | "recurrence">
}
