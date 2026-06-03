// AORIS STUDIOS - Jefe (Admin) Module

import { CSV_URL } from './config.js';
import { gmt5, fmtFecha, jFmtFecha, jHoras, parseCSVLine } from './utils.js';
import { JAVBG, JAVS } from './config.js';

let jefeLogoClicks = 0;
let jefeLogoTimer = null;
let jF = { fecha: 'hoy', emp: 'todos', est: 'todos' };

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
  setTimeout(cerrarJefe, 10 * 60 * 1000);
}

export function cerrarJefe() {
  document.getElementById('jefe-overlay').classList.remove('show');
  cerrarDispositivo();
}

function jRowClass(r) {
  if (r.alerta && r.alerta.includes('🚨')) return 'jrow-alert';
  const h = jHoras(r.entrada, r.salida);
  if (h !== '—') {
    const hh = parseInt(h);
    const sh = r.nombre === 'Mathias' ? 9 : 7.5;
    if (hh < sh - 0.5) return 'jrow-early';
  }
  return 'jrow-ok';
}

function jRender() {
  fetch(CSV_URL + '&t=' + Date.now()).then(r => r.text()).then(csv => {
    const lineas = csv.trim().split('\n').slice(1);
    const now = gmt5();
    const hoy = fmtFecha(now);
    let rows = [];
    lineas.forEach(l => {
      const col = parseCSVLine(l);
      const nombre = (col[1] || '').trim().replace(/"/g, '');
      const fecha = (col[2] || '').trim().replace(/"/g, '');
      const entrada = (col[3] || '').trim().replace(/"/g, '');
      const salida = (col[4] || '').trim().replace(/"/g, '');
      const isp = (col[6] || '').trim().replace(/"/g, '');
      const disp = (col[7] || '').trim().replace(/"/g, '');
      const alerta = (col[8] || '').trim().replace(/"/g, '');
      if (!nombre || !entrada) return;
      // Formatear hora correctamente (HH:MM)
      const entradaFmt = entrada.length >= 5 ? entrada.slice(0, 5) : entrada;
      const salidaFmt = salida.length >= 5 ? salida.slice(0, 5) : salida;
      rows.push({ nombre, fecha, entrada: entradaFmt, salida: salidaFmt, isp, disp, alerta });
    });
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
    tb.innerHTML = rows.map((r, i) => {
      const rc = jRowClass(r);
      const h = jHoras(r.entrada, r.salida);
      const hc = rc === 'jrow-alert' ? '#FF6B6B' : rc === 'jrow-early' ? '#FFB347' : h.includes('turno') ? '#FFD600' : '#4ADE80';
      const sb = rc === 'jrow-early' ? 'jbdg-o' : rc === 'jrow-alert' ? 'jbdg-r' : 'jbdg-g';
      const ab = r.alerta.includes('🚨') ? 'jbdg-r' : r.alerta.includes('Sin') ? 'jbdg-x' : 'jbdg-g';
      const at = r.alerta.includes('🚨') ? '🚨 Alerta' : r.alerta.includes('Sin') ? '✅ Libre' : '✅ OK';
      const avHtml = JAVS[r.nombre] || '';
      const avBg = JAVBG[r.nombre] || '#eee';
      const salidaHtml = r.salida ? `<span class="jbdg ${sb}">${r.salida}</span>` : '<span class="jbdg jbdg-x">En turno</span>';
      const horasHtml = h === '—' ? '<span style="color:#FFD600;font-weight:800;">En turno 🟡</span>' : `<span style="font-weight:800;color:${hc};">${h}</span>`;
      return `<tr class="${rc}"><td><div class="jemp-cell"><div class="jav-sm" style="background:${avBg};border:2px solid #444;">${avHtml}</div><span class="jemp-name">${r.nombre}</span></div></td><td style="color:#bbb;">${jFmtFecha(r.fecha)}</td><td><span class="jbdg jbdg-g">${r.entrada || '—'}</span></td><td>${salidaHtml}</td><td>${horasHtml}</td><td style="font-size:11px;">${r.isp || '—'}</td><td><button class="jdisp-btn" onclick="mostrarDispositivo(this)" data-dispositivo="${(r.disp || '—').replace(/"/g, '&quot;')}">🖥️ ver</button></td><td><span class="jbdg ${ab}">${at}</span></td></tr>`;
    }).join('');
  }).catch(() => { document.getElementById('jefe-tbody').innerHTML = `<tr><td colspan="8" class="jefe-empty-row">❌ Error al cargar</td></tr>`; });
}

export function mostrarDispositivo(boton) {
  const dispositivo = boton.getAttribute('data-dispositivo');

  // Cerrar si ya existe un popover abierto
  const popoverExistente = document.getElementById('disp-popover');
  if (popoverExistente) {
    popoverExistente.remove();
    return;
  }

  const lineas = dispositivo.split(' · ');
  const items = {
    'GPU': lineas[0] || '—',
    'Cores': lineas[1] || '—',
    'RAM': lineas[2] || '—',
    'SO': lineas[3] || '—',
    'Res': lineas[4] || '—',
    'Nav': lineas[5] || '—'
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

  popover.innerHTML = `
    <div style="margin-bottom:16px;">
      <span style="font-size:14px;font-weight:800;color:#FFD600;text-transform:uppercase;">Dispositivo</span>
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
