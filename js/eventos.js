// AORIS STUDIOS - Eventos (cableado de la UI)
// Centraliza todos los listeners en un solo lugar, en vez de onclick inline.
// Los elementos que se generan dinámicamente usan delegación de eventos.

import { JEFE_PIN, EMPLEADOS } from './config.js';
import { estado } from './storage.js';
import { startExperience } from './splash.js';
import { selEmp, verPin } from './auth.js';
import { jefeLogoClick, verificarPinJefe, cerrarJefe, mostrarDispositivo, cerrarDispositivo, abrirAusencias, cerrarAusencias, crearAusencia, accionAusencia } from './jefe.js';
import { abrirHistorial } from './historial.js';
import { intentarMarcar, cerrarModalConfirm, cerrarBye, elegirRazon } from './asistencia.js';

const $ = (id) => document.getElementById(id);

export function inicializarEventos() {
  // --- Pantalla de entrada ---
  $('entry-screen')?.addEventListener('click', startExperience);

  // --- Logo (acceso jefe con 5 clics) ---
  $('ao-logo-click')?.addEventListener('click', jefeLogoClick);

  // --- Selección de empleado ---
  for (const emp of EMPLEADOS) {
    const card = $('emp-' + emp.nombre);
    if (card) card.addEventListener('click', () => {
      if (!estado[emp.nombre] || !estado[emp.nombre].salida) selEmp(emp.nombre);
    });
  }

  // --- Botones "Mi rendimiento" (historial) ---
  document.querySelectorAll('.btn-historial').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      abrirHistorial(btn.dataset.emp, btn.dataset.color);
    });
  });

  // --- PIN de empleado ---
  $('pin-inp')?.addEventListener('keyup', (e) => { if (e.key === 'Enter') verPin(); });
  $('btn-pin-confirm')?.addEventListener('click', verPin);

  // --- Botón de marcar (se regenera; delegamos en el contenedor) ---
  $('mark-btn')?.addEventListener('click', intentarMarcar);

  // --- Modal de confirmación ---
  $('btn-confirm-ok')?.addEventListener('click', cerrarModalConfirm);

  // --- Overlay de alerta (salida anticipada) ---
  $('btn-alerta-volver')?.addEventListener('click', () => $('overlay-alerta')?.classList.remove('show'));
  $('btn-alerta-salir')?.addEventListener('click', () => elegirRazon('anticipada', 1));

  // --- Historial: cerrar ---
  document.querySelector('#hist-overlay .hist-close')?.addEventListener('click', () => $('hist-overlay')?.classList.remove('show'));

  // --- Jefe: PIN y cierre ---
  $('jefe-pin-inp')?.addEventListener('keyup', (e) => { if (e.key === 'Enter') verificarPinJefe(JEFE_PIN); });
  document.querySelector('.jefe-pin-btn')?.addEventListener('click', () => verificarPinJefe(JEFE_PIN));
  document.querySelector('.jefe-close-btn')?.addEventListener('click', cerrarJefe);

  // --- Jefe: botones de dispositivo (delegación, se generan dinámicamente) ---
  $('jefe-tbody')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.jdisp-btn');
    if (btn && !btn.disabled) mostrarDispositivo(btn, btn.dataset.tipo || 'entrada');
  });

  // --- Modal de despedida ---
  document.querySelector('#modal-bye .bye-btn')?.addEventListener('click', cerrarBye);

  // --- Modal de dispositivo ---
  const dispOv = $('disp-modal-overlay');
  if (dispOv) dispOv.addEventListener('click', (e) => { if (e.target.id === 'disp-modal-overlay') cerrarDispositivo(); });
  document.querySelector('#disp-modal .disp-modal-close')?.addEventListener('click', cerrarDispositivo);

  // --- Panel de ausencias (vista de jefe) ---
  $('btn-abrir-ausencias')?.addEventListener('click', abrirAusencias);
  $('btn-cerrar-ausencias')?.addEventListener('click', cerrarAusencias);
  $('btn-crear-ausencia')?.addEventListener('click', crearAusencia);
  $('aus-lista')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.aus-accion');
    if (btn) accionAusencia(Number(btn.dataset.fila), btn.dataset.emp, btn.dataset.accion);
  });
}
