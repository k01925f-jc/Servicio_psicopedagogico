/* ============================================================
   Autenticación simple contra la tabla "usuarios"
   ============================================================ */

const SESSION_KEY = "upla_psico_session";

function guardarSesion(usuario) {
  const datos = {
    id: usuario.id,
    nombres: usuario.nombres,
    apellidos: usuario.apellidos,
    email: usuario.email,
    rol: usuario.rol,
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(datos));
}

function obtenerSesion() {
  const raw = sessionStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

function cerrarSesion() {
  sessionStorage.removeItem(SESSION_KEY);
  window.location.href = "login.html";
}

/**
 * Protege una página: si no hay sesión o el rol no coincide,
 * redirige a login.html
 */
function requerirSesion(rolEsperado) {
  const sesion = obtenerSesion();
  if (!sesion || (rolEsperado && sesion.rol !== rolEsperado)) {
    window.location.href = "login.html";
    return null;
  }
  return sesion;
}

async function iniciarSesion(email, password) {
  const { data, error } = await supabaseClient
    .from("usuarios")
    .select("*")
    .eq("email", email.trim().toLowerCase())
    .eq("password", password)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  guardarSesion(data);
  return data;
}
