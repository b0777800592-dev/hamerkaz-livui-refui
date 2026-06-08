-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Enums
create type user_role as enum (
  'visitor','lead','customer','sales_agent','case_manager',
  'medical_coordinator','partner','admin','super_admin'
);
create type lead_status as enum (
  'new','contacted','no_answer','qualified','not_qualified',
  'docs_requested','converted_to_case','closed_lost'
);
create type case_status as enum (
  'open','documents_requested','documents_received','in_review',
  'waiting_external_partner','referred','completed','not_suitable',
  'rejected','renewal_follow_up'
);
create type document_status as enum ('pending','approved','missing_info','rejected','needs_review');
create type service_type as enum ('new_license','renewal','dosage_increase','documents_review');
create type complexity_level as enum ('low','medium','high');
create type priority_level as enum ('low','medium','high','urgent');
create type message_channel as enum ('whatsapp','email','sms','internal');
create type message_direction as enum ('inbound','outbound');
create type partner_type as enum ('doctor','clinic','association','marketer','website','other');
create type commission_type as enum ('fixed','percentage','none');
create type task_status as enum ('open','in_progress','done','cancelled','overdue');
create type article_type as enum ('service','condition','question','guide','blog');
create type article_status as enum ('draft','published','archived');

-- Profiles (extends auth.users)
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null,
  phone text,
  email text,
  role user_role not null default 'customer',
  status text not null default 'active',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Partners
create table partners (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type partner_type not null default 'other',
  contact_name text,
  phone text,
  email text,
  referral_code text unique not null,
  commission_type commission_type not null default 'none',
  commission_value numeric not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

-- Leads
create table leads (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  phone text not null,
  email text,
  source text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  requested_service service_type,
  medical_condition text,
  eligibility_score int,
  status lead_status not null default 'new',
  assigned_to uuid references profiles(id),
  partner_id uuid references partners(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Eligibility assessments
create table eligibility_assessments (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references leads(id) on delete cascade,
  customer_id uuid references profiles(id),
  answers jsonb not null default '{}',
  condition text,
  duration text,
  treatments_tried jsonb default '[]',
  documents_available jsonb default '[]',
  previous_license boolean default false,
  requested_action service_type,
  score int not null default 0,
  complexity complexity_level not null default 'low',
  recommendation text,
  missing_documents jsonb default '[]',
  pdf_url text,
  created_at timestamptz not null default now()
);

-- Customers
create table customers (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade,
  lead_id uuid references leads(id),
  date_of_birth date,
  id_number text,
  address text,
  emergency_contact text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

-- Cases
create table cases (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid references customers(id) on delete cascade,
  lead_id uuid references leads(id),
  service_type service_type not null,
  status case_status not null default 'open',
  priority priority_level not null default 'medium',
  current_stage text,
  assigned_manager uuid references profiles(id),
  medical_coordinator uuid references profiles(id),
  partner_id uuid references partners(id),
  renewal_date date,
  expiration_date date,
  ai_case_summary text,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Documents
create table documents (
  id uuid primary key default uuid_generate_v4(),
  case_id uuid references cases(id) on delete cascade,
  customer_id uuid references customers(id),
  uploaded_by uuid references profiles(id),
  document_type text not null,
  file_name text not null,
  file_url text not null,
  mime_type text,
  file_size int,
  status document_status not null default 'pending',
  ai_summary text,
  ai_extracted_data jsonb,
  created_at timestamptz not null default now()
);

-- Tasks
create table tasks (
  id uuid primary key default uuid_generate_v4(),
  case_id uuid references cases(id),
  lead_id uuid references leads(id),
  assigned_to uuid references profiles(id),
  title text not null,
  description text,
  due_date timestamptz,
  priority priority_level not null default 'medium',
  status task_status not null default 'open',
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- Messages
create table messages (
  id uuid primary key default uuid_generate_v4(),
  case_id uuid references cases(id),
  lead_id uuid references leads(id),
  channel message_channel not null,
  direction message_direction not null,
  sender_id uuid references profiles(id),
  recipient_phone text,
  content text not null,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

-- Partner referrals
create table partner_referrals (
  id uuid primary key default uuid_generate_v4(),
  partner_id uuid references partners(id),
  lead_id uuid references leads(id),
  status text not null default 'new',
  commission_amount numeric,
  commission_status text not null default 'pending',
  created_at timestamptz not null default now()
);

-- Payments
create table payments (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid references customers(id),
  case_id uuid references cases(id),
  amount numeric not null,
  currency text not null default 'ILS',
  status text not null default 'pending',
  payment_method text,
  invoice_url text,
  created_at timestamptz not null default now()
);

-- Articles (SEO)
create table articles (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  slug text unique not null,
  type article_type not null default 'blog',
  category text,
  condition text,
  meta_title text,
  meta_description text,
  content_md text,
  faq jsonb default '[]',
  schema_json jsonb,
  status article_status not null default 'draft',
  published_at timestamptz,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- Notifications
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  title text not null,
  body text,
  type text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- Audit logs
create table audit_logs (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid references profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before jsonb,
  after jsonb,
  ip text,
  created_at timestamptz not null default now()
);

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger profiles_updated_at before update on profiles for each row execute function update_updated_at();
create trigger leads_updated_at before update on leads for each row execute function update_updated_at();
create trigger cases_updated_at before update on cases for each row execute function update_updated_at();

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    'customer'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
