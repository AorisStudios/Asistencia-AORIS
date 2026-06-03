// AORIS STUDIOS - Auth Module

import { PINS, EMPS } from './config.js';
import { getDispositivoInfo, getFingerprint } from './fingerprint.js';
import { simpleHash } from './utils.js';
import { ipInfo } from './api.js';
import { sonidoError, sonidoPIN } from './audio.js';

export let cur = null;
export let pinOk = false;

export function validarPC(nombreEmpleado) {
  if (nombreEmpleado === 'Mathias') return { ok: true, alerta: '✅ Sin restricciones' };
  const ispDetectado = (ipInfo.isp || '').toUpperCase();
  const ispOk = ispDetectado.includes('INTERCABLE');
  let alertas = [];
  if (!ispOk) alertas.push('ISP diferente: ' + (ipInfo.isp || 'desconocido'));
  if (alertas.length === 0) return { ok: true, alerta: '✅ ISP: ' + (ipInfo.isp || '?') + ' · ' + nombreEmpleado };
  return { ok: false, alerta: '🚨 ' + alertas.join(' · ') };
}

export function selEmp(n) {
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

  if (tipo === 'entrada') {
    btn.style.cssText = 'display:block;margin-top:6px;cursor:pointer;';
    btn.innerHTML = '<div class="rgb-wrap"><div class="rgb-inner-entrada" onclick="intentarMarcar()" style="cursor:pointer;">✅ Marcar entrada</div></div>';
  } else {
    btn.style.cssText = 'display:block;margin-top:6px;cursor:pointer;';
    btn.innerHTML = '<div class="rgb-wrap"><div class="rgb-inner-salida" onclick="intentarMarcar()" style="cursor:pointer;">🚪 Marcar salida</div></div>';
  }
}

export function getCurFP() {
  return simpleHash(getFingerprint());
}

export function getCurDeviceInfo() {
  return getDispositivoInfo() + ' · ISP: ' + (ipInfo.isp || '?');
}

export function getCurValidation(nombre) {
  return validarPC(nombre);
}
