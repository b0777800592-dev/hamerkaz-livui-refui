-- Row Level Security policies

alter table profiles enable row level security;
alter table leads enable row level security;
alter table eligibility_assessments enable row level security;
alter table customers enable row level security;
alter table cases enable row level security;
alter table documents enable row level security;
alter table tasks enable row level security;
alter table messages enable row level security;
alter table partners enable row level security;
alter table partner_referrals enable row level security;
alter table payments enable row level security;
alter table articles enable row level security;
alter table notifications enable row level security;
alter table audit_logs enable row level security;

-- Helper: get current user role
create or replace function get_my_role()
returns user_role as $$
  select role from profiles where id = auth.uid();
$$ language sql security definer stable;

-- Profiles: users see own, staff see all
create policy "profiles_own" on profiles for select using (id = auth.uid());
create policy "profiles_staff" on profiles for select using (
  get_my_role() in ('sales_agent','case_manager','medical_coordinator','admin','super_admin')
);
create policy "profiles_update_own" on profiles for update using (id = auth.uid());

-- Leads: agents/admin see all, customers see none directly
create policy "leads_staff" on leads for all using (
  get_my_role() in ('sales_agent','case_manager','admin','super_admin')
);
create policy "leads_partner" on leads for select using (
  get_my_role() = 'partner' and partner_id in (
    select id from partners where id in (
      select id from partners where referral_code is not null
    )
  )
);

-- Cases: customer sees own, staff sees all
create policy "cases_customer" on cases for select using (
  customer_id in (select id from customers where profile_id = auth.uid())
);
create policy "cases_staff" on cases for all using (
  get_my_role() in ('case_manager','medical_coordinator','admin','super_admin')
);

-- Documents: customer sees own, staff sees all
create policy "documents_customer" on documents for select using (
  customer_id in (select id from customers where profile_id = auth.uid())
);
create policy "documents_customer_insert" on documents for insert with check (
  customer_id in (select id from customers where profile_id = auth.uid())
);
create policy "documents_staff" on documents for all using (
  get_my_role() in ('case_manager','medical_coordinator','admin','super_admin')
);

-- Notifications: own only
create policy "notifications_own" on notifications for all using (user_id = auth.uid());

-- Articles: published visible to all, draft only to admin
create policy "articles_published" on articles for select using (status = 'published');
create policy "articles_admin" on articles for all using (
  get_my_role() in ('admin','super_admin')
);

-- Tasks: assigned user or staff
create policy "tasks_assigned" on tasks for select using (assigned_to = auth.uid());
create policy "tasks_staff" on tasks for all using (
  get_my_role() in ('sales_agent','case_manager','admin','super_admin')
);

-- Messages: staff only
create policy "messages_staff" on messages for all using (
  get_my_role() in ('sales_agent','case_manager','admin','super_admin')
);

-- Audit logs: admin only
create policy "audit_admin" on audit_logs for select using (
  get_my_role() in ('admin','super_admin')
);
