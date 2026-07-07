/* ============================================================
   Lógica del Panel del Estudiante
   ============================================================ */

const sesion = requerirSesion("estudiante");
let fechaSeleccionada = null;
let horaSeleccionada = null;

const HORAS_DISPONIBLES = ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00"];

function init() {
  if (!sesion) return;
  document.getElementById("nombre-usuario").textContent = `${sesion.nombres} ${sesion.apellidos}`;
  document.getElementById("email-usuario").textContent = sesion.email;

  configurarNavegacion();
  configurarSelectorFecha();
  cargarResumenInicio();
  cargarMisCitas();
  cargarInformacionServicio();

  document.getElementById("btn-confirmar-cita").addEventListener("click", confirmarCita);
}

function configurarNavegacion() {
  document.querySelectorAll(".nav-link").forEach((btn) => {
    btn.addEventListener("click", () => irAVista(btn.dataset.view));
  });
}

function irAVista(nombre) {
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
  document.querySelectorAll(".nav-link").forEach((n) => n.classList.remove("active"));
  document.getElementById(`view-${nombre}`).classList.add("active");
  document.querySelector(`.nav-link[data-view="${nombre}"]`).classList.add("active");

  const titulos = {
    "inicio": "Inicio",
    "agendar": "Agendar cita",
    "mis-citas": "Mis citas",
    "informacion": "Información del servicio",
  };
  document.getElementById("titulo-vista").textContent = titulos[nombre] || "";

  if (nombre === "mis-citas") cargarMisCitas();
  if (nombre === "inicio") cargarResumenInicio();
}

function configurarSelectorFecha() {
  const input = document.getElementById("input-fecha");
  const hoy = new Date().toISOString().split("T")[0];
  input.min = hoy;
  input.value = hoy;
  fechaSeleccionada = hoy;
  input.addEventListener("change", () => {
    fechaSeleccionada = input.value;
    horaSeleccionada = null;
    cargarHorariosDisponibles();
  });
  cargarHorariosDisponibles();
}

async function cargarHorariosDisponibles() {
  const grid = document.getElementById("slot-grid");
  grid.innerHTML = `<p style="color:var(--text-soft);font-size:13px;">Cargando horarios…</p>`;
  document.getElementById("btn-confirmar-cita").disabled = true;

  const { data, error } = await supabaseClient
    .from("citas")
    .select("hora")
    .eq("fecha", fechaSeleccionada)
    .neq("estado", "cancelada");

  const ocupadas = new Set((data || []).map((c) => c.hora.slice(0,5)));

  grid.innerHTML = HORAS_DISPONIBLES.map((h) => {
    const ocupado = ocupadas.has(h);
    const clase = ocupado ? "slot taken" : "slot available";
    return `<div class="${clase}" data-hora="${h}">${formatearHora(h)}</div>`;
  }).join("");

  grid.querySelectorAll(".slot.available").forEach((el) => {
    el.addEventListener("click", () => {
      grid.querySelectorAll(".slot").forEach((s) => s.classList.remove("selected"));
      el.classList.add("selected");
      horaSeleccionada = el.dataset.hora;
      document.getElementById("btn-confirmar-cita").disabled = false;
    });
  });
}

async function confirmarCita() {
  const btn = document.getElementById("btn-confirmar-cita");
  if (!fechaSeleccionada || !horaSeleccionada) return;

  btn.disabled = true;
  btn.textContent = "Agendando…";

  const motivo = document.getElementById("input-motivo").value.trim();

  const { error } = await supabaseClient.from("citas").insert({
    usuario_id: sesion.id,
    fecha: fechaSeleccionada,
    hora: horaSeleccionada,
    motivo: motivo || null,
    estado: "pendiente",
  });

  btn.textContent = "Confirmar cita";

  if (error) {
    mostrarToast(
      error.code === "23505" ? "Ese horario ya fue tomado, elige otro." : "No se pudo agendar la cita.",
      "error"
    );
    cargarHorariosDisponibles();
    return;
  }

  mostrarToast("Cita agendada correctamente.", "success");
  document.getElementById("input-motivo").value = "";
  horaSeleccionada = null;
  cargarHorariosDisponibles();
  cargarResumenInicio();
}

async function cargarMisCitas() {
  const tbody = document.getElementById("tabla-mis-citas");
  const { data, error } = await supabaseClient
    .from("citas")
    .select("*")
    .eq("usuario_id", sesion.id)
    .order("fecha", { ascending: false })
    .order("hora", { ascending: false });

  if (error || !data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-soft);padding:26px;">Aún no tienes citas agendadas.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map((c) => `
    <tr>
      <td>${formatearFecha(c.fecha)}</td>
      <td>${formatearHora(c.hora.slice(0,5))}</td>
      <td>${escapeHtml(c.lugar || "-")}</td>
      <td>${escapeHtml(c.motivo || "-")}</td>
      <td>${pillEstado(c.estado)}</td>
    </tr>
  `).join("");
}

async function cargarResumenInicio() {
  const { data, error } = await supabaseClient
    .from("citas")
    .select("*")
    .eq("usuario_id", sesion.id)
    .order("fecha", { ascending: true });

  if (error || !data) return;

  const hoy = new Date().toISOString().split("T")[0];
  const proximas = data.filter((c) => c.fecha >= hoy && c.estado !== "cancelada" && c.estado !== "completada");
  const completadas = data.filter((c) => c.estado === "completada");

  document.getElementById("stat-proximas").textContent = proximas.length;
  document.getElementById("stat-completadas").textContent = completadas.length;
  document.getElementById("stat-total").textContent = data.length;

  const box = document.getElementById("proxima-cita-box");
  if (proximas.length === 0) {
    box.innerHTML = `
      <div class="empty-state">
        <div class="ico">&#128197;</div>
        <p>Aún no tienes citas próximas.</p>
        <button class="btn btn-primary btn-sm" onclick="irAVista('agendar')">Agendar una cita</button>
      </div>`;
    return;
  }
  const c = proximas[0];
  box.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px;">
      <div>
        <div style="font-size:18px;font-weight:700;color:var(--navy);">${formatearFecha(c.fecha)} &middot; ${formatearHora(c.hora.slice(0,5))}</div>
        <div style="color:var(--text-soft);font-size:13.5px;margin-top:4px;">${escapeHtml(c.lugar || "Servicio Psicopedagógico - FIUPLA")}</div>
      </div>
      ${pillEstado(c.estado)}
    </div>`;
}

async function cargarInformacionServicio() {
  const { data, error } = await supabaseClient
    .from("informacion_servicio")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) return;

  document.getElementById("info-presentacion").textContent = data.presentacion || "";
  document.getElementById("info-horario2").textContent = data.horario_atencion || "-";
  document.getElementById("info-ubicacion2").textContent = data.ubicacion || "-";
  document.getElementById("info-telefono2").textContent = data.contacto_telefono || "-";
  document.getElementById("info-email2").textContent = data.contacto_email || "-";

  const escuelas = (data.escuelas_profesionales || "").split("\n").filter(Boolean);
  document.getElementById("info-escuelas").innerHTML = escuelas.map((e) => `<li><span class="dot"></span>${escapeHtml(e)}</li>`).join("") || "<li>Sin datos</li>";

  const servicios = (data.servicios_ofrecidos || "").split("\n").filter(Boolean);
  document.getElementById("info-servicios").innerHTML = servicios.map((s) => `<li><span class="dot"></span>${escapeHtml(s)}</li>`).join("") || "<li>Sin datos</li>";
}

init();
