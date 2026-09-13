create table if not exists public.anonymous_assessments (
  response_id uuid primary key,
  submitted_at timestamptz not null default now(),
  consent_version text not null,
  model_version text not null,
  features jsonb not null,
  indication_level text,
  model_score numeric,
  created_at timestamptz not null default now()
);

create index if not exists anonymous_assessments_submitted_at_idx
  on public.anonymous_assessments (submitted_at);

create index if not exists anonymous_assessments_indication_level_idx
  on public.anonymous_assessments (indication_level);

alter table public.anonymous_assessments enable row level security;

revoke all on table public.anonymous_assessments from anon, authenticated;
grant insert on table public.anonymous_assessments to service_role;
