// AORIS STUDIOS - Main App Module

import { FRASES, EMPS } from './config.js';
import { gmt5, fmt, fechaL, segundosRestantes } from './utils.js';
import { obtenerIPInfo } from './api.js';
import { warmUpGPU } from './fingerprint.js';
import { cargarLocal, estado } from './storage.js';
import { typeWriter, aplicarTema, actualizarCountdown } from './ui.js';
import { refTabla, cargarDesdeSheet, updateProgress } from './asistencia.js';
import { inicializarEventos } from './eventos.js';

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
  inicializarEventos();

  const frase = FRASES[Math.floor(Math.random() * FRASES.length)];
  const el = document.getElementById('entry-phrase');
  if (el) {
    typeWriter(frase, el, 45, () => {
      const tap = document.getElementById('entry-tap');
      if (tap) tap.classList.add('show');
    });
  }
  obtenerIPInfo();
  warmUpGPU(); // detectar la GPU temprano para que esté lista al marcar
});

// Referencia viva del estado para depuración y para auth.setBtnMarca()
window.appState = { get estado() { return estado; }, gmt5, fmt, iniciarApp };
