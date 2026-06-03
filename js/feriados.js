// AORIS STUDIOS - Feriados Module

import { FERIADOS_CSV_URL } from './config.js';
import { fmtFecha, gmt5, parseCSVLine } from './utils.js';
import { feriadosCache, guardarFeriadosLocal } from './storage.js';

/**
 * Cargar feriados desde Google Sheet
 */
export async function cargarFeriados() {
  try {
    const response = await fetch(FERIADOS_CSV_URL + '&t=' + Date.now());
    const csv = await response.text();
    const lineas = csv.trim().split('\n').slice(1); // Skip header

    const feriados = [];
    lineas.forEach(linea => {
      if (!linea.trim()) return;
      const cols = parseCSVLine(linea);

      const fecha = (cols[0] || '').trim();
      const nombre = (cols[1] || '').trim();
      const tipo = (cols[2] || '').trim();
      const descripcion = (cols[3] || '').trim();
      const esLaboral = (cols[4] || '').trim().toLowerCase() === 'true';

      if (fecha && nombre) {
        feriados.push({
          fecha,
          nombre,
          tipo,
          descripcion,
          esLaboral
        });
      }
    });

    feriadosCache.length = 0;
    feriadosCache.push(...feriados);
    guardarFeriadosLocal();

  } catch (e) {
    console.error('Error cargando feriados:', e);
  }
}

/**
 * Verificar si una fecha es feriado
 */
export function esFeriado(fecha) {
  const fStr = typeof fecha === 'string' ? fecha : fmtFecha(fecha);
  return feriadosCache.some(f => f.fecha === fStr);
}

/**
 * Obtener feriado por fecha
 */
export function obtenerFeriado(fecha) {
  const fStr = typeof fecha === 'string' ? fecha : fmtFecha(fecha);
  return feriadosCache.find(f => f.fecha === fStr);
}

/**
 * Obtener todos los feriados
 */
export function obtenerFeriados() {
  return [...feriadosCache];
}

/**
 * Obtener feriados de un mes específico
 */
export function obtenerFeriadosPorMes(mes, anio) {
  return feriadosCache.filter(f => {
    const [y, m] = f.fecha.split('-').slice(0, 2);
    return parseInt(m) === mes && parseInt(y) === anio;
  });
}

/**
 * Obtener feriados de un año
 */
export function obtenerFeriadosPorAnio(anio) {
  return feriadosCache.filter(f => f.fecha.startsWith(anio));
}

/**
 * Verificar si hoy es feriado
 */
export function esHoyFeriado() {
  return esFeriado(fmtFecha(gmt5()));
}

/**
 * Obtener feriado de hoy (si existe)
 */
export function obtenerFeriadoDeHoy() {
  return obtenerFeriado(fmtFecha(gmt5()));
}

/**
 * Crear nuevo feriado
 */
export function crearFeriado(fecha, nombre, tipo = 'Nacional', descripcion = '', esLaboral = true) {
  const feriado = {
    fecha,
    nombre,
    tipo,
    descripcion,
    esLaboral
  };

  // No duplicar
  if (!esFeriado(fecha)) {
    feriadosCache.push(feriado);
    feriadosCache.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    guardarFeriadosLocal();
  }

  return feriado;
}

/**
 * Editar feriado existente
 */
export function editarFeriado(fechaOriginal, nuevaFecha, nombre, tipo, descripcion, esLaboral) {
  const idx = feriadosCache.findIndex(f => f.fecha === fechaOriginal);
  if (idx === -1) return null;

  feriadosCache[idx] = {
    fecha: nuevaFecha,
    nombre,
    tipo,
    descripcion,
    esLaboral
  };

  feriadosCache.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  guardarFeriadosLocal();

  return feriadosCache[idx];
}

/**
 * Eliminar feriado
 */
export function eliminarFeriado(fecha) {
  const idx = feriadosCache.findIndex(f => f.fecha === fecha);
  if (idx === -1) return false;

  feriadosCache.splice(idx, 1);
  guardarFeriadosLocal();
  return true;
}

/**
 * Obtener próximo feriado
 */
export function obtenerProximoFeriado() {
  const hoy = fmtFecha(gmt5());
  return feriadosCache.find(f => f.fecha > hoy);
}

/**
 * Contar feriados en un rango de fechas
 */
export function contarFeriadosEnRango(fechaInicio, fechaFin) {
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);

  return feriadosCache.filter(f => {
    const fDate = new Date(f.fecha);
    return fDate >= inicio && fDate <= fin;
  }).length;
}
