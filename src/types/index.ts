export type UserRole =
  | 'visitor'
  | 'lead'
  | 'customer'
  | 'sales_agent'
  | 'case_manager'
  | 'medical_coordinator'
  | 'partner'
  | 'admin'
  | 'super_admin'

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'no_answer'
  | 'qualified'
  | 'not_qualified'
  | 'docs_requested'
  | 'converted_to_case'
  | 'closed_lost'

export type CaseStatus =
  | 'open'
  | 'documents_requested'
  | 'documents_received'
  | 'in_review'
  | 'waiting_external_partner'
  | 'referred'
  | 'completed'
  | 'not_suitable'
  | 'rejected'
  | 'renewal_follow_up'

export type DocumentStatus = 'pending' | 'approved' | 'missing_info' | 'rejected' | 'needs_review'

export type ServiceType =
  | 'new_license'
  | 'renewal'
  | 'dosage_increase'
  | 'documents_review'

export type ComplexityLevel = 'low' | 'medium' | 'high'

export interface Profile {
  id: string
  full_name: string
  phone: string
  email: string
  role: UserRole
  status: 'active' | 'inactive'
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Lead {
  id: string
  full_name: string
  phone: string
  email?: string
  source?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  requested_service?: ServiceType
  medical_condition?: string
  eligibility_score?: number
  status: LeadStatus
  assigned_to?: string
  partner_id?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface EligibilityAssessment {
  id: string
  lead_id: string
  customer_id?: string
  answers: Record<string, unknown>
  condition: string
  duration: string
  treatments_tried: string[]
  documents_available: string[]
  previous_license: boolean
  requested_action: ServiceType
  score: number
  complexity: ComplexityLevel
  recommendation: string
  missing_documents: string[]
  pdf_url?: string
  created_at: string
}

export interface Case {
  id: string
  customer_id: string
  lead_id: string
  service_type: ServiceType
  status: CaseStatus
  priority: 'low' | 'medium' | 'high' | 'urgent'
  current_stage: string
  assigned_manager?: string
  medical_coordinator?: string
  partner_id?: string
  renewal_date?: string
  expiration_date?: string
  ai_case_summary?: string
  internal_notes?: string
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  case_id: string
  customer_id: string
  uploaded_by: string
  document_type: string
  file_name: string
  file_url: string
  mime_type: string
  file_size: number
  status: DocumentStatus
  ai_summary?: string
  ai_extracted_data?: Record<string, unknown>
  created_at: string
}

export interface Task {
  id: string
  case_id?: string
  lead_id?: string
  assigned_to: string
  title: string
  description?: string
  due_date?: string
  priority: 'low' | 'medium' | 'high'
  status: 'open' | 'in_progress' | 'done' | 'cancelled' | 'overdue'
  created_by: string
  created_at: string
}

export interface Partner {
  id: string
  name: string
  type: 'doctor' | 'clinic' | 'association' | 'marketer' | 'website' | 'other'
  contact_name: string
  phone: string
  email: string
  referral_code: string
  commission_type: 'fixed' | 'percentage' | 'none'
  commission_value: number
  status: 'active' | 'inactive'
  created_at: string
}

export interface EligibilityFormData {
  full_name: string
  phone: string
  age?: number
  city?: string
  preferred_contact: 'whatsapp' | 'phone' | 'email'
  purpose: ServiceType
  medical_condition: string
  condition_duration: 'less_than_1_year' | '1_3_years' | '3_5_years' | 'more_than_5_years'
  treatments_tried: string[]
  documents_available: string[]
  previous_license: boolean
  expiry_date?: string
  current_dosage?: string
  complexity_flags: string[]
  agree_terms: boolean
}
