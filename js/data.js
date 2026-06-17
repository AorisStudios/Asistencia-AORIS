// AORIS STUDIOS - Data Access (lectura del Sheet)
// Lee los registros directamente del Apps Script (doGet), en TIEMPO REAL.
// Antes se leía el "CSV publicado", que tenía retraso y a veces venía vacío.

import { SCRIPT_URL } from './config.js';
import { parseCSVLine } from './utils.js';

// Columnas del Sheet:
// 0:N°  1:Nombre  2:Fecha  3:Entrada  4:Salida  5:Tiempo faltante
// 6:Dispositivo Entrada  7:Dispositivo Salida  8:Alerta

// Helper de respaldo: convierte texto CSV en registros con campos nombrados.
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
      temprano: c[5] || '',
      dispEntrada: c[6] || '',
      dispSalida: c[7] || '',
      alerta: c[8] || ''
    });
  }
  return registros;
}

// Descarga los registros del Apps Script (GET) y devuelve un arreglo de objetos.
export async function obtenerRegistros() {
  const res = await fetch(SCRIPT_URL + '?t=' + Date.now());
  const data = await res.json();
  if (!data || !data.ok || !Array.isArray(data.registros)) return [];
  return data.registros;
}
