create extension if not exists "pgcrypto";

create type public.user_role as enum ('conductor', 'admin', 'authority');
create type public.camera_status as enum ('online', 'offline', 'connecting', 'testing');
create type public.defect_type as enum ('pothole', 'crack', 'damage', 'depression', 'marking');
create type public.severity_level as enum ('critical', 'moderate', 'low', 'resolved');
create type public.complaint_status as enum ('detected', 'verified', 'authority_identified', 'sent', 'acknowledged', 'pending', 'resolved');
create type public.evidence_status as enum ('buffering', 'tracking', 'cropping', 'privacy', 'uploading', 'stored', 'failed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role public.user_role not null default 'conductor',
  authority text,
  division text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vehicles (
  id text primary key,
  type text not null,
  route text not null,
  created_at timestamptz not null default now()
);

create table public.cameras (
  id text primary key,
  vehicle_id text not null references public.vehicles(id) on delete restrict,
  position text not null check (position in ('front', 'rear', 'left', 'right')),
  route text not null,
  status public.camera_status not null default 'offline',
  fps numeric not null default 0 check (fps >= 0),
  last_active timestamptz,
  installed_at date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.incidents (
  id text primary key,
  type public.defect_type not null,
  confidence numeric not null check (confidence >= 0 and confidence <= 1),
  severity public.severity_level not null,
  status public.complaint_status not null default 'detected',
  latitude numeric not null,
  longitude numeric not null,
  road text not null,
  city text not null,
  state text not null,
  landmark text,
  km_marker text,
  camera_id text not null references public.cameras(id) on delete restrict,
  vehicle_id text not null references public.vehicles(id) on delete restrict,
  detected_at timestamptz not null default now(),
  approx_size_cm numeric,
  authority text,
  division text,
  pipeline jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.detections (
  id text primary key,
  incident_id text not null references public.incidents(id) on delete cascade,
  camera_id text not null references public.cameras(id) on delete restrict,
  vehicle_id text not null references public.vehicles(id) on delete restrict,
  type public.defect_type not null,
  confidence numeric not null check (confidence >= 0 and confidence <= 1),
  severity public.severity_level not null,
  bbox jsonb not null,
  detected_at timestamptz not null default now(),
  fps numeric,
  approx_size_cm numeric,
  created_at timestamptz not null default now()
);

create table public.complaints (
  id text primary key,
  incident_id text not null unique references public.incidents(id) on delete cascade,
  authority text not null,
  division text not null,
  status public.complaint_status not null default 'detected',
  resolution_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.complaint_events (
  id bigint generated always as identity primary key,
  complaint_id text not null references public.complaints(id) on delete cascade,
  status public.complaint_status not null,
  note text not null default '',
  created_at timestamptz not null default now()
);

create table public.evidence (
  id text primary key,
  incident_id text not null references public.incidents(id) on delete cascade,
  detection_id text references public.detections(id) on delete set null,
  camera_id text not null references public.cameras(id) on delete restrict,
  vehicle_id text not null references public.vehicles(id) on delete restrict,
  complaint_id text references public.complaints(id) on delete set null,
  storage_path text,
  type public.defect_type not null,
  confidence numeric not null check (confidence >= 0 and confidence <= 1),
  severity public.severity_level not null,
  bbox jsonb not null,
  captured_at timestamptz not null default now(),
  duration_sec numeric not null default 0,
  size_kb numeric not null default 0,
  frames_used integer not null default 0,
  buffer_window_sec numeric not null default 0,
  privacy_applied boolean not null default false,
  stored boolean not null default false,
  status public.evidence_status not null default 'buffering',
  failure_reason text,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index incidents_detected_at_idx on public.incidents (detected_at desc);
create index incidents_authority_division_idx on public.incidents (authority, division);
create index detections_incident_id_idx on public.detections (incident_id);
create index complaints_status_idx on public.complaints (status);
create index evidence_incident_id_idx on public.evidence (incident_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger cameras_updated_at before update on public.cameras
for each row execute function public.set_updated_at();
create trigger incidents_updated_at before update on public.incidents
for each row execute function public.set_updated_at();
create trigger complaints_updated_at before update on public.complaints
for each row execute function public.set_updated_at();
create trigger evidence_updated_at before update on public.evidence
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.cameras enable row level security;
alter table public.incidents enable row level security;
alter table public.detections enable row level security;
alter table public.complaints enable row level security;
alter table public.complaint_events enable row level security;
alter table public.evidence enable row level security;

create policy "users can read their profile"
on public.profiles for select to authenticated using (auth.uid() = id);
create policy "users can update their profile"
on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "users can insert their profile"
on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "authenticated users can read vehicles"
on public.vehicles for select to authenticated using (true);
create policy "authenticated users can manage vehicles"
on public.vehicles for all to authenticated using (true) with check (true);
create policy "authenticated users can read cameras"
on public.cameras for select to authenticated using (true);
create policy "authenticated users can manage cameras"
on public.cameras for all to authenticated using (true) with check (true);
create policy "authenticated users can read incidents"
on public.incidents for select to authenticated using (true);
create policy "authenticated users can create incidents"
on public.incidents for insert to authenticated with check (true);
create policy "authenticated users can update incidents"
on public.incidents for update to authenticated using (true) with check (true);
create policy "authenticated users can read detections"
on public.detections for select to authenticated using (true);
create policy "authenticated users can create detections"
on public.detections for insert to authenticated with check (true);
create policy "authenticated users can read complaints"
on public.complaints for select to authenticated using (true);
create policy "authenticated users can manage complaints"
on public.complaints for all to authenticated using (true) with check (true);
create policy "authenticated users can read complaint events"
on public.complaint_events for select to authenticated using (true);
create policy "authenticated users can create complaint events"
on public.complaint_events for insert to authenticated with check (true);
create policy "authenticated users can read evidence"
on public.evidence for select to authenticated using (true);
create policy "authenticated users can manage evidence"
on public.evidence for all to authenticated using (true) with check (true);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

INSERT INTO public.vehicles (id, type, route)
VALUES
  ('BUS-204', 'Bus', 'NH-27'),
  ('BUS-118', 'Bus', 'MG Road'),
  ('BUS-332', 'Bus', 'Airport Road'),
  ('BUS-441', 'Bus', 'AB Road')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.cameras (id, vehicle_id, position, route, status, fps, last_active, installed_at)
VALUES
  ('CAM-01', 'BUS-204', 'front', 'NH-27', 'online', 24, now(), current_date),
  ('CAM-02', 'BUS-118', 'front', 'MG Road', 'online', 22, now(), current_date),
  ('CAM-05', 'BUS-332', 'front', 'Airport Road', 'online', 23, now(), current_date),
  ('CAM-06', 'BUS-441', 'front', 'AB Road', 'online', 25, now(), current_date)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.incidents (
  id, type, confidence, severity, status, latitude, longitude, road, city, state,
  landmark, km_marker, camera_id, vehicle_id, detected_at, approx_size_cm,
  authority, division, pipeline, notes
)
VALUES
  (
    'RV-1024', 'pothole', 0.96, 'critical', 'detected',
    22.7532, 75.8937, 'NH-27', 'Indore', 'Madhya Pradesh',
    'Super Corridor', '14.2', 'CAM-01', 'BUS-204',
    now() - interval '2 minutes', 48,
    'Public Works Department', 'Indore Division 4',
    '{"detection":true,"privacy":true,"duplicate":true,"location":true,"authority":true,"complaint":true,"resolution":false}',
    'Large pothole near the corridor.'
  ),
  (
    'RV-1025', 'crack', 0.88, 'moderate', 'verified',
    22.7196, 75.8577, 'MG Road', 'Indore', 'Madhya Pradesh',
    'Palasia Square', null, 'CAM-02', 'BUS-118',
    now() - interval '18 minutes', 210,
    'Indore Municipal Corporation', 'Zone 8 — Palasia',
    '{"detection":true,"privacy":true,"duplicate":true,"location":true,"authority":true,"complaint":true,"resolution":false}',
    'Road crack identified near the square.'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.detections (
  id, incident_id, camera_id, vehicle_id, type, confidence, severity, bbox, detected_at, fps, approx_size_cm
)
VALUES
  ('DET-2041', 'RV-1024', 'CAM-01', 'BUS-204', 'pothole', 0.96, 'critical',
   '{"x":0.42,"y":0.58,"w":0.22,"h":0.16}', now() - interval '2 minutes', 24, 48),
  ('DET-2050', 'RV-1025', 'CAM-02', 'BUS-118', 'crack', 0.88, 'moderate',
   '{"x":0.30,"y":0.62,"w":0.38,"h":0.10}', now() - interval '18 minutes', 22, 210)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.complaints (
  id, incident_id, authority, division, status, resolution_note
)
VALUES
  ('CMP-1001', 'RV-1024', 'Public Works Department', 'Indore Division 4', 'acknowledged', null),
  ('CMP-1002', 'RV-1025', 'Indore Municipal Corporation', 'Zone 8 — Palasia', 'sent', null)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.complaint_events (complaint_id, status, note)
VALUES
  ('CMP-1001', 'detected', 'AI detection created the complaint.'),
  ('CMP-1001', 'acknowledged', 'Authority acknowledged the report.'),
  ('CMP-1002', 'detected', 'Wall crack detected and routed.'),
  ('CMP-1002', 'sent', 'Complaint sent to authority.')
ON CONFLICT DO NOTHING;

SELECT * FROM public.vehicles;
SELECT * FROM public.cameras;
SELECT * FROM public.incidents;
SELECT * FROM public.detections;
SELECT * FROM public.complaints;
