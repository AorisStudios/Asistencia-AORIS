// AORIS STUDIOS - Vacaciones Module

import { VACACIONES_CSV_URL, DIAS_VACACIONES_ANIO, MAX_DIAS_CONSECUTIVOS, DIAS_LABORALES, EMPS } from './config.js';
import { gmt5, fmtFecha, parseCSVLine } from './utils.js';
import { vacacionesCache, guardarVacacionesLocal } from './storage.js';

/**
 * Cargar solicitudes de vacaciones desde Google Sheet
 */
export async function cargarVacaciones() {
  try {
    const response = await fetch(VACACIONES_CSV_URL + '&t=' + Date.now());
    const csv = await response.text();
    const lineas = csv.trim().split('\n').slice(1); // Skip header

    const solicitudes = [];
    lineas.forEach(linea => {
      if (!linea.trim()) return;
      const cols = parseCSVLine(linea);

      const id = (cols[0] || '').trim();
      const empleado = (cols[1] || '').trim();
      const fechaInicio = (cols[2] || '').trim();
      const fechaFin = (cols[3] || '').trim();
      const diasUsados = parseInt(cols[4] || '0');
      const estado = (cols[5] || '').trim();
      const razon = (cols[6] || '').trim();

      if (id && empleado && fechaInicio) {
        solicitudes.push({
          id,
          empleado,
          fechaInicio,
          fechaFin,
          diasUsados,
          estado,
          razon
        });
      }
    });

    vacacionesCache.solicitudes = solicitudes;
    calcularSaldos();
    guardarVacacionesLocal();

  } catch (e) {
    console.error('Error cargando vacaciones:', e);
  }
}

/**
 * Calcular saldos disponibles por empleado
 */
function calcularSaldos() {
  const saldos = { Ronald: DIAS_VACACIONES_ANIO, Brandon: DIAS_VACACIONES_ANIO, Mathias: DIAS_VACACIONES_ANIO };

  vacacionesCache.solicitudes.forEach(sol => {
    if (sol.estado === 'Aprobada') {
      saldos[sol.empleado] = Math.max(0, saldos[sol.empleado] - sol.diasUsados);
    }
  });

  vacacionesCache.saldos = saldos;
}

/**
 * Obtener saldo disponible para un empleado
 */
export function obtenerSaldo(empleado) {
  return vacacionesCache.saldos[empleado] || DIAS_VACACIONES_ANIO;
}

/**
 * Obtener todas las solicitudes
 */
export function obtenerSolicitudes() {
  return vacacionesCache.solicitudes || [];
}

/**
 * Obtener solicitudes por estado
 */
export function obtenerSolicitudesPor(estado = 'Pendiente') {
  return obtenerSolicitudes().filter(s => s.estado === estado);
}

/**
 * Validar si una solicitud cumple reglas
 */
export function validarSolicitud(empleado, fechaInicio, fechaFin) {
  const errors = [];

  // Validar formato de fechas
  if (!fechaInicio || !fechaFin) {
    errors.push('Fechas inválidas');
    return errors;
  }

  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);

  if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
    errors.push('Formato de fecha incorrecto');
    return errors;
  }

  if (fin < inicio) {
    errors.push('La fecha de fin no puede ser anterior a la de inicio');
    return errors;
  }

  // Contar días laborales
  const diasLaborales = contarDiasLaborales(inicio, fin);

  if (diasLaborales > MAX_DIAS_CONSECUTIVOS) {
    errors.push(`Máximo ${MAX_DIAS_CONSECUTIVOS} días consecutivos permitidos`);
  }

  // Validar saldo disponible
  const saldoDisponible = obtenerSaldo(empleado);
  if (diasLaborales > saldoDisponible) {
    errors.push(`Solo tienes ${saldoDisponible} días disponibles`);
  }

  return errors;
}

/**
 * Contar días laborales entre dos fechas (lunes-viernes)
 */
function contarDiasLaborales(inicio, fin) {
  let count = 0;
  const fecha = new Date(inicio);

  while (fecha <= fin) {
    const dayOfWeek = fecha.getDay();
    // 1=lunes, 5=viernes (ISO: 1-5)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      count++;
    }
    fecha.setDate(fecha.getDate() + 1);
  }

  return count;
}

/**
 * Verificar si empleado está en vacaciones HOY
 */
export function estaEnVacacionesHoy(empleado) {
  const hoy = fmtFecha(gmt5());
  return estaEnVacaciones(empleado, hoy);
}

/**
 * Verificar si empleado está en vacaciones en una fecha específica
 */
export function estaEnVacaciones(empleado, fecha) {
  return obtenerSolicitudes().some(sol => {
    if (sol.empleado !== empleado || sol.estado !== 'Aprobada') return false;

    const inicio = new Date(sol.fechaInicio);
    const fin = new Date(sol.fechaFin);
    const fDate = new Date(fecha);

    return fDate >= inicio && fDate <= fin;
  });
}

/**
 * Crear nueva solicitud de vacación (desde app principal)
 */
export function crearSolicitud(empleado, fechaInicio, fechaFin, razon = '') {
  const errors = validarSolicitud(empleado, fechaInicio, fechaFin);
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const id = Date.now().toString();
  const diasUsados = contarDiasLaborales(new Date(fechaInicio), new Date(fechaFin));

  const solicitud = {
    id,
    empleado,
    fechaInicio,
    fechaFin,
    diasUsados,
    estado: 'Pendiente',
    razon
  };

  return { ok: true, solicitud };
}

/**
 * Obtener solicitudes pendientes
 */
export function obtenerPendientes() {
  return obtenerSolicitudesPor('Pendiente');
}

/**
 * Obtener solicitudes aprobadas
 */
export function obtenerAprobadas() {
  return obtenerSolicitudesPor('Aprobada');
}

/**
 * Obtener solicitudes rechazadas
 */
export function obtenerRechazadas() {
  return obtenerSolicitudesPor('Rechazada');
}
