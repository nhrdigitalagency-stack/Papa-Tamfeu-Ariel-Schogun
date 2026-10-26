-- ============================================================================
-- MIGRATION SUPABASE : FAIRE-PART & HOMMAGE À PAPA TAMFEU ARIEL SCHOGUN
-- ============================================================================
-- Ce fichier définit les tables, contraintes, stockages privés et politiques RLS
-- pour la gestion sécurisée du mémorial.
-- Aucune clé service_role ne doit être exposée côté navigateur.
-- ============================================================================

create extension if not exists "pgcrypto";

-- 1. Table de configuration centrale (memorial_settings)
create table if not exists public.memorial_settings (
  id text primary key default 'default',
  display_name text not null default 'Papa Tamfeu Ariel Schogun',
  birth_year integer not null default 1989,
  death_year integer not null default 2026,
  birth_place text not null default 'Bandjoun, région de l’Ouest, Cameroun',
  marital_status text not null default 'Marié',
  portrait_url text not null default '/assets/aistudio/Portrait_professionnel_en_costume_sombre_f15e88d6.png',
  floral_image_url text not null default '/assets/aistudio/jWzG97KwgJ2vECFkAxtco_S5j64_fR3jAP8UqTFz0ot1B0UvjNq0gMNANjsuVw0wuIfdApvjSnRin5XquNxTuQlKddDoxye91uNc0BgareId3H9Fjm-eNShx2FGNhWU82Tfc2LIkxOv_PtuFFAqGQOEWsRTBBYPTqUnBr6PJ7ZD2KZifpr-3ByOS0sV_iUWO_2e0dc6a2.jpg',
  family_list_confirmed boolean not null default false,
  program_confirmed boolean not null default false,
  weekday_inconsistency_resolved boolean not null default false,
  contact_confirmed boolean not null default false,
  contact_name text not null default '',
  whatsapp_number text not null default '+33 7 53 04 93 53',
  home_maps_url text not null default '',
  home_address text not null default '',
  custom_map_image_url text not null default '',
  time_zone text not null default 'Africa/Douala',
  allow_public_tributes boolean not null default true,
  allow_guest_photos boolean not null default false,
  religious_symbol text not null default 'none',
  religious_symbol_confirmed boolean not null default false,
  updated_at timestamptz not null default now()
);

-- 2. Table des familles (family_names)
create table if not exists public.family_names (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text default null check (category in (null, 'paternelle', 'maternelle', 'belle_famille', 'alliee', 'autre')),
  description text default '',
  display_order integer not null default 0,
  confirmed boolean not null default false,
  created_at timestamptz not null default now()
);

-- 3. Sections de biographie (biography_sections)
create table if not exists public.biography_sections (
  id text primary key,
  code text not null unique,
  title text not null,
  content text not null default '',
  is_visible_public boolean not null default false,
  is_validated boolean not null default false,
  display_order integer not null default 0,
  updated_at timestamptz not null default now()
);

-- 4. Événements du programme (program_events)
create table if not exists public.program_events (
  id text primary key,
  day_key text not null,
  day_label_transmitted text not null,
  weekday_transmitted text default '',
  show_weekday boolean not null default false,
  date_confirmed boolean not null default false,
  time_label text not null,
  time_confirmed boolean not null default false,
  title text not null,
  location text not null,
  location_details text default '',
  location_confirmed boolean not null default false,
  notes text default '',
  display_order integer not null default 0,
  updated_at timestamptz not null default now()
);

-- 5. Témoignages et condoléances (tributes)
create table if not exists public.tributes (
  id uuid primary key default gen_random_uuid(),
  author_first_name text not null,
  author_last_name text default '',
  relationship text default '',
  message text not null,
  is_private_to_family boolean not null default false,
  consent_publication boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  moderated_at timestamptz default null
);

-- 6. Souvenirs photographiques (photos)
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  caption text default '',
  category text not null default 'souvenir' check (category in ('portrait', 'famille', 'professionnel', 'ceremonie', 'souvenir')),
  author_name text not null,
  image_data_url text not null,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  file_size_bytes integer not null check (file_size_bytes <= 10485760),
  exif_stripped boolean not null default true,
  consent_publication boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  deletion_requested boolean not null default false,
  deletion_reason text default '',
  created_at timestamptz not null default now()
);

-- ============================================================================
-- POLITIQUES DE SÉCURITÉ RLS (Row Level Security)
-- ============================================================================

alter table public.memorial_settings enable row level security;
alter table public.family_names enable row level security;
alter table public.biography_sections enable row level security;
alter table public.program_events enable row level security;
alter table public.tributes enable row level security;
alter table public.photos enable row level security;

-- Lecture publique des paramètres non sensibles
create policy "Public read memorial_settings"
  on public.memorial_settings for select
  using (true);

-- Lecture publique des familles
create policy "Public read family_names"
  on public.family_names for select
  using (true);

-- Lecture publique uniquement des sections biographiques validées/visibles
create policy "Public read visible biography_sections"
  on public.biography_sections for select
  using (is_visible_public = true);

-- Lecture publique du programme
create policy "Public read program_events"
  on public.program_events for select
  using (true);

-- Lecture publique uniquement des témoignages approuvés et non privés
create policy "Public read approved tributes"
  on public.tributes for select
  using (status = 'approved' and is_private_to_family = false and consent_publication = true);

-- Insertion publique de témoignages uniquement en statut 'pending'
create policy "Public insert pending tributes"
  on public.tributes for insert
  with check (status = 'pending');

-- Lecture publique uniquement des photos approuvées
create policy "Public read approved photos"
  on public.photos for select
  using (status = 'approved' and consent_publication = true);

-- Insertion publique de photos en statut 'pending' avec consentement
create policy "Public insert pending photos"
  on public.photos for insert
  with check (status = 'pending' and consent_publication = true and exif_stripped = true);
