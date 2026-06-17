// AORIS STUDIOS - Auth Module

import { PINS, EMPS, getEmpleado } from './config.js';
import { getDispositivoInfo, getFingerprint } from './fingerprint.js';
import { simpleHash, fmtFecha, gmt5 } from './utils.js';
import { salidaDisponible } from './reglas.js';
import { estaBloqueado } from './calendario.js';
import { mostrarToast } from './ui.js';
import { ipInfo } from './api.js';
import { sonidoError, sonidoPIN } from './audio.js';

export let cur = null;
export let pinOk = false;

export function validarPC(nombreEmpleado) {
  // La obligación de validar ISP viene del dato del empleado (validaISP)
  const emp = getEmpleado(nombreEmpleado);
  if (emp && emp.validaISP === false) return { ok: true, alerta: '✅ Sin restricciones' };

  const ispDetectado = (ipInfo.isp || '').toUpperCase();
  const ispOk = ispDetectado.includes('INTERCABLE');
  let alertas = [];
  if (!ispOk) alertas.push('ISP diferente: ' + (ipInfo.isp || 'desconocido'));
  if (alertas.length === 0) return { ok: true, alerta: '✅ ISP: ' + (ipInfo.isp || '?') + ' · ' + nombreEmpleado };
  return { ok: false, alerta: '🚨 ' + alertas.join(' · ') };
}

export function selEmp(n) {
  // Bloquear si hoy es feriado de descanso o ausencia de día completo.
  // Se permite igual si ya marcó entrada (para que pueda marcar su salida).
  const estadoActual = window.appState?.estado || {};
  const yaTieneEntrada = estadoActual[n] && estadoActual[n].entrada;
  if (!yaTieneEntrada) {
    const bloqueo = estaBloqueado(n, fmtFecha(gmt5()));
    if (bloqueo.bloqueado) {
      mostrarToast(bloqueo.motivo + ' \u2014 hoy no necesitas marcar.');
      return;
    }
  }

  cur = n;
  pinOk = false;
  EMPS.forEach(x => {
    const b = document.getElementById('emp-' + x);
    if (!b.classList.contains('done')) b.classList.remove('sel', 'sel-ronald', 'sel-brandon', 'sel-mathias');
  });
  const _sc = document.getElementById('emp-' + n);
  _sc.classList.add('sel');
  if (n === 'Ronald') _sc.classList.add('sel-ronald');
  else if (n === 'Brandon') _sc.classList.add('sel-brandon');
  else if (n === 'Mathias') _sc.classList.add('sel-mathias');
  document.getElementById('pin-inp').value = '';
  document.getElementById('pin-err').style.display = 'none';
  document.getElementById('pin-greet').textContent = '¡Hola, ' + n + '! 👋';
  document.getElementById('pin-box').classList.add('show');
  document.getElementById('welcome').classList.remove('show', 'wel-ronald', 'wel-brandon', 'wel-mathias');
  document.getElementById('mark-btn').style.display = 'none';
  setTimeout(() => document.getElementById('pin-inp').focus(), 100);
}

export function verPin() {
  const pin = document.getElementById('pin-inp').value.trim();
  if (pin !== PINS[cur]) {
    sonidoError();
    document.getElementById('pin-err').style.display = 'block';
    document.getElementById('pin-inp').value = '';
    return;
  }
  sonidoPIN();
  pinOk = true;
  document.getElementById('pin-box').classList.remove('show');

  // Mostrar welcome
  const welcomeEl = document.getElementById('welcome');
  welcomeEl.classList.add('show');
  welcomeEl.classList.remove('wel-ronald', 'wel-brandon', 'wel-mathias');
  if (cur === 'Ronald') welcomeEl.classList.add('wel-ronald');
  else if (cur === 'Brandon') welcomeEl.classList.add('wel-brandon');
  else if (cur === 'Mathias') welcomeEl.classList.add('wel-mathias');

  // Mostrar botón de marcar
  setBtnMarca();
}

export function setBtnMarca() {
  const estado = window.appState?.estado || {};
  const d = estado[cur];
  const tipo = (d && d.entrada) ? 'salida' : 'entrada';
  const btn = document.getElementById('mark-btn');

  // La GPU ya viene precalentada al cargar la página (warmUpGPU),
  // así que el saludo y el botón se muestran al instante, sin esperas.
  const welTitle = document.getElementById('wel-title');
  const welSub = document.getElementById('wel-sub');

  if (tipo === 'entrada') {
    welTitle.textContent = '¡Bienvenido, ' + cur + '! 👋';
    welSub.textContent = 'Estás listo para marcar tu entrada';
    btn.style.cssText = 'display:block;margin:20px auto;cursor:pointer;text-align:center;max-width:300px;';
    btn.innerHTML = '<div class="rgb-wrap"><div class="rgb-inner-entrada" style="cursor:pointer;">✅ MARCAR ENTRADA</div></div>';
  } else {
    welTitle.textContent = '¡Hasta luego, ' + cur + '! 👋';

    // Salida disponible a partir de la hora definida en reglas.js
    if (!salidaDisponible()) {
      welSub.textContent = '📍 Salida disponible a partir de la 1 PM';
      btn.style.cssText = 'display:block;margin:20px auto;cursor:not-allowed;text-align:center;max-width:300px;opacity:0.5;pointer-events:none;';
      btn.innerHTML = '<div class="rgb-wrap"><div class="rgb-inner-salida" style="cursor:not-allowed;">🚪 MARCAR SALIDA</div></div>';
    } else {
      welSub.textContent = 'Marca tu salida para terminar el turno';
      btn.style.cssText = 'display:block;margin:20px auto;cursor:pointer;text-align:center;max-width:300px;opacity:1;pointer-events:auto;';
      btn.innerHTML = '<div class="rgb-wrap"><div class="rgb-inner-salida" style="cursor:pointer;">🚪 MARCAR SALIDA</div></div>';
    }
  }
}

export function getCurFP() {
  return simpleHash(getFingerprint());
}

export function getCurDeviceInfo() {
  const dispositivoInfo = getDispositivoInfo() || 'Desconocido';
  return dispositivoInfo;
}

export function getCurValidation(nombre) {
  return validarPC(nombre);
}
