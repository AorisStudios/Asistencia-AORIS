// AORIS STUDIOS - Banco de horas (saldo a favor / pendiente)
// Calcula, a partir de las marcas y el calendario, cuántas horas lleva
// acumuladas un empleado por encima (a favor) o por debajo (pendientes)
// de lo esperado. El saldo SIEMPRE se calcula desde los datos, nunca se guarda.

import { horasEsperadas } from './calendario.js';

const DIAS_LABORABLES = [1, 2, 3, 4, 5]; // 1=lunes ... 5=viernes (getDay)

// ¿La fecha 'dd/mm/yyyy' cae en día laborable (lun-vie)?
export function esDiaLaborable(fechaStr) {
  const [d, m, y] = String(fechaStr || '').split('/').map(Number);
  if (!d || !m || !y) return false;
  return DIAS_LABORABLES.indexOf(new Date(y, m - 1, d).getDay()) > -1;
}

// Horas (decimal) trabajadas entre dos horas "HH:MM".
export function horasTrabajadas(entrada, salida) {
  if (!entrada || !salida) return 0;
  const [eh, em] = entrada.split(':').map(Number);
  const [sh, sm] = salida.split(':').map(Number);
  const min = (sh * 60 + sm) - (eh * 60 + em);
  return min > 0 ? min / 60 : 0;
}

// Saldo acumulado en horas (decimal). Positivo = a favor, negativo = pendiente.
// Solo cuenta días efectivamente trabajados (con entrada Y salida).
export function calcularSaldo(empleado, registros, turnoHoras) {
  let saldo = 0;
  for (const r of registros) {
    if (r.nombre !== empleado || !r.entrada || !r.salida) continue;
    const esperado = horasEsperadas(empleado, r.fecha, turnoHoras, esDiaLaborable(r.fecha));
    saldo += horasTrabajadas(r.entrada, r.salida) - esperado;
  }
  return saldo;
}

// Horas (decimal) -> texto compacto "7h 30m" (lo que se guarda en el Sheet).
export function formatearHorasHM(horasDecimal) {
  const totalMin = Math.round((horasDecimal || 0) * 60);
  const h = Math.floor(Math.abs(totalMin) / 60);
  const m = Math.abs(totalMin) % 60;
  return h + 'h ' + m + 'm';
}

// Texto de horas trabajadas entre dos horas "HH:MM" -> "7h 30m".
export function horasTrabajadasTexto(entrada, salida) {
  return formatearHorasHM(horasTrabajadas(entrada, salida));
}

// Saldo de UN día (decimal): trabajado - esperado. + = de más, - = de menos.
// Devuelve 0 si el día está incompleto (falta entrada o salida).
export function saldoDelDia(empleado, fecha, entrada, salida, turnoHoras) {
  if (!entrada || !salida) return 0;
  const esperado = horasEsperadas(empleado, fecha, turnoHoras, esDiaLaborable(fecha));
  return horasTrabajadas(entrada, salida) - esperado;
}

// Saldo compacto para mostrar al lado de las horas: { tipo, texto: '+30m' | '-1h 0m' | '0m' }.
export function formatearSaldoCorto(horasDecimal) {
  const totalMin = Math.round(horasDecimal * 60);
  const abs = Math.abs(totalMin);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  let hm = '';
  if (h > 0) hm += h + 'h ';
  hm += m + 'm';
  hm = hm.trim();
  if (totalMin > 0) return { tipo: 'favor', texto: '+' + hm };
  if (totalMin < 0) return { tipo: 'pendiente', texto: '-' + hm };
  return { tipo: 'neutro', texto: '0m' };
}

// Formatea el saldo para mostrarlo: { tipo: 'favor'|'pendiente'|'neutro', texto }
export function formatearSaldo(horasDecimal) {
  const totalMin = Math.round(horasDecimal * 60);
  const abs = Math.abs(totalMin);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  let hm = '';
  if (h > 0) hm += h + 'h ';
  if (m > 0 || h === 0) hm += m + 'min';
  hm = hm.trim();
  if (totalMin > 0) return { tipo: 'favor', texto: '+' + hm + ' a favor' };
  if (totalMin < 0) return { tipo: 'pendiente', texto: '-' + hm + ' pendientes' };
  return { tipo: 'neutro', texto: 'Al día' };
}
