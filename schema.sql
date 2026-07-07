-- ============================================================
-- Servicio Psicopedagógico UPLA - Esquema de base de datos
-- Motor: PostgreSQL (Supabase)
-- Ejecutar completo en: Supabase > SQL Editor > New query
-- ============================================================

-- Extensión para generar UUIDs
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- Tabla: usuarios
-- Estudiantes y personal administrativo del servicio
-- ------------------------------------------------------------
create table if not exists usuarios (
  id uuid primary key default gen_random_uuid(),
  nombres varchar(120) not null,
  apellidos varchar(120) not null,
  email varchar(160) not null unique,
  password varchar(255) not null,          -- en producción: usar Supabase Auth / hash
  rol varchar(20) not null check (rol in ('estudiante', 'administrativo')),
  codigo_matricula varchar(30),
  escuela_profesional varchar(120),
  celular varchar(20),
  creado_en timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Tabla: citas
-- Agendación de citas psicopedagógicas
-- ------------------------------------------------------------
create table if not exists citas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios(id) on delete cascade,
  fecha date not null,
  hora time not null,
  lugar varchar(150) default 'Servicio Psicopedagógico - FIUPLA',
  motivo varchar(255),
  estado varchar(20) not null default 'pendiente'
    check (estado in ('pendiente','confirmada','completada','cancelada')),
  nota_administrativo text,
  creado_en timestamptz not null default now(),
  unique (fecha, hora)  -- evita doble agendación en el mismo horario
);

-- ------------------------------------------------------------
-- Tabla: expedientes
-- Ficha de seguimiento psicopedagógico por estudiante
-- ------------------------------------------------------------
create table if not exists expedientes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references usuarios(id) on delete set null,
  nombre_completo varchar(160) not null,
  edad int,
  codigo_matricula varchar(30) not null,
  escuela_profesional varchar(120),
  celular varchar(20),
  motivo_consulta text not null,
  acciones_tomadas text,
  fecha_atencion date not null default current_date,
  personal_responsable varchar(160) not null,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Tabla: informacion_servicio
-- Contenido editable de la página pública de información
-- (registro único, id fijo = 1)
-- ------------------------------------------------------------
create table if not exists informacion_servicio (
  id int primary key default 1,
  presentacion text,
  escuelas_profesionales text,      -- lista separada por líneas
  horario_atencion varchar(255),
  ubicacion varchar(255),
  servicios_ofrecidos text,         -- lista separada por líneas
  contacto_telefono varchar(50),
  contacto_email varchar(160),
  actualizado_en timestamptz not null default now(),
  constraint solo_una_fila check (id = 1)
);

insert into informacion_servicio (id, presentacion, escuelas_profesionales, horario_atencion, ubicacion, servicios_ofrecidos, contacto_telefono, contacto_email)
values (
  1,
  'El Servicio Psicopedagógico de la Facultad de Ingeniería de la Universidad Peruana Los Andes brinda acompañamiento, orientación y atención personalizada a los estudiantes para favorecer su bienestar académico y emocional.',
  E'Ingeniería de Sistemas y Computación\nIngeniería Civil\nIngeniería Ambiental y Sanitaria\nIngeniería Electrónica y Telecomunicaciones\nIngeniería de Minas',
  'Lunes a viernes de 8:00 a.m. a 4:00 p.m.',
  'Facultad de Ingeniería - Universidad Peruana Los Andes, Huancayo',
  E'Orientación psicopedagógica individual\nAgendación de citas en línea\nSeguimiento de expedientes académicos\nDerivación a especialistas',
  '(064) 481-430',
  'psicopedagogico@upla.edu.pe'
)
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- Índices de apoyo
-- ------------------------------------------------------------
create index if not exists idx_citas_usuario on citas(usuario_id);
create index if not exists idx_citas_fecha on citas(fecha);
create index if not exists idx_expedientes_usuario on expedientes(usuario_id);

-- ------------------------------------------------------------
-- Seguridad a nivel de fila (RLS)
-- NOTA: Este proyecto usa una autenticación propia (tabla
-- "usuarios" con login por email/password) en lugar de Supabase
-- Auth, por lo que las políticas se dejan abiertas a la clave
-- "anon" para simplificar la demo académica. Para producción
-- real se recomienda migrar a Supabase Auth + políticas por
-- auth.uid().
-- ------------------------------------------------------------
alter table usuarios enable row level security;
alter table citas enable row level security;
alter table expedientes enable row level security;
alter table informacion_servicio enable row level security;

create policy "usuarios_select" on usuarios for select using (true);
create policy "usuarios_insert" on usuarios for insert with check (true);
create policy "usuarios_update" on usuarios for update using (true);

create policy "citas_all" on citas for all using (true) with check (true);
create policy "expedientes_all" on expedientes for all using (true) with check (true);

create policy "info_select" on informacion_servicio for select using (true);
create policy "info_update" on informacion_servicio for update using (true);

-- ------------------------------------------------------------
-- Usuario administrativo de ejemplo para pruebas
-- (password en texto plano solo para fines de demo académica)
-- ------------------------------------------------------------
insert into usuarios (nombres, apellidos, email, password, rol)
values ('Sarita', 'Pascual', 'admin@upla.edu.pe', 'admin123', 'administrativo')
on conflict (email) do nothing;

insert into usuarios (nombres, apellidos, email, password, rol, codigo_matricula, escuela_profesional, celular)
values ('Juan', 'Pérez Quispe', 'estudiante@upla.edu.pe', 'estudiante123', 'estudiante', '2021100123', 'Ingeniería de Sistemas y Computación', '987654321')
on conflict (email) do nothing;
