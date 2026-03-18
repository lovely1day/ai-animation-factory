-- =====================================================
-- AI CINEMA STUDIO
-- UNIVERSE DATABASE
-- =====================================================

-- =========================
-- SHOWS
-- =========================

create table if not exists shows (

  id uuid primary key default gen_random_uuid(),

  title text not null,

  description text,

  genre text,

  target_audience text,

  visual_style text,

  render_quality text default '4k',

  created_at timestamp default now()

);


-- =========================
-- ENTITIES (GLOBAL)
-- =========================

create table if not exists entities (

  id uuid primary key default gen_random_uuid(),

  type text not null,

  name text not null,

  description text,

  reference_image text,

  style_prompt text,

  metadata jsonb,

  created_at timestamp default now()

);


-- =========================
-- SHOW ENTITIES
-- يسمح للشخصيات بالظهور
-- في اكثر من مسلسل
-- =========================

create table if not exists show_entities (

  id uuid primary key default gen_random_uuid(),

  show_id uuid references shows(id) on delete cascade,

  entity_id uuid references entities(id) on delete cascade,

  role text,

  created_at timestamp default now()

);


-- =========================
-- CHARACTERS
-- =========================

create table if not exists characters (

  id uuid primary key default gen_random_uuid(),

  entity_id uuid references entities(id) on delete cascade,

  age integer,

  gender text,

  personality text,

  voice_id text,

  clothing text,

  created_at timestamp default now()

);


-- =========================
-- ANIMALS
-- =========================

create table if not exists animals (

  id uuid primary key default gen_random_uuid(),

  entity_id uuid references entities(id) on delete cascade,

  species text,

  owner_character_id uuid,

  behavior text,

  created_at timestamp default now()

);


-- =========================
-- LOCATIONS
-- =========================

create table if not exists locations (

  id uuid primary key default gen_random_uuid(),

  entity_id uuid references entities(id) on delete cascade,

  environment_type text,

  lighting_style text,

  default_time text,

  created_at timestamp default now()

);


-- =========================
-- VEHICLES
-- =========================

create table if not exists vehicles (

  id uuid primary key default gen_random_uuid(),

  entity_id uuid references entities(id) on delete cascade,

  vehicle_type text,

  color text,

  owner_character_id uuid,

  created_at timestamp default now()

);


-- =========================
-- PROPS
-- =========================

create table if not exists props (

  id uuid primary key default gen_random_uuid(),

  entity_id uuid references entities(id) on delete cascade,

  material text,

  owner_character_id uuid,

  story_importance text,

  created_at timestamp default now()

);