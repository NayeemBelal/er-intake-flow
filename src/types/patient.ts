export type PatientStatus =
  | 'waiting_for_forms'
  | 'filling_forms'
  | 'submitted'
  | 'audited'

export interface Patient {
  id: string
  created_at: string
  updated_at: string
  name: string
  dob: string
  phone: string
  reason: string
  id_photo_url: string | null
  insurance_photo_url: string | null
  status: PatientStatus
  forms_to_send: string[]
  form_submission_url: string | null
  form_field_values: Record<string, Record<string, string>> | null
}
