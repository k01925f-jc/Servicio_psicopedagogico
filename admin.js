/* ============================================================
   Lógica del Panel Administrativo
   ============================================================ */

const sesion = requerirSesion("administrativo");

function init() {
  if (!sesion) return;
  document.getElementById("nombre-usuario").textContent = `${sesion.nombres} ${sesion.apellidos}`;
  document.getElementById("email-usuario").textContent = sesion.email;

  configurarNavegacion();
  configurarFiltroMes();
  cargarResumenInicio();
  cargarCitasHoy();
  cargarCitasDelMes();
  cargarExpedientes();
  cargarInformacionParaEditar();

  document.getElementById("form-expediente").addEventListener("submit", guardarExpediente);
  document.getElementById("form-reprogramar").addEventListener("submit", guardarReprogramacion);
  document.getElementById("btn-guardar-info").addEventListener("click", guardarInformacionServicio);
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
    "citas": "Gestión de citas",
    "expedientes": "Gestión de Expedientes",
    "informacion": "Información del servicio",
  };
  document.getElementById("titulo-vista").textContent = titulos[nombre] || "";

  if (nombre === "citas") cargarCitasDelMes();
  if (nombre === "expedientes") cargarExpedientes();
  if (nombre === "inicio") { cargarResumenInicio(); cargarCitasHoy(); }
}

function configurarFiltroMes() {
  const input = document.getElementById("filtro-mes");
  const hoy = new Date();
  input.value = `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,"0")}`;
  input.addEventListener("change", cargarCitasDelMes);
}

/* ---------------- INICIO / DASHBOARD ---------------- */

async function cargarResumenInicio() {
  const hoy = new Date().toISOString().split("T")[0];
  const inicioMes = hoy.slice(0,8) + "01";

  const { data: citas } = await supabaseClient.from("citas").select("*");
  const { count: totalExpedientes } = await supabaseClient
    .from("expedientes")
    .select("*", { count: "exact", head: true });

  if (citas) {
    document.getElementById("stat-hoy").textContent = citas.filter(c => c.fecha === hoy).length;
    document.getElementById("stat-pendientes").textContent = citas.filter(c => c.estado === "pendiente").length;
    document.getElementById("stat-mes").textContent = citas.filter(c => c.fecha >= inicioMes && c.fecha <= hoy.slice(0,8) + "31").length;
  }
  document.getElementById("stat-expedientes").textContent = totalExpedientes ?? 0;
}

async function cargarCitasHoy() {
  const hoy = new Date().toISOString().split("T")[0];
  const tbody = document.getElementById("tabla-citas-hoy");

  const { data, error } = await supabaseClient
    .from("citas")
    .select("*, usuarios(nombres, apellidos)")
    .eq("fecha", hoy)
    .order("hora", { ascending: true });

  if (error || !data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--text-soft);padding:22px;">No hay citas programadas para hoy.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map((c) => `
    <tr>
      <td>${formatearHora(c.hora.slice(0,5))}</td>
      <td>${c.usuarios ? escapeHtml(c.usuarios.nombres + " " + c.usuarios.apellidos) : "-"}</td>
      <td>${escapeHtml(c.motivo || "-")}</td>
      <td>${pillEstado(c.estado)}</td>
    </tr>
  `).join("");
}

/* ---------------- GESTIÓN DE CITAS ---------------- */

async function cargarCitasDelMes() {
  const tbody = document.getElementById("tabla-citas");
  const mes = document.getElementById("filtro-mes").value; // YYYY-MM
  const inicio = `${mes}-01`;
  const finDate = new Date(mes + "-01");
  finDate.setMonth(finDate.getMonth() + 1);
  const fin = finDate.toISOString().split("T")[0];

  const { data, error } = await supabaseClient
    .from("citas")
    .select("*, usuarios(nombres, apellidos)")
    .gte("fecha", inicio)
    .lt("fecha", fin)
    .order("fecha", { ascending: true })
    .order("hora", { ascending: true });

  if (error || !data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-soft);padding:26px;">No hay citas registradas para este mes.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map((c) => `
    <tr>
      <td>${formatearFecha(c.fecha)}</td>
      <td>${formatearHora(c.hora.slice(0,5))}</td>
      <td>${c.usuarios ? escapeHtml(c.usuarios.nombres + " " + c.usuarios.apellidos) : "-"}</td>
      <td>${escapeHtml(c.motivo || "-")}</td>
      <td>${pillEstado(c.estado)}</td>
      <td>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          ${c.estado !== "completada" && c.estado !== "cancelada" ? `
            <button class="btn btn-success btn-sm" onclick="marcarCompletada('${c.id}')">Completar</button>
            <button class="btn btn-ghost btn-sm" onclick="abrirReprogramar('${c.id}','${c.fecha}','${c.hora.slice(0,5)}')">Reprogramar</button>
            <button class="btn btn-danger btn-sm" onclick="cancelarCita('${c.id}')">Cancelar</button>
          ` : `<span style="color:var(--text-soft);font-size:12.5px;">Sin acciones</span>`}
        </div>
      </td>
    </tr>
  `).join("");
}

async function marcarCompletada(id) {
  const { error } = await supabaseClient.from("citas").update({ estado: "completada" }).eq("id", id);
  if (error) return mostrarToast("No se pudo actualizar la cita.", "error");
  mostrarToast("Cita marcada como completada.", "success");
  cargarCitasDelMes();
  cargarResumenInicio();
}

async function cancelarCita(id) {
  if (!confirm("¿Confirmas cancelar esta cita?")) return;
  const { error } = await supabaseClient.from("citas").update({ estado: "cancelada" }).eq("id", id);
  if (error) return mostrarToast("No se pudo cancelar la cita.", "error");
  mostrarToast("Cita cancelada.", "success");
  cargarCitasDelMes();
  cargarResumenInicio();
}

function abrirReprogramar(id, fecha, hora) {
  document.getElementById("repro-id").value = id;
  document.getElementById("repro-fecha").value = fecha;
  document.getElementById("repro-hora").value = hora;
  abrirModal("modal-reprogramar");
}

async function guardarReprogramacion(e) {
  e.preventDefault();
  const id = document.getElementById("repro-id").value;
  const fecha = document.getElementById("repro-fecha").value;
  const hora = document.getElementById("repro-hora").value;

  const { error } = await supabaseClient
    .from("citas")
    .update({ fecha, hora, estado: "confirmada" })
    .eq("id", id);

  if (error) {
    mostrarToast(error.code === "23505" ? "Ese horario ya está ocupado." : "No se pudo reprogramar.", "error");
    return;
  }
  mostrarToast("Cita reprogramada correctamente.", "success");
  cerrarModal("modal-reprogramar");
  cargarCitasDelMes();
}

/* ---------------- EXPEDIENTES ---------------- */

async function cargarExpedientes() {
  const tbody = document.getElementById("tabla-expedientes");
  const { data, error } = await supabaseClient
    .from("expedientes")
    .select("*")
    .order("fecha_atencion", { ascending: false });

  if (error || !data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-soft);padding:26px;">Aún no hay expedientes registrados. Crea el primero con "+ Nuevo Expediente".</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map((exp) => `
    <tr>
      <td>${escapeHtml(exp.nombre_completo)}</td>
      <td>${escapeHtml(exp.codigo_matricula)}</td>
      <td>${escapeHtml(exp.escuela_profesional || "-")}</td>
      <td>${formatearFecha(exp.fecha_atencion)}</td>
      <td>${escapeHtml(exp.personal_responsable)}</td>
      <td>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-ghost btn-sm" onclick="verExpediente('${exp.id}')">Ver</button>
          <button class="btn btn-outline btn-sm" onclick="editarExpediente('${exp.id}')">Editar</button>
        </div>
      </td>
    </tr>
  `).join("");

  window._expedientesCache = data;
}

function abrirModalExpediente() {
  document.getElementById("form-expediente").reset();
  document.getElementById("exp-id").value = "";
  document.getElementById("exp-fecha").value = new Date().toISOString().split("T")[0];
  document.getElementById("modal-expediente-titulo").textContent = "Nuevo expediente";
  abrirModal("modal-expediente");
}

function editarExpediente(id) {
  const exp = (window._expedientesCache || []).find((e) => e.id === id);
  if (!exp) return;
  document.getElementById("exp-id").value = exp.id;
  document.getElementById("exp-nombre").value = exp.nombre_completo;
  document.getElementById("exp-edad").value = exp.edad || "";
  document.getElementById("exp-codigo").value = exp.codigo_matricula;
  document.getElementById("exp-escuela").value = exp.escuela_profesional || "";
  document.getElementById("exp-celular").value = exp.celular || "";
  document.getElementById("exp-fecha").value = exp.fecha_atencion;
  document.getElementById("exp-motivo").value = exp.motivo_consulta;
  document.getElementById("exp-acciones").value = exp.acciones_tomadas || "";
  document.getElementById("exp-responsable").value = exp.personal_responsable;
  document.getElementById("modal-expediente-titulo").textContent = "Editar expediente";
  abrirModal("modal-expediente");
}

function verExpediente(id) {
  const exp = (window._expedientesCache || []).find((e) => e.id === id);
  if (!exp) return;
  document.getElementById("ver-expediente-body").innerHTML = `
    <div class="form-grid">
      <div class="field"><label>Nombre completo</label><p>${escapeHtml(exp.nombre_completo)}</p></div>
      <div class="field"><label>Edad</label><p>${exp.edad ?? "-"}</p></div>
      <div class="field"><label>Código de matrícula</label><p>${escapeHtml(exp.codigo_matricula)}</p></div>
      <div class="field"><label>Escuela profesional</label><p>${escapeHtml(exp.escuela_profesional || "-")}</p></div>
      <div class="field"><label>Celular</label><p>${escapeHtml(exp.celular || "-")}</p></div>
      <div class="field"><label>Fecha de atención</label><p>${formatearFecha(exp.fecha_atencion)}</p></div>
      <div class="field full"><label>Motivo de consulta</label><p>${escapeHtml(exp.motivo_consulta)}</p></div>
      <div class="field full"><label>Acciones tomadas</label><p>${escapeHtml(exp.acciones_tomadas || "-")}</p></div>
      <div class="field full"><label>Personal responsable</label><p>${escapeHtml(exp.personal_responsable)}</p></div>
    </div>`;
  abrirModal("modal-ver-expediente");
}

async function guardarExpediente(e) {
  e.preventDefault();
  const id = document.getElementById("exp-id").value;
  const btn = document.getElementById("btn-guardar-expediente");
  btn.disabled = true;
  btn.textContent = "Guardando…";

  const payload = {
    nombre_completo: document.getElementById("exp-nombre").value.trim(),
    edad: document.getElementById("exp-edad").value ? parseInt(document.getElementById("exp-edad").value, 10) : null,
    codigo_matricula: document.getElementById("exp-codigo").value.trim(),
    escuela_profesional: document.getElementById("exp-escuela").value.trim(),
    celular: document.getElementById("exp-celular").value.trim(),
    fecha_atencion: document.getElementById("exp-fecha").value,
    motivo_consulta: document.getElementById("exp-motivo").value.trim(),
    acciones_tomadas: document.getElementById("exp-acciones").value.trim(),
    personal_responsable: document.getElementById("exp-responsable").value.trim(),
    actualizado_en: new Date().toISOString(),
  };

  let error;
  if (id) {
    ({ error } = await supabaseClient.from("expedientes").update(payload).eq("id", id));
  } else {
    ({ error } = await supabaseClient.from("expedientes").insert(payload));
  }

  btn.disabled = false;
  btn.textContent = "Guardar";

  if (error) return mostrarToast("No se pudo guardar el expediente.", "error");

  mostrarToast(id ? "Expediente actualizado." : "Expediente registrado.", "success");
  cerrarModal("modal-expediente");
  cargarExpedientes();
  cargarResumenInicio();
}

/* ---------------- INFORMACIÓN DEL SERVICIO ---------------- */

async function cargarInformacionParaEditar() {
  const { data, error } = await supabaseClient
    .from("informacion_servicio")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) return;

  document.getElementById("edit-presentacion").value = data.presentacion || "";
  document.getElementById("edit-escuelas").value = data.escuelas_profesionales || "";
  document.getElementById("edit-servicios").value = data.servicios_ofrecidos || "";
  document.getElementById("edit-horario").value = data.horario_atencion || "";
  document.getElementById("edit-ubicacion").value = data.ubicacion || "";
  document.getElementById("edit-telefono").value = data.contacto_telefono || "";
  document.getElementById("edit-email").value = data.contacto_email || "";
}

async function guardarInformacionServicio() {
  const btn = document.getElementById("btn-guardar-info");
  btn.disabled = true;
  btn.textContent = "Guardando…";

  const payload = {
    presentacion: document.getElementById("edit-presentacion").value.trim(),
    escuelas_profesionales: document.getElementById("edit-escuelas").value.trim(),
    servicios_ofrecidos: document.getElementById("edit-servicios").value.trim(),
    horario_atencion: document.getElementById("edit-horario").value.trim(),
    ubicacion: document.getElementById("edit-ubicacion").value.trim(),
    contacto_telefono: document.getElementById("edit-telefono").value.trim(),
    contacto_email: document.getElementById("edit-email").value.trim(),
    actualizado_en: new Date().toISOString(),
  };

  const { error } = await supabaseClient.from("informacion_servicio").update(payload).eq("id", 1);

  btn.disabled = false;
  btn.textContent = "Guardar cambios";

  if (error) return mostrarToast("No se pudo guardar la información.", "error");
  mostrarToast("Información del servicio actualizada.", "success");
}

init();
