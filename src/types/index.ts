export type Profile = {
  id: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type ProfileSummary = Pick<Profile, "id" | "full_name" | "email">

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
  creator?: Profile
  invitations?: EventInvitation[]
}

export type EventInvitation = {
  id: string
  event_id: string
  user_id: string
  status: "pending" | "accepted" | "declined"
  created_at: string
  profile?: Profile
}

export type MaintenancePlan = {
  id: string
  title: string
  description: string | null
  recurrence: "weekly" | "biweekly" | "monthly" | "custom"
  created_by: string
  created_at: string
  updated_at: string
  creator?: Profile
  assignments?: MaintenanceAssignment[]
}

export type MaintenanceAssignment = {
  id: string
  plan_id: string
  user_id: string
  scheduled_date: string
  is_completed: boolean
  notes: string | null
  created_at: string
  updated_at: string
  profile?: Profile
}
