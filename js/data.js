// AORIS STUDIOS - Data Access (lectura del Google Sheet)
// Única puerta de entrada a los datos del Sheet: descarga y parsea el CSV
// a objetos con campos nombrados. Reutilizado por asistencia, historial y jefe.

import { CSV_URL } from './config.js';
import { parseCSVLine } from './utils.js';

// Columnas del Sheet:
// 0:N°  1:Nombre  2:Fecha  3:Entrada  4:Salida  5:Tiempo faltante
// 6:Dispositivo Entrada  7:Dispositivo Salida  8:Alerta

// Convierte el texto CSV en un arreglo de registros con campos nombrados.
export function parseRegistros(csv) {
  const lineas = csv.trim().split('\n').slice(1); // saltar encabezado
  const registros = [];
  for (const linea of lineas) {
    if (!linea.trim()) continue;
    const c = parseCSVLine(linea).map(x => (x || '').replace(/"/g, '').trim());
    const nombre = c[1] || '';
    const entrada = c[3] || '';
    if (!nombre || !entrada) continue; // ignorar filas vacías o sin entrada
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

// Descarga el Sheet (con cache-busting) y devuelve los registros parseados.
export async function obtenerRegistros() {
  const res = await fetch(CSV_URL + '&t=' + Date.now());
  const csv = await res.text();
  return parseRegistros(csv);
}
