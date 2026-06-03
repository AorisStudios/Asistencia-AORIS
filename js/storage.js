// AORIS STUDIOS - Storage Module

import { STORAGE_KEY } from './config.js';
import { fmtFecha, gmt5 } from './utils.js';

export let estado = {};

export function guardarLocal() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ fecha: fmtFecha(gmt5()), estado }));
}

export function cargarLocal() {
  try {
    const r = localStorage.getItem(STORAGE_KEY);
    if (!r) return;
    const d = JSON.parse(r);
    if (d.fecha === fmtFecha(gmt5())) {
      estado = d.estado;
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) {}
}
