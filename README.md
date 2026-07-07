# Servicio Psicopedagógico UPLA — Sitio Web

Proyecto web (HTML5 + CSS3 + JavaScript) para el Servicio Psicopedagógico de la
Facultad de Ingeniería de la Universidad Peruana Los Andes (UPLA), desarrollado
siguiendo la metodología XP descrita en el documento `FinalMetdologiaXP.docx`
(historias de usuario H1–H10, bosquejos y capturas de las 3 iteraciones).

Base de datos: **Supabase** (PostgreSQL en la nube).

## Contenido del proyecto

```
proyecto/
├── index.html              Página pública: presentación del servicio, escuelas,
│                            horarios, ubicación y contacto (solo lectura)
├── login.html               Inicio de sesión único para estudiante y administrativo
├── panel-estudiante.html     Portal del estudiante (SPA): inicio, agendar cita,
│                            mis citas, información del servicio (solo lectura)
├── panel-admin.html          Panel administrativo (SPA): dashboard, gestión de
│                            citas, expedientes (CRUD), edición de información
├── css/
│   └── style.css             Estilos de todo el sitio
├── js/
│   ├── supabase-config.js    Credenciales de conexión a Supabase (EDITAR AQUÍ)
│   ├── auth.js                Login y manejo de sesión (sessionStorage)
│   ├── utils.js               Utilidades de interfaz (toasts, formato, modales)
│   ├── estudiante.js           Lógica del panel del estudiante
│   └── admin.js                 Lógica del panel administrativo
├── sql/
│   └── schema.sql              Script para crear las tablas en Supabase
└── README.md
```

## 1. Crear el proyecto en Supabase

1. Ingresa a https://supabase.com y crea una cuenta / inicia sesión.
2. Crea un **New Project** (elige nombre, contraseña de base de datos y región).
3. Cuando el proyecto esté listo, ve a **SQL Editor > New query**.
4. Copia y pega todo el contenido de `sql/schema.sql` y ejecútalo (botón *Run*).
   Esto crea las tablas `usuarios`, `citas`, `expedientes`, `informacion_servicio`,
   las políticas de seguridad (RLS) y dos cuentas de prueba.

## 2. Conectar el sitio con tu proyecto Supabase

1. En Supabase ve a **Project Settings > API**.
2. Copia el **Project URL** y la **anon public key**.
3. Abre `js/supabase-config.js` y reemplaza:

```js
const SUPABASE_URL = "https://TU-PROYECTO.supabase.co";
const SUPABASE_ANON_KEY = "TU-ANON-KEY-PUBLICA";
```

por tus propios valores.

## 3. Probar localmente

Puedes abrir `index.html` directamente en el navegador, pero para evitar
problemas de rutas relativas se recomienda servir la carpeta con un servidor
local, por ejemplo:

```bash
cd proyecto
python3 -m http.server 8080
```

Luego visita `http://localhost:8080`.

## 4. Cuentas de prueba (creadas por schema.sql)

| Rol            | Correo                     | Contraseña      |
|----------------|----------------------------|-----------------|
| Estudiante     | estudiante@upla.edu.pe     | estudiante123   |
| Administrativo | admin@upla.edu.pe          | admin123        |

## 5. Subir a un hosting (HTML/CSS/JS estático)

Este proyecto es 100% estático (no requiere backend propio, ya que usa
Supabase como base de datos vía API). Puedes subirlo tal cual a:

- **Netlify / Vercel**: arrastra la carpeta `proyecto` en el panel de deploy.
- **GitHub Pages**: sube el contenido a un repositorio y activa Pages.
- Cualquier hosting de archivos estáticos.

No olvides mantener actualizado `js/supabase-config.js` con las credenciales
correctas antes de publicar.

## Funcionalidades implementadas (según historias de usuario)

- **H1 / H2** — Inicio de sesión único que identifica el rol (estudiante o
  administrativo) y redirige al panel correspondiente.
- **H3** — Base de datos estructurada (`usuarios`, `citas`, `expedientes`,
  `informacion_servicio`).
- **H4** — Agendación de citas con selección de fecha y horarios disponibles
  (bloques de 1 hora), con validación para no permitir horarios ya tomados.
- **H5** — El estudiante visualiza sus citas agendadas (fecha, hora, lugar,
  estado).
- **H6** — El administrativo visualiza las citas del mes, con filtro por mes,
  y puede completar, reprogramar o cancelar cada cita.
- **H7 / H8 / H9** — Registro, visualización y edición de expedientes
  (nombre completo, edad, código de matrícula, escuela profesional, celular,
  motivo de consulta, acciones tomadas, fecha de atención, responsable).
- **H10** — Información del servicio visible en modo lectura para el
  estudiante y editable desde el panel administrativo (presentación,
  escuelas, servicios, horario, ubicación y contacto), reflejándose de
  inmediato en la página pública y en el portal del estudiante.

## Notas de seguridad

Este proyecto usa una tabla propia `usuarios` con autenticación por
email/contraseña en texto plano, tal como se planteó en el documento de
metodología para fines académicos. **Para un entorno de producción real**
se recomienda:

- Migrar la autenticación a **Supabase Auth**.
- Aplicar hash de contraseñas (bcrypt) si se mantiene la tabla propia.
- Ajustar las políticas de RLS para restringir el acceso según el usuario
  autenticado en vez de dejarlas abiertas a la clave `anon`.
