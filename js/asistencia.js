// AORIS STUDIOS - Asistencia (Attendance) Module

import { EMPLEADOS, EMPS, AVS, AVBG, EMP_COLORS, MENSAJES_ANTICIPADA, MENSAJES_TARDIA } from './config.js';
import { fmt, gmt5, fmtHM, fmtFecha, addH, getShiftHours, calcPct, calcEta, segundosRestantes, minutosTemprano, textoTemprano, shadeColor } from './utils.js';
import { sonidoEntrada, sonidoSalida } from './audio.js';
import { estado, guardarLocal } from './storage.js';
import * as authModule from './auth.js';
import { enviarMarquilla } from './api.js';
import { obtenerDatos } from './data.js';
import { setCalendario } from './calendario.js';
import { mostrarToast } from './ui.js';

export function updateProgress(nombre) {
  const d = estado[nombre];
  const fill = document.getElementById('prog-fill-' + nombre);
  const pctEl = document.getElementById('prog-pct-' + nombre);
  const etaEl = document.getElementById('prog-eta-' + nombre);
  if (!fill || !pctEl || !etaEl) return;

  if (!d || !d.entrada) {
    fill.style.width = '0%';
    pctEl.textContent = '';
    etaEl.textContent = '';
    return;
  }

  const pct = calcPct(d.entrada, nombre);
  fill.style.width = pct + '%';
  const ec = EMP_COLORS[nombre] || '#FFD600';
  fill.style.background = 'repeating-linear-gradient(90deg,' + ec + ' 0px,' + ec + ' 16px,' + shadeColor(ec, -15) + ' 16px,' + shadeColor(ec, -15) + ' 20px)';
  pctEl.textContent = pct + '%';
  etaEl.textContent = calcEta(d.entrada, nombre);
}

export function refTabla() {
  // Actualizar tarjetas individuales
  EMPS.forEach(n => {
    const d = estado[n];
    const e = document.getElementById('tr-' + n + '-e');
    const p = document.getElementById('tr-' + n + '-p');
    const s = document.getElementById('tr-' + n + '-s');
    const st = document.getElementById('st-' + n);
    const card = document.getElementById('emp-' + n);

    if (d && d.entrada) {
      if (e) { e.textContent = fmtHM(d.entrada); e.className = 'ao-bdg in'; e.style.display = ''; }
      if (p) { p.textContent = fmtHM(addH(d.entrada, getShiftHours(n))); p.className = 'ao-bdg out'; p.style.display = ''; }
      if (d.salida) {
        if (st) { st.textContent = '✓ Completo'; st.style.color = '#4ADE80'; st.style.fontWeight = '700'; }
        if (card) card.classList.add('done');
        const mins = minutosTemprano(d.entrada, d.salida, n);
        if (s) s.innerHTML = mins > 0 ? `<span class="ao-bdg hora-temprano">${fmtHM(d.salida)}</span>` : `<span class="ao-bdg in">${fmtHM(d.salida)}</span>`;
      } else {
        if (s) s.innerHTML = '<span class="ao-bdg" style="opacity:0.5;cursor:not-allowed;pointer-events:none;">---</span>';
        if (st) { st.textContent = 'Entrada marcada'; st.style.color = ''; }
        if (card) card.classList.remove('done');
      }
    } else {
      if (e) { e.textContent = ''; e.style.display = 'none'; }
      if (p) { p.textContent = ''; p.style.display = 'none'; }
      if (s) s.innerHTML = '';
      if (st) { st.textContent = 'Sin registro hoy'; st.style.color = ''; }
      if (card) card.classList.remove('done');
    }
  });

  // Llenar tabla "ESTADO DEL DÍA"
  const tbody = document.getElementById('estado-tbody');
  if (tbody) {
    let html = '';
    EMPS.forEach(n => {
      const d = estado[n];
      const avBg = AVBG[n] || '#eee';
      const avSvg = AVS[n] || '';
      const entradaHtml = d && d.entrada ? `<span class="ao-bdg in">${fmtHM(d.entrada)}</span>` : '';
      const saleHtml = d && d.entrada ? `<span class="ao-bdg out">${fmtHM(addH(d.entrada, getShiftHours(n)))}</span>` : '';
      let salidaHtml = '';
      if (d && d.salida) {
        const mins = minutosTemprano(d.entrada, d.salida, n);
        salidaHtml = mins > 0 ? `<span class="ao-bdg hora-temprano">${fmtHM(d.salida)}</span>` : `<span class="ao-bdg in">${fmtHM(d.salida)}</span>`;
      } else {
        salidaHtml = `<span class="ao-bdg" style="opacity:0.5;cursor:not-allowed;pointer-events:none;">---</span>`;
      }
      html += `<tr>
        <td style="border-bottom:none;padding:10px 16px 4px;vertical-align:middle;">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:34px;height:34px;border-radius:50%;border:2px solid #111;overflow:hidden;display:flex;align-items:center;justify-content:center;background:${avBg};flex-shrink:0;">${avSvg}</div>
            <span style="font-size:14px;font-weight:800;color:var(--txt);">${n}</span>
          </div>
        </td>
        <td style="border-bottom:none;padding:10px 16px 4px;text-align:center;">${entradaHtml}</td>
        <td style="border-bottom:none;padding:10px 16px 4px;text-align:center;">${saleHtml}</td>
        <td style="border-bottom:none;padding:10px 16px 4px;text-align:center;">${salidaHtml}</td>
      </tr>`;
    });
    tbody.innerHTML = html;
  }

  EMPS.forEach(updateProgress);
}

export function cargarDesdeSheet() {
  const hoy = fmtFecha(gmt5());
  obtenerDatos()
    .then(({ registros, feriados, ausencias }) => {
      setCalendario(feriados, ausencias); // refrescar feriados/ausencias

      // Lectura vacía: probable lectura fallida o desactualizada -> no tocar el estado local
      if (!registros.length) { refTabla(); return; }

      const GRACIA_MS = 5 * 60 * 1000; // protege marcas recién hechas (retraso de publicación del Sheet)
      const ahora = Date.now();

      // Registros de HOY indexados por empleado
      const hoyPorNombre = {};
      registros.forEach(r => { if (r.fecha === hoy) hoyPorNombre[r.nombre] = r; });

      // El Sheet es la fuente de verdad: añade, actualiza y QUITA lo que ya no está.
      EMPS.forEach(nombre => {
        const local = estado[nombre];
        const reciente = local && local._marcadoEn && (ahora - local._marcadoEn) < GRACIA_MS;
        if (reciente) return; // respetar una marca local reciente (puede no estar publicada aún)

        const enSheet = hoyPorNombre[nombre];
        if (enSheet) {
          estado[nombre] = {
            entrada: enSheet.entrada || null,
            salida: enSheet.salida || null,
            temprano: enSheet.temprano || ''
          };
        } else {
          delete estado[nombre]; // ya no está en el Sheet -> limpiar la tarjeta
        }
      });

      guardarLocal();
      refTabla();
    })
    .catch(() => {}); // lectura fallida -> conservar el estado local
}

export function ejecutarMarca(tipo, hora) {
  const cur = authModule.cur;
  if (!estado[cur]) estado[cur] = {};
  estado[cur][tipo] = hora;
  estado[cur]._marcadoEn = Date.now(); // sello local para la ventana de gracia

  let temprano = 0;
  let tempranoTexto = '';
  const fecha = fmtFecha(gmt5());
  const fp = authModule.getCurFP();
  const alerta = authModule.getCurValidation(cur).alerta;
  const dispositivo = authModule.getCurDeviceInfo();

  if (tipo === 'entrada') {
    sonidoEntrada();
  } else {
    sonidoSalida();
    temprano = minutosTemprano(estado[cur].entrada, hora, cur);
    tempranoTexto = temprano > 0 ? `faltaron ${textoTemprano(temprano)}` : '';
    estado[cur].temprano = tempranoTexto;
  }

  // Enviar al servidor y avisar si el guardado falló (p. ej. sin conexión).
  enviarMarquilla(cur, fecha, hora, tipo, dispositivo, alerta, tempranoTexto, fp)
    .catch((err) => {
      console.error('No se pudo guardar la marca:', err);
      mostrarToast('⚠️ No se pudo guardar la marca. Revisa tu conexión e inténtalo de nuevo.');
    });

  guardarLocal();
  refTabla();
  mostrarModalConfirm(tipo, cur, hora, temprano);
}

export function mostrarModalConfirm(tipo, nombre, hora, temprano) {
  document.getElementById('modal-av').innerHTML = AVS[nombre];
  document.getElementById('modal-av').style.background = AVBG[nombre];

  if (tipo === 'entrada') {
    const sale = addH(hora, getShiftHours(nombre));
    document.getElementById('modal-title').textContent = '¡Bienvenido, ' + nombre + '! 🎉';
    document.getElementById('modal-sub').textContent = 'Tu entrada ha sido registrada correctamente.';
    document.getElementById('modal-cards').innerHTML =
      `<div class="ao-modal-card y"><div class="ao-modal-clbl">Hora de entrada</div><div class="ao-modal-cval">${fmtHM(hora)}</div></div>` +
      `<div class="ao-modal-card g"><div class="ao-modal-clbl">Sales a las</div><div class="ao-modal-cval">${fmtHM(sale)}</div></div>`;
  } else {
    document.getElementById('modal-title').textContent = '¡Hasta mañana, ' + nombre + '! 👋';
    document.getElementById('modal-sub').textContent = temprano > 0 ? `Saliste ${textoTemprano(temprano)} antes de lo previsto.` : 'Tu salida ha sido registrada. ¡Buen descanso!';
    document.getElementById('modal-cards').innerHTML =
      `<div class="ao-modal-card r"><div class="ao-modal-clbl">Hora de salida</div><div class="ao-modal-cval">${fmtHM(hora)}</div></div>`;
  }

  document.getElementById('overlay-confirm').classList.add('show');
}

export function mostrarModalRazon(hora, nombre, esAnticipada) {
  if (esAnticipada) {
    document.getElementById('modal-anticipada').classList.add('show');
  } else {
    document.getElementById('modal-tardia').classList.add('show');
  }
}

export function lanzarConfetti() {
  const modal = document.getElementById('bye-modal-inner');
  const colores = ['#FFD600', '#BDEFC4', '#FF4444', '#4A9EFF', '#FFB347', '#C4A8FF'];
  for (let i = 0; i < 40; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + '%';
    piece.style.top = '-20px';
    piece.style.background = colores[Math.floor(Math.random() * colores.length)];
    piece.style.width = (6 + Math.random() * 8) + 'px';
    piece.style.height = (6 + Math.random() * 8) + 'px';
    piece.style.animationDuration = (1.5 + Math.random() * 2) + 's';
    piece.style.animationDelay = Math.random() * 0.5 + 's';
    modal.appendChild(piece);
    setTimeout(() => piece.remove(), 4000);
  }
}

export function elegirRazon(tipo, opcion, salidaHora, nombreEmpleado) {
  document.getElementById('modal-anticipada').classList.remove('show');
  document.getElementById('modal-tardia').classList.remove('show');

  const mensajes = tipo === 'anticipada' ? MENSAJES_ANTICIPADA : MENSAJES_TARDIA;
  const m = mensajes[opcion];
  const nombre = nombreEmpleado;

  const titulo = m.titulo.replace('{nombre}', nombre);
  const avatar = AVS[nombre] || '';
  const avbg = AVBG[nombre] || '#eee';

  document.getElementById('bye-avatar').innerHTML = avatar;
  document.getElementById('bye-avatar').style.background = avbg;
  document.getElementById('bye-title').textContent = titulo;
  document.getElementById('bye-msg').textContent = m.msg;

  const inner = document.getElementById('bye-modal-inner');
  if (m.confetti) {
    inner.style.background = '';
    lanzarConfetti();
  } else if (opcion === 3) {
    inner.style.background = '#E8F4FF';
  } else if (opcion === 4) {
    inner.style.background = '#FFF3E0';
  } else {
    inner.style.background = '';
  }

  document.getElementById('modal-bye').classList.add('show');
  ejecutarMarca('salida', salidaHora);
}

export function cerrarBye() {
  document.getElementById('modal-bye').classList.remove('show');
}

export function cerrarModalConfirm() {
  document.getElementById('overlay-confirm').classList.remove('show');
  authModule.setBtnMarca();
}

export function intentarMarcar() {
  if (!authModule.cur || !authModule.pinOk) return;

  const d = estado[authModule.cur];
  const tipo = (d && d.entrada) ? 'salida' : 'entrada';
  const hora = fmtHM(fmt(gmt5())); // guardar solo HH:MM (sin segundos)

  // La GPU ya está precalentada (warmUpGPU al cargar), no hace falta esperar.
  if (tipo === 'entrada') {
    ejecutarMarca('entrada', hora);
  } else {
    ejecutarMarca('salida', hora);
  }
}

// Construye las tarjetas de empleados desde EMPLEADOS (fuente única).
// Reemplaza el HTML que antes estaba hardcodeado en index.html.
export function renderTarjetasEmpleados() {
  const cont = document.getElementById('ao-employees');
  if (!cont) return;
  cont.innerHTML = EMPLEADOS.map((emp) => {
    const n = emp.nombre;
    const lower = n.toLowerCase();
    return `<div class="ao-emp" id="emp-${n}">
      <div class="ao-emp-hdr ao-emp-hdr-${lower}">
        <div class="ao-avatar" style="background:${emp.bgColor};">${emp.avatar}</div>
        <div class="ao-emp-name">${n}</div>
        <div class="ao-emp-st" id="st-${n}">Sin registro hoy</div>
        <div class="btn-historial" data-emp="${n}" data-color="${emp.color}">📊 Mi rendimiento</div>
      </div>
      <div class="ao-emp-body">
        <div class="ao-emp-times">
          <div class="ao-emp-time-box"><span class="ao-emp-time-lbl">🕘 Entrada</span><span class="ao-bdg none" id="tr-${n}-e"></span></div>
          <div class="ao-emp-time-box"><span class="ao-emp-time-lbl">🏁 Sale a las</span><span class="ao-bdg none" id="tr-${n}-p"></span></div>
          <div class="ao-emp-time-box"><span class="ao-emp-time-lbl">🚪 Salida</span><div id="tr-${n}-s"></div></div>
        </div>
        <div class="ao-emp-prog" id="prog-${n}">
          <div class="ao-emp-prog-lbl"><span id="prog-pct-${n}"></span><span id="prog-eta-${n}"></span></div>
          <div class="ao-emp-prog-row"><div class="ao-emp-prog-track"><div class="ao-emp-prog-fill" id="prog-fill-${n}" style="width:0%"></div></div><span class="ao-emp-prog-moon">🌕</span></div>
        </div>
      </div>
    </div>`;
  }).join('');
}
