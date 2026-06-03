// AORIS STUDIOS - Jefe Vacaciones Module

import { EMPS, EMP_COLORS } from './config.js';
import { obtenerSolicitudes, obtenerPendientes, obtenerAprobadas, obtenerSaldo } from './vacaciones.js';
import { enviarMarquilla } from './api.js';

let accionEnProceso = null; // { id, tipo: 'aprobar'|'rechazar' }

/**
 * Cambiar entre tabs del panel jefe
 */
export function cambiarTabJefe(tab) {
  // Actualizar estado
  window.jF = window.jF || { fecha: 'semana', emp: 'todos', est: 'todos', tab: 'asistencia' };
  window.jF.tab = tab;

  // Ocultar/mostrar contenido
  document.querySelectorAll('[id^="tab-"]').forEach(el => {
    el.style.display = el.id === 'tab-' + tab + '-content' ? 'block' : 'none';
  });

  // Actualizar botones
  document.querySelectorAll('.tab-btn').forEach(btn => {
    const tabBtn = btn;
    const isActive = btn.textContent.includes(
      tab === 'asistencia' ? '📊' : tab === 'vacaciones' ? '🏖️' : '📅'
    );
    if (isActive) {
      tabBtn.classList.add('active');
    } else {
      tabBtn.classList.remove('active');
    }
  });

  // Renderizar contenido
  if (tab === 'vacaciones') {
    renderPanelVacaciones();
  } else if (tab === 'feriados') {
    // Renderizar feriados
  }
}

/**
 * Renderizar panel de vacaciones
 */
export function renderPanelVacaciones() {
  // Actualizar estadísticas
  const solicitudes = obtenerSolicitudes();
  const pendientes = obtenerPendientes().length;
  const aprobadas = obtenerAprobadas().length;

  document.getElementById('vac-pendientes').textContent = pendientes;
  document.getElementById('vac-aprobadas').textContent = aprobadas;
  document.getElementById('vac-saldo').textContent = Object.values({ Ronald: 15, Brandon: 15, Mathias: 15 })
    .reduce((a, b) => a + b, 0);

  // Renderizar tabla
  actualizarTablaVacaciones();

  // Renderizar saldos
  renderSaldos();
}

/**
 * Actualizar tabla de solicitudes
 */
export function actualizarTablaVacaciones() {
  const filtroEmp = document.getElementById('vac-filtro-emp')?.value || 'todos';
  const filtroEstado = document.getElementById('vac-filtro-estado')?.value || 'todos';
  const tbody = document.getElementById('vac-tbody');

  if (!tbody) return;

  let solicitudes = obtenerSolicitudes();

  // Filtrar por empleado
  if (filtroEmp !== 'todos') {
    solicitudes = solicitudes.filter(s => s.empleado === filtroEmp);
  }

  // Filtrar por estado
  if (filtroEstado !== 'todos') {
    solicitudes = solicitudes.filter(s => s.estado === filtroEstado);
  }

  if (solicitudes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="padding: 20px; text-align: center; color: #999;">Sin solicitudes</td></tr>';
    return;
  }

  let html = '';
  solicitudes.forEach(sol => {
    const color = EMP_COLORS[sol.empleado] || '#FFD600';
    const badgeClass = sol.estado === 'Pendiente' ? 'vac-estado-pendiente' :
      sol.estado === 'Aprobada' ? 'vac-estado-aprobada' : 'vac-estado-rechazada';

    html += `<tr>
      <td style="padding: 12px 8px; font-weight: 700; border-bottom: 1px solid #eee;">${sol.empleado}</td>
      <td style="padding: 12px 8px; text-align: center; border-bottom: 1px solid #eee;">${sol.fechaInicio}</td>
      <td style="padding: 12px 8px; text-align: center; border-bottom: 1px solid #eee;">${sol.fechaFin}</td>
      <td style="padding: 12px 8px; text-align: center; border-bottom: 1px solid #eee;"><strong>${sol.diasUsados}</strong></td>
      <td style="padding: 12px 8px; text-align: center; border-bottom: 1px solid #eee;">
        <span class="vac-estado-badge ${badgeClass}">${sol.estado}</span>
      </td>
      <td style="padding: 12px 8px; text-align: center; border-bottom: 1px solid #eee;">
        ${sol.estado === 'Pendiente' ? `
          <button class="vac-btn-accion vac-btn-aprobar" onclick="abrirModalAprobacionVac('${sol.id}', '${sol.empleado}', '${sol.fechaInicio}', '${sol.fechaFin}')">✅ Aprobar</button>
          <button class="vac-btn-accion vac-btn-rechazar" onclick="abrirModalRechazoVac('${sol.id}', '${sol.empleado}')">❌ Rechazar</button>
        ` : `—`}
      </td>
    </tr>`;
  });

  tbody.innerHTML = html;
}

/**
 * Abrir modal de aprobación
 */
export function abrirModalAprobacionVac(id, empleado, fechaInicio, fechaFin) {
  accionEnProceso = { id, tipo: 'aprobar' };

  const modal = document.getElementById('modal-vac-accion');
  document.getElementById('modal-vac-accion-title').textContent = '✅ Aprobar Vacación';
  document.getElementById('modal-vac-accion-details').innerHTML = `
    <div style="margin-bottom: 10px;">
      <strong>${empleado}</strong><br>
      <span style="font-size: 13px; color: #666;">
        ${fechaInicio} → ${fechaFin}
      </span>
    </div>
  `;
  document.getElementById('modal-vac-razon').value = '';
  document.getElementById('modal-vac-razon').placeholder = 'Comentarios (opcional)';
  document.getElementById('btn-vac-accion-confirmar').style.background = '#4ADE80';
  document.getElementById('btn-vac-accion-confirmar').textContent = 'Aprobar';

  modal.style.display = 'flex';
}

/**
 * Abrir modal de rechazo
 */
export function abrirModalRechazoVac(id, empleado) {
  accionEnProceso = { id, tipo: 'rechazar' };

  const modal = document.getElementById('modal-vac-accion');
  document.getElementById('modal-vac-accion-title').textContent = '❌ Rechazar Solicitud';
  document.getElementById('modal-vac-accion-details').innerHTML = `
    <div style="margin-bottom: 10px;">
      <strong>${empleado}</strong><br>
      <span style="font-size: 13px; color: #999;">Solicitud de vacaciones</span>
    </div>
  `;
  document.getElementById('modal-vac-razon').placeholder = 'Razón del rechazo';
  document.getElementById('modal-vac-razon').value = '';
  document.getElementById('btn-vac-accion-confirmar').style.background = '#FF6B6B';
  document.getElementById('btn-vac-accion-confirmar').textContent = 'Rechazar';

  modal.style.display = 'flex';
}

/**
 * Cerrar modal de acción
 */
export function cerrarModalVacAccion() {
  document.getElementById('modal-vac-accion').style.display = 'none';
  accionEnProceso = null;
}

/**
 * Confirmar acción en vacaciones
 */
export function confirmarAccionVac() {
  if (!accionEnProceso) return;

  const razon = document.getElementById('modal-vac-razon').value.trim();
  const { id, tipo } = accionEnProceso;

  // Enviar a backend
  enviarMarquilla('admin', new Date().toISOString().split('T')[0], 'admin', 'vacacion_' + tipo, '', '', razon, '', {
    accion: tipo === 'aprobar' ? 'aprobarVacacion' : 'rechazarVacacion',
    id,
    razon,
    aprobadoPor: 'Jefe'
  });

  cerrarModalVacAccion();
  setTimeout(() => {
    renderPanelVacaciones();
  }, 500);
}

/**
 * Renderizar saldos por empleado
 */
export function renderSaldos() {
  const container = document.getElementById('vac-saldos-container');
  if (!container) return;

  let html = '';
  EMPS.forEach(emp => {
    const saldo = obtenerSaldo(emp);
    const color = EMP_COLORS[emp] || '#FFD600';

    html += `<div class="vac-saldo-card" style="background: linear-gradient(to right, ${color}20, #f5f5f5);">
      <div class="vac-saldo-avatar" style="background: ${color};">${emp.charAt(0)}</div>
      <div>
        <div style="font-size: 14px; font-weight: 800;">${emp}</div>
        <div style="font-size: 12px; color: #666;">${saldo} días disponibles</div>
      </div>
    </div>`;
  });

  container.innerHTML = html;
}

// Exportar funciones globales
export function crearNuevaVacacion() {
  // Modal para crear nueva solicitud (desde empleado)
  alert('Esta función se implementará en otra versión');
}
