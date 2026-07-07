/* ============================================================
   Utilidades de interfaz compartidas
   ============================================================ */

function mostrarToast(mensaje, tipo = "info") {
  let wrap = document.querySelector(".toast-wrap");
  if (!wrap) {
    wrap = document.createElement("div");
    wrap.className = "toast-wrap";
    document.body.appendChild(wrap);
  }
  const toast = document.createElement("div");
  toast.className = `toast ${tipo}`;
  toast.textContent = mensaje;
  wrap.appendChild(toast);
  setTimeout(() => toast.remove(), 3600);
}

function formatearFecha(fechaStr) {
  if (!fechaStr) return "-";
  const [y, m, d] = fechaStr.split("-");
  const meses = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  return `${d} ${meses[parseInt(m,10)-1]}. ${y}`;
}

function formatearHora(horaStr) {
  if (!horaStr) return "-";
  const [h, m] = horaStr.split(":");
  const hNum = parseInt(h, 10);
  const suf = hNum >= 12 ? "p. m." : "a. m.";
  const h12 = hNum % 12 === 0 ? 12 : hNum % 12;
  return `${h12}:${m} ${suf}`;
}

function abrirModal(id) {
  document.getElementById(id).classList.add("open");
}
function cerrarModal(id) {
  document.getElementById(id).classList.remove("open");
}

function pillEstado(estado) {
  const etiquetas = {
    pendiente: "Pendiente",
    confirmada: "Confirmada",
    completada: "Completada",
    cancelada: "Cancelada",
  };
  return `<span class="pill pill-${estado}">${etiquetas[estado] || estado}</span>`;
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
