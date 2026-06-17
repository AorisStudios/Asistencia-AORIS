// AORIS STUDIOS - Calendario laboral (feriados, ausencias)
// Lógica de negocio para saber, dado un empleado y una fecha (dd/mm/yyyy):
//  - si el marcado está bloqueado (feriado de descanso o ausencia de día completo)
//  - cuántas horas se esperan ese día (para el banco de horas, Fase B)
// Los datos los provee el Apps Script (doGet) y se cargan con setCalendario().

let _feriados = [];   // [{ fecha:'dd/mm/yyyy', nombre, esLaboral:boolean }]
let _ausencias = [];  // [{ empleado, desde, hasta, tipo, horas:(number|null), estado, motivo }]

export function setCalendario(feriados, ausencias) {
  _feriados = Array.isArray(feriados) ? feriados : [];
  _ausencias = Array.isArray(ausencias) ? ausencias : [];
}

// 'dd/mm/yyyy' -> número comparable yyyymmdd (0 si inválida)
function aNum(fechaStr) {
  const p = String(fechaStr || '').split('/');
  if (p.length !== 3) return 0;
  return Number(p[2]) * 10000 + Number(p[1]) * 100 + Number(p[0]);
}

// Un permiso parcial tiene un número de horas > 0; el día completo no.
function esParcial(a) {
  return a && a.horas != null && a.horas !== '' && Number(a.horas) > 0;
}

// Feriado de descanso (no se trabaja) en esa fecha.
export function esFeriadoNoLaboral(fecha) {
  const n = aNum(fecha);
  return _feriados.some(f => aNum(f.fecha) === n && !f.esLaboral);
}

// Ausencia APROBADA que cubre la fecha para el empleado (o null).
export function ausenciaDe(empleado, fecha) {
  const n = aNum(fecha);
  return _ausencias.find(a =>
    a.empleado === empleado &&
    String(a.estado).toLowerCase() === 'aprobada' &&
    n >= aNum(a.desde) && n <= aNum(a.hasta)
  ) || null;
}

// ¿Se debe bloquear el marcado? (feriado de descanso o ausencia de día completo)
export function estaBloqueado(empleado, fecha) {
  const fer = _feriados.find(f => aNum(f.fecha) === aNum(fecha) && !f.esLaboral);
  if (fer) return { bloqueado: true, motivo: '📅 ' + (fer.nombre || 'Feriado') };

  const a = ausenciaDe(empleado, fecha);
  if (a && !esParcial(a)) {
    const motivo = a.tipo === 'vacaciones' ? '🏖️ Estás de vacaciones'
      : a.tipo === 'libre' ? '🌴 Hoy es tu día libre'
      : '📌 Hoy tienes permiso';
    return { bloqueado: true, motivo: motivo };
  }
  return { bloqueado: false, motivo: '' };
}

// Horas esperadas ese día (Fase B). turnoBase = horas del turno del empleado.
// esDiaLaborable = true si es de lunes a viernes.
export function horasEsperadas(empleado, fecha, turnoBase, esDiaLaborable) {
  if (!esDiaLaborable) return 0;
  if (esFeriadoNoLaboral(fecha)) return 0;
  const a = ausenciaDe(empleado, fecha);
  if (a) {
    return esParcial(a) ? Math.max(0, turnoBase - Number(a.horas)) : 0;
  }
  return turnoBase;
}
