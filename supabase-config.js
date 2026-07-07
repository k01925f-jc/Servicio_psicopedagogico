/* ============================================================
   Configuración de Supabase
   ------------------------------------------------------------
   1. Crea un proyecto en https://supabase.com
   2. Ejecuta el script sql/schema.sql en el "SQL Editor" de tu
      proyecto Supabase para crear las tablas necesarias.
   3. Reemplaza los valores de abajo con los de tu proyecto:
      Project Settings > API > Project URL / anon public key
   ============================================================ */

const SUPABASE_URL = "https://ligrnuzzvnpfkebynvvv.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_NP4c8hH6-DFclXTiTnfMZw_7sFQ6JOu";

// El cliente de Supabase se carga vía CDN en cada HTML:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
