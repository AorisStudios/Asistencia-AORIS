// AORIS STUDIOS - Data Access (lectura del Sheet vía Apps Script)
// Lee en TIEMPO REAL desde el doGet del Apps Script: registros + feriados + ausencias.

import { SCRIPT_URL } from './config.js';
import { parseCSVLine } from './utils.js';

// Helper de respaldo: convierte texto CSV de asistencia en registros con campos nombrados.
export function parseRegistros(csv) {
  const lineas = csv.trim().split('\n').slice(1); // saltar encabezado
  const registros = [];
  for (const linea of lineas) {
    if (!linea.trim()) continue;
    const c = parseCSVLine(linea).map(x => (x || '').replace(/"/g, '').trim());
    const nombre = c[1] || '';
    const entrada = c[3] || '';
    if (!nombre || !entrada) continue;
    registros.push({
      indice: c[0] || '',
      nombre,
      fecha: c[2] || '',
      entrada,
      salida: c[4] || '',
      temprano: c[5] || '', // col 6: "Horas trabajadas" (nombre histórico del campo)
      dispEntrada: c[6] || '',
      dispSalida: c[7] || '',
      alerta: c[8] || ''
    });
  }
  return registros;
}

// Descarga TODO del Apps Script: { registros, feriados, ausencias }.
export async function obtenerDatos() {
  const res = await fetch(SCRIPT_URL + '?t=' + Date.now());
  const data = await res.json();
  if (!data || !data.ok) return { registros: [], feriados: [], ausencias: [] };
  return {
    registros: Array.isArray(data.registros) ? data.registros : [],
    feriados: Array.isArray(data.feriados) ? data.feriados : [],
    ausencias: Array.isArray(data.ausencias) ? data.ausencias : []
  };
}

// Solo los registros de asistencia (usado por historial y jefe).
export async function obtenerRegistros() {
  return (await obtenerDatos()).registros;
}
