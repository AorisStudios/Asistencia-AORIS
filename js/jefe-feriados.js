// AORIS STUDIOS - Jefe Feriados Module

import { obtenerFeriados, crearFeriado, editarFeriado, eliminarFeriado } from './feriados.js';
import { renderCalendario, renderLeyenda } from './calendario.js';
import { enviarMarquilla } from './api.js';
import { gmt5 } from './utils.js';

let feriadoEnEdicion = null;

/**
 * Renderizar panel de feriados
 */
export function renderPanelFeriados() {
  renderTablaFeriados();
  renderCalendarioFeriados();
}

/**
 * Renderizar tabla de feriados
 */
export function renderTablaFeriados() {
  const tbody = document.getElementById('fer-tbody');
  if (!tbody) return;

  const feriados = obtenerFeriados().sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

  if (feriados.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="padding: 20px; text-align: center; color: #999;">Sin feriados configurados</td></tr>';
    return;
  }

  let html = '';
  feriados.forEach(fer => {
    const tipoColor = fer.tipo === 'Nacional' ? '#4A9EFF' : '#FFBC6B';
    const laboralBadge = fer.esLaboral ?
      '<span style="background: #BDEFC4; color: #111; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 800;">Sí</span>' :
      '<span style="background: #FFB3B3; color: #fff; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 800;">No</span>';

    html += `<tr>
      <td style="padding: 12px 8px; font-weight: 700; border-bottom: 1px solid #eee;">${fer.fecha}</td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #eee;">${fer.nombre}</td>
      <td style="padding: 12px 8px; text-align: center; border-bottom: 1px solid #eee;">
        <span style="background: ${tipoColor}30; color: #111; padding: 4px 12px; border-radius: 8px; font-size: 12px; font-weight: 800;">
          ${fer.tipo}
        </span>
      </td>
      <td style="padding: 12px 8px; text-align: center; border-bottom: 1px solid #eee;">
        ${laboralBadge}
      </td>
      <td style="padding: 12px 8px; text-align: center; border-bottom: 1px solid #eee;">
        <button class="vac-btn-accion" style="background: #4A9EFF; color: #fff; margin-right: 4px;" onclick="editarFeriadoUI('${fer.fecha}', '${fer.nombre}', '${fer.tipo}', ${fer.esLaboral})">✏️ Editar</button>
        <button class="vac-btn-accion" style="background: #FF6B6B; color: #fff;" onclick="eliminarFeriadoUI('${fer.fecha}')">🗑️ Eliminar</button>
      </td>
    </tr>`;
  });

  tbody.innerHTML = html;
}

/**
 * Renderizar calendario de feriados
 */
export function renderCalendarioFeriados() {
  const container = document.getElementById('calendario-feriados');
  if (!container) return;

  const hoy = gmt5();
  const mes = hoy.getMonth() + 1;
  const anio = hoy.getFullYear();

  let html = `<div style="margin-bottom: 20px;">`;
  html += `<div style="font-weight: 800; font-size: 14px; margin-bottom: 15px;">📅 Feriados Próximos</div>`;
  html += `<div id="calendario-feriados-grid" style="background: #fff; padding: 15px; border-radius: 8px; border: 2px solid #111;"></div>`;
  html += `</div>`;

  container.innerHTML = html;

  const calContainer = document.getElementById('calendario-feriados-grid');
  renderCalendario(calContainer, mes, anio);
  renderLeyenda(container);
}

/**
 * Abrir modal para nuevo feriado
 */
export function abrirModalNuevoFeriado() {
  feriadoEnEdicion = null;
  document.getElementById('fer-fecha').value = '';
  document.getElementById('fer-nombre').value = '';
  document.getElementById('fer-tipo').value = 'Nacional';
  document.getElementById('fer-laboral').checked = true;
  document.getElementById('fer-fecha').focus();
  document.getElementById('modal-feriado').style.display = 'flex';
}

/**
 * Cerrar modal de feriado
 */
export function cerrarModalFeriado() {
  document.getElementById('modal-feriado').style.display = 'none';
  feriadoEnEdicion = null;
}

/**
 * Guardar nuevo feriado o editar existente
 */
export function guardarNuevoFeriado() {
  const fecha = document.getElementById('fer-fecha').value;
  const nombre = document.getElementById('fer-nombre').value.trim();
  const tipo = document.getElementById('fer-tipo').value;
  const esLaboral = document.getElementById('fer-laboral').checked;

  if (!fecha || !nombre) {
    alert('Por favor completa todos los campos');
    return;
  }

  if (feriadoEnEdicion) {
    // Editar existente
    editarFeriado(feriadoEnEdicion, fecha, nombre, tipo, '', esLaboral);
    enviarMarquilla('admin', new Date().toISOString().split('T')[0], 'admin', 'feriado_edit', '', '', '', '', {
      accion: 'editarFeriado',
      fechaOriginal: feriadoEnEdicion,
      fecha,
      nombre,
      tipo,
      esLaboral
    });
  } else {
    // Crear nuevo
    crearFeriado(fecha, nombre, tipo, '', esLaboral);
    enviarMarquilla('admin', new Date().toISOString().split('T')[0], 'admin', 'feriado_new', '', '', '', '', {
      accion: 'nuevoFeriado',
      fecha,
      nombre,
      tipo,
      esLaboral
    });
  }

  cerrarModalFeriado();
  renderPanelFeriados();
}

/**
 * Editar feriado (abre modal)
 */
export function editarFeriadoUI(fecha, nombre, tipo, esLaboral) {
  feriadoEnEdicion = fecha;
  document.getElementById('fer-fecha').value = fecha;
  document.getElementById('fer-nombre').value = nombre;
  document.getElementById('fer-tipo').value = tipo;
  document.getElementById('fer-laboral').checked = esLaboral;
  document.getElementById('modal-feriado').style.display = 'flex';
}

/**
 * Eliminar feriado
 */
export function eliminarFeriadoUI(fecha) {
  if (!confirm(`¿Eliminar el feriado del ${fecha}?`)) return;

  eliminarFeriado(fecha);
  enviarMarquilla('admin', new Date().toISOString().split('T')[0], 'admin', 'feriado_del', '', '', '', '', {
    accion: 'eliminarFeriado',
    fecha
  });

  renderPanelFeriados();
}

// Funciones globales
export function abrirModalNuevoFeriadoGlobal() {
  abrirModalNuevoFeriado();
}

export function guardarNuevoFeriadoGlobal() {
  guardarNuevoFeriado();
}

export function cerrarModalFeriadoGlobal() {
  cerrarModalFeriado();
}
