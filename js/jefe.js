// AORIS STUDIOS - Jefe (Admin) Module

import { JAVBG, JAVS, EMPLEADOS } from './config.js';
import { gmt5, fmtFecha, fmtHM, jFmtFecha, jHoras, getShiftHours, getAlmuerzoHoras } from './utils.js';
import { obtenerDatos } from './data.js';
import { setCalendario } from './calendario.js';
import { saldoDelDia, formatearSaldoCorto, horasTrabajadasTexto } from './horas.js';
import { enviarAccion } from './api.js';
import { mostrarToast } from './ui.js';

let jefeLogoClicks = 0;
let jefeLogoTimer = null;
let jF = { fecha: 'semana', emp: 'todos', est: 'todos' };
let jRefreshTimer = null;   // refresco automático mientras la vista está abierta
let jefeCierreTimer = null; // auto-cierre por inactividad

export function jefeLogoClick() {
  jefeLogoClicks++;
  clearTimeout(jefeLogoTimer);
  jefeLogoTimer = setTimeout(() => { jefeLogoClicks = 0; }, 2000);
  if (jefeLogoClicks >= 5) {
    jefeLogoClicks = 0;
    const ov = document.getElementById('jefe-pin-overlay');
    if (ov) {
      document.getElementById('jefe-pin-inp').value = '';
      document.getElementById('jefe-pin-err').style.display = 'none';
      ov.classList.add('show');
      setTimeout(() => document.getElementById('jefe-pin-inp').focus(), 100);
    }
  }
}

export function verificarPinJefe(PIN) {
  const pin = document.getElementById('jefe-pin-inp').value.trim();
  if (pin !== PIN) {
    document.getElementById('jefe-pin-err').style.display = 'block';
    document.getElementById('jefe-pin-inp').value = '';
    return;
  }
  document.getElementById('jefe-pin-overlay').classList.remove('show');
  document.getElementById('jefe-overlay').classList.add('show');
  jRender();
  // Refrescar los registros cada 30s mientras la vista esté abierta
  clearInterval(jRefreshTimer);
  jRefreshTimer = setInterval(jRender, 30000);
  // Auto-cierre por inactividad a los 10 minutos
  clearTimeout(jefeCierreTimer);
  jefeCierreTimer = setTimeout(cerrarJefe, 10 * 60 * 1000);
}

export function cerrarJefe() {
  clearInterval(jRefreshTimer);
  clearTimeout(jefeCierreTimer);
  document.getElementById('jefe-overlay').classList.remove('show');
  cerrarDispositivo();
}

function jRowClass(r) {
  if (r.alerta && r.alerta.includes('🚨')) return 'jrow-alert';
  const h = jHoras(r.entrada, r.salida);
  if (h !== '—') {
    const hh = parseInt(h);
    const sh = getShiftHours(r.nombre);
    if (hh < sh - 0.5) return 'jrow-early';
  }
  return 'jrow-ok';
}

function jRender() {
  obtenerDatos().then(({ registros: filas, feriados, ausencias }) => {
    setCalendario(feriados, ausencias); // para calcular el saldo esperado del día
    const now = gmt5();
    const hoy = fmtFecha(now);
    let rows = filas.map(r => ({
      nombre: r.nombre,
      fecha: r.fecha,
      entrada: fmtHM(r.entrada),
      salida: fmtHM(r.salida),
      dispEntrada: r.dispEntrada,
      dispSalida: r.dispSalida,
      alerta: r.alerta
    }));
    const semana = [];
    for (let i = 0; i < 7; i++) { const d = new Date(now); d.setDate(d.getDate() - i); semana.push(fmtFecha(d)); }
    if (jF.fecha === 'hoy') rows = rows.filter(r => r.fecha === hoy);
    else if (jF.fecha === 'semana') rows = rows.filter(r => semana.includes(r.fecha));
    if (jF.emp !== 'todos') rows = rows.filter(r => r.nombre === jF.emp);
    if (jF.est === 'ok') rows = rows.filter(r => !r.alerta.includes('🚨'));
    if (jF.est === 'alerta') rows = rows.filter(r => r.alerta.includes('🚨'));
    rows.reverse();
    document.getElementById('jresults').textContent = rows.length + ' registro' + (rows.length !== 1 ? 's' : '');
    const tb = document.getElementById('jefe-tbody');
    if (!rows.length) { tb.innerHTML = `<tr><td colspan="8" class="jefe-empty-row">Sin registros</td></tr>`; return; }

    // Agrupar por fecha y agregar separadores visuales
    let html = '';
    let fechaActual = null;
    let bgAlterno = false;

    rows.forEach((r) => {
      // Agregar separador de fecha si cambió
      if (r.fecha !== fechaActual) {
        fechaActual = r.fecha;
        bgAlterno = !bgAlterno;
        html += `<tr style="background:${bgAlterno ? 'rgba(255,214,0,0.08)' : 'rgba(255,255,255,0.02)'}"><td colspan="8" style="padding:12px 16px;font-size:13px;font-weight:800;color:#FFD600;border:none;">📅 ${jFmtFecha(r.fecha)}</td></tr>`;
      }

      const rc = jRowClass(r);
      const h = jHoras(r.entrada, r.salida);
      const hc = rc === 'jrow-alert' ? '#FF6B6B' : rc === 'jrow-early' ? '#FFB347' : h.includes('turno') ? '#FFD600' : '#4ADE80';
      const sb = rc === 'jrow-early' ? 'jbdg-o' : rc === 'jrow-alert' ? 'jbdg-r' : 'jbdg-g';
      const ab = r.alerta.includes('🚨') ? 'jbdg-r' : r.alerta.includes('Sin') ? 'jbdg-x' : 'jbdg-g';
      const at = r.alerta.includes('🚨') ? '🚨 Alerta' : r.alerta.includes('Sin') ? '✅ Libre' : '✅ OK';
      const avHtml = JAVS[r.nombre] || '';
      const avBg = JAVBG[r.nombre] || '#eee';
      const salidaHtml = r.salida ? `<span class="jbdg ${sb}">${r.salida}</span>` : '<span class="jbdg jbdg-x">En turno</span>';
      let horasHtml;
      if (h === '—') {
        horasHtml = '<span style="color:#FFD600;font-weight:800;">En turno 🟡</span>';
      } else {
        const sc = formatearSaldoCorto(saldoDelDia(r.nombre, r.fecha, r.entrada, r.salida, getShiftHours(r.nombre)));
        const scColor = sc.tipo === 'favor' ? '#4ADE80' : sc.tipo === 'pendiente' ? '#FF6B6B' : '#888';
        const hNet = horasTrabajadasTexto(r.entrada, r.salida, getAlmuerzoHoras(r.nombre)); // horas trabajadas netas (sin almuerzo)
        horasHtml = `<span style="font-weight:800;color:${hc};">${hNet}</span> <span style="font-size:11px;font-weight:800;color:${scColor};">${sc.texto}</span>`;
      }
      const bgRow = bgAlterno ? 'rgba(255,214,0,0.08)' : 'rgba(255,255,255,0.02)';

      // Botones de dispositivo entrada y salida
      const btnEntrada = r.dispEntrada ? `<button class="jdisp-btn" data-tipo="entrada" data-dispositivo="${r.dispEntrada.replace(/"/g, '&quot;')}">🖥️ Ent</button>` : '<button class="jdisp-btn" style="opacity:0.4;cursor:not-allowed;" disabled>🖥️ Ent</button>';
      const btnSalida = r.dispSalida ? `<button class="jdisp-btn" data-tipo="salida" data-dispositivo="${r.dispSalida.replace(/"/g, '&quot;')}">🖥️ Sal</button>` : '<button class="jdisp-btn" style="opacity:0.4;cursor:not-allowed;" disabled>🖥️ Sal</button>';
      const dispHtml = `<div style="display:flex;gap:6px;">${btnEntrada}${btnSalida}</div>`;

      html += `<tr class="${rc}" style="background:${bgRow}"><td><div class="jemp-cell"><div class="jav-sm" style="background:${avBg};border:2px solid #444;">${avHtml}</div><span class="jemp-name">${r.nombre}</span></div></td><td><span class="jbdg jbdg-g">${r.entrada || '—'}</span></td><td>${salidaHtml}</td><td>${horasHtml}</td><td>${dispHtml}</td><td><span class="jbdg ${ab}">${at}</span></td></tr>`;
    });

    tb.innerHTML = html;
  }).catch(() => { document.getElementById('jefe-tbody').innerHTML = `<tr><td colspan="8" class="jefe-empty-row">❌ Error al cargar</td></tr>`; });
}

export function mostrarDispositivo(boton, tipo = 'entrada') {
  const dispositivo = boton.getAttribute('data-dispositivo');

  // Cerrar si ya existe un popover abierto
  const popoverExistente = document.getElementById('disp-popover');
  if (popoverExistente) {
    popoverExistente.remove();
    return;
  }

  // Parsear dispositivo y extraer ISP
  const lineas = dispositivo.split(' · ');
  let isp = '—';
  let gpu = lineas[0] || '—';
  let cores = lineas[1] || '—';
  let ram = lineas[2] || '—';
  let so = lineas[3] || '—';
  let res = lineas[4] || '—';
  let nav = lineas[5] || '—';

  // Buscar ISP en la última línea (formato: "ISP: nombre")
  if (lineas[6] && lineas[6].includes('ISP:')) {
    isp = lineas[6].replace('ISP:', '').trim();
  }

  const items = {
    '📍 ISP': isp,
    'GPU': gpu,
    'Cores': cores,
    'RAM': ram,
    'SO': so,
    'Res': res,
    'Nav': nav
  };

  let html = '';
  for (const [label, value] of Object.entries(items)) {
    html += `<div style="display:flex;justify-content:space-between;padding:4px 0;color:#ddd;"><span style="font-size:12px;color:#aaa;text-transform:capitalize;min-width:60px;">${label}</span><span style="font-size:13px;font-weight:800;color:#FFD600;text-align:right;flex:1;">${value}</span></div>`;
  }

  const popover = document.createElement('div');
  popover.id = 'disp-popover';

  // Obtener posición del botón
  const rect = boton.getBoundingClientRect();
  let top = rect.top + window.scrollY;
  let left = rect.right + 8;

  // Si se sale por la derecha, posicionar a la izquierda (pegado al botón)
  if (left + 300 > window.innerWidth) {
    left = rect.left - 300 - 8;
  }

  popover.style.cssText = `
    position: absolute;
    top: ${top}px;
    left: ${left}px;
    background: #0A1628;
    border: 3px solid #FFD600;
    border-radius: 12px;
    padding: 20px;
    width: 300px;
    z-index: 500;
    box-shadow: 0 8px 32px rgba(255, 214, 0, 0.2);
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
  `;

  const tituloTipo = tipo === 'entrada' ? 'Dispositivo Entrada' : 'Dispositivo Salida';
  popover.innerHTML = `
    <div style="margin-bottom:16px;">
      <span style="font-size:14px;font-weight:800;color:#FFD600;text-transform:uppercase;">${tituloTipo}</span>
    </div>
    <div>${html}</div>
  `;

  document.body.appendChild(popover);

  // Trigger animation
  requestAnimationFrame(() => {
    popover.style.opacity = '1';
  });

  // Cerrar popover al hacer clic fuera
  const cerrarAlClickFuera = (e) => {
    if (!popover.contains(e.target) && e.target !== boton) {
      cerrarDispositivo();
      document.removeEventListener('click', cerrarAlClickFuera);
    }
  };
  document.addEventListener('click', cerrarAlClickFuera);
}

export function cerrarDispositivo() {
  const popover = document.getElementById('disp-popover');
  if (popover) popover.remove();
}


// ===================== Panel de ausencias (vista de jefe) =====================

function ddmmaaaa(isoDate) {
  // 'yyyy-mm-dd' (input date) -> 'dd/mm/yyyy'
  const p = (isoDate || '').split('-');
  if (p.length !== 3) return '';
  return p[2] + '/' + p[1] + '/' + p[0];
}

export function abrirAusencias() {
  // Llenar el selector de empleados
  const sel = document.getElementById('aus-empleado');
  if (sel) sel.innerHTML = EMPLEADOS.map(e => '<option value="' + e.nombre + '">' + e.nombre + '</option>').join('');
  document.getElementById('ausencias-overlay').classList.add('show');
  cargarPanel();
}

export function cerrarAusencias() {
  document.getElementById('ausencias-overlay').classList.remove('show');
}

function cargarPanel() {
  const cont = document.getElementById('aus-lista');
  if (cont) cont.innerHTML = '<div class="aus-vacio">Cargando…</div>';
  obtenerDatos().then(({ ausencias, feriados }) => { renderListaAusencias(ausencias || []); renderListaFeriados(feriados || []); })
    .catch(() => { if (cont) cont.innerHTML = '<div class="aus-vacio">❌ Error al cargar</div>'; });
}

function renderListaAusencias(ausencias) {
  const cont = document.getElementById('aus-lista');
  if (!cont) return;
  if (!ausencias.length) { cont.innerHTML = '<div class="aus-vacio">Sin ausencias registradas</div>'; return; }
  let html = '';
  ausencias.forEach(a => {
    const horas = (a.horas !== null && a.horas !== '' && Number(a.horas) > 0) ? (a.horas + 'h') : 'día completo';
    const est = String(a.estado).toLowerCase();
    const estClase = est === 'aprobada' ? 'aus-ok' : est === 'rechazada' ? 'aus-no' : 'aus-pend';
    html += '<div class="aus-item">' +
      '<div class="aus-item-info">' +
        '<div class="aus-item-top"><b>' + a.empleado + '</b> · ' + a.tipo + ' · <span class="' + estClase + '">' + a.estado + '</span></div>' +
        '<div class="aus-item-sub">' + a.desde + ' → ' + a.hasta + ' · ' + horas + (a.motivo ? ' · ' + a.motivo : '') + '</div>' +
      '</div>' +
      '<div class="aus-item-btns">' +
        (est !== 'aprobada' ? '<button class="aus-accion aus-b-ok" data-fila="' + a.fila + '" data-emp="' + a.empleado + '" data-accion="Aprobada">✔</button>' : '') +
        (est !== 'rechazada' ? '<button class="aus-accion aus-b-no" data-fila="' + a.fila + '" data-emp="' + a.empleado + '" data-accion="Rechazada">✖</button>' : '') +
        '<button class="aus-accion aus-b-del" data-fila="' + a.fila + '" data-emp="' + a.empleado + '" data-accion="eliminar">🗑</button>' +
      '</div>' +
    '</div>';
  });
  cont.innerHTML = html;
}

export function crearAusencia() {
  const empleado = document.getElementById('aus-empleado').value;
  const desde = ddmmaaaa(document.getElementById('aus-desde').value);
  const hastaRaw = document.getElementById('aus-hasta').value;
  const hasta = hastaRaw ? ddmmaaaa(hastaRaw) : desde;
  const tipo = document.getElementById('aus-tipo').value;
  const horas = document.getElementById('aus-horas').value;
  const motivo = document.getElementById('aus-motivo').value;
  if (!empleado || !desde) { mostrarToast('⚠️ Elige empleado y fecha de inicio.'); return; }

  enviarAccion({ accion: 'crearAusencia', empleado, desde, hasta, tipo, horas, estado: 'Aprobada', motivo })
    .then(() => {
      mostrarToast('✅ Ausencia agregada.');
      document.getElementById('aus-horas').value = '';
      document.getElementById('aus-motivo').value = '';
      cargarPanel();
    })
    .catch(err => mostrarToast('❌ ' + err.message));
}

export function accionAusencia(fila, empleado, accion) {
  const payload = accion === 'eliminar'
    ? { accion: 'eliminarAusencia', fila, empleado }
    : { accion: 'estadoAusencia', fila, empleado, estado: accion };
  enviarAccion(payload)
    .then(() => { mostrarToast('✅ Actualizado.'); cargarPanel(); })
    .catch(err => mostrarToast('❌ ' + err.message));
}


// ===================== Panel de feriados (vista de jefe) =====================

function renderListaFeriados(feriados) {
  const cont = document.getElementById('fer-lista');
  if (!cont) return;
  if (!feriados.length) { cont.innerHTML = '<div class="aus-vacio">Sin feriados</div>'; return; }
  let html = '';
  feriados.forEach(f => {
    const lab = f.esLaboral ? '<span class="aus-pend">laborable</span>' : '<span class="aus-ok">descanso</span>';
    html += '<div class="aus-item"><div class="aus-item-info">' +
      '<div class="aus-item-top"><b>' + f.fecha + '</b> · ' + (f.nombre || '') + '</div>' +
      '<div class="aus-item-sub">' + lab + '</div></div>' +
      '<div class="aus-item-btns"><button class="aus-accion aus-b-del fer-accion" data-fila="' + f.fila + '">🗑</button></div>' +
    '</div>';
  });
  cont.innerHTML = html;
}

export function crearFeriado() {
  const fecha = ddmmaaaa(document.getElementById('fer-fecha').value);
  const nombre = document.getElementById('fer-nombre').value;
  const esLaboral = document.getElementById('fer-laboral').checked;
  if (!fecha) { mostrarToast('⚠️ Elige la fecha del feriado.'); return; }
  enviarAccion({ accion: 'crearFeriado', fecha, nombre, esLaboral })
    .then(() => { mostrarToast('✅ Feriado agregado.'); document.getElementById('fer-nombre').value = ''; cargarPanel(); })
    .catch(err => mostrarToast('❌ ' + err.message));
}

export function eliminarFeriado(fila) {
  enviarAccion({ accion: 'eliminarFeriado', fila })
    .then(() => { mostrarToast('✅ Feriado eliminado.'); cargarPanel(); })
    .catch(err => mostrarToast('❌ ' + err.message));
}
