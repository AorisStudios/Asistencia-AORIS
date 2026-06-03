// AORIS STUDIOS - Main App Module

import { FRASES, EMPS, JEFE_PIN } from './config.js';
import { gmt5, fmt, fechaL, segundosRestantes } from './utils.js';
import { resumeAudio } from './audio.js';
import { obtenerIPInfo } from './api.js';
import { cargarLocal, guardarLocal, estado } from './storage.js';
import { typeWriter, aplicarTema, actualizarCountdown } from './ui.js';
import { startExperience } from './splash.js';
import { selEmp, verPin, setBtnMarca, cur, pinOk } from './auth.js';
import { refTabla, cargarDesdeSheet, updateProgress, cerrarBye, intentarMarcar } from './asistencia.js';
import { jefeLogoClick, verificarPinJefe, cerrarJefe, mostrarDispositivo, cerrarDispositivo } from './jefe.js';
import { abrirHistorial } from './historial.js';

// Expose ALL handlers to global window IMMEDIATELY
window.startExperience = startExperience;
window.selEmp = selEmp;
window.verPin = verPin;
window.setBtnMarca = setBtnMarca;
window.intentarMarcar = intentarMarcar;
window.jefeLogoClick = jefeLogoClick;
window.verificarPinJefe = () => verificarPinJefe(JEFE_PIN);
window.cerrarJefe = cerrarJefe;
window.mostrarDispositivo = mostrarDispositivo;
window.cerrarDispositivo = cerrarDispositivo;
window.abrirHistorial = abrirHistorial;
window.cerrarBye = cerrarBye;
window.estado = estado;

function tick() {
  const n = gmt5();
  const clockEl = document.getElementById('clock');
  const fechaEl = document.getElementById('fecha');
  const overlay = document.getElementById('overlay-alerta');

  if (clockEl) clockEl.textContent = fmt(n);
  if (fechaEl) fechaEl.textContent = fechaL(n);

  aplicarTema();
  EMPS.forEach(updateProgress);

  if (overlay && overlay.classList.contains('show') && estado && Object.keys(estado).length > 0) {
    for (let nombre of EMPS) {
      if (estado[nombre] && estado[nombre].entrada) {
        actualizarCountdown(segundosRestantes(estado[nombre].entrada, nombre));
        break;
      }
    }
  }
}

export function iniciarApp() {
  cargarLocal();
  refTabla();
  aplicarTema();
  tick();
  setInterval(tick, 1000);
  cargarDesdeSheet();
  setInterval(cargarDesdeSheet, 60000);
}

// Init on page load
window.addEventListener('load', () => {
  const frase = FRASES[Math.floor(Math.random() * FRASES.length)];
  const el = document.getElementById('entry-phrase');
  if (el) {
    typeWriter(frase, el, 45, () => {
      const tap = document.getElementById('entry-tap');
      if (tap) tap.classList.add('show');
    });
  }
  obtenerIPInfo();
});

// Export for debugging and auth - estado es una referencia viva
window.appState = { get estado() { return estado; }, gmt5, fmt, iniciarApp };
window.cur = cur;
window.pinOk = pinOk;
