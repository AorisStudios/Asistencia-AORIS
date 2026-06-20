// Tests del banco de horas (js/horas.js)
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { setCalendario } from '../js/calendario.js';
import { esDiaLaborable, horasTrabajadas, horasTrabajadasNetas, calcularSaldo, formatearSaldo, formatearHorasHM, horasTrabajadasTexto, saldoDelDia, formatearSaldoCorto } from '../js/horas.js';

beforeEach(() => {
  setCalendario(
    [{ fecha: '17/06/2026', nombre: 'Feriado X', esLaboral: false }],
    [{ empleado: 'Mathias', desde: '16/06/2026', hasta: '16/06/2026', tipo: 'permiso', horas: 2, estado: 'Aprobada', motivo: '' }]
  );
});

test('esDiaLaborable distingue lun-vie de fin de semana', () => {
  // jun 2026: 15=Lun ... 19=Vie, 20=Sáb, 21=Dom
  assert.equal(esDiaLaborable('15/06/2026'), true);
  assert.equal(esDiaLaborable('18/06/2026'), true);
  assert.equal(esDiaLaborable('20/06/2026'), false); // sábado
  assert.equal(esDiaLaborable('21/06/2026'), false); // domingo
});

test('horasTrabajadas calcula la diferencia en horas decimales', () => {
  assert.equal(horasTrabajadas('09:00', '16:30'), 7.5);
  assert.equal(horasTrabajadas('09:00', '17:30'), 8.5);
  assert.equal(horasTrabajadas('', ''), 0);
});

test('calcularSaldo: a favor + pendiente se netean (Ronald, turno 7.5)', () => {
  const registros = [
    { nombre: 'Ronald', fecha: '15/06/2026', entrada: '09:00', salida: '16:30' }, // 7.5 = esperado -> 0
    { nombre: 'Ronald', fecha: '16/06/2026', entrada: '09:00', salida: '17:30' }, // 8.5 -> +1
    { nombre: 'Ronald', fecha: '18/06/2026', entrada: '09:00', salida: '16:00' }  // 7.0 -> -0.5
  ];
  assert.equal(calcularSaldo('Ronald', registros, 7.5), 0.5);
});

test('calcularSaldo: permiso parcial reduce lo esperado (Mathias, turno 9, permiso 2h)', () => {
  const registros = [
    { nombre: 'Mathias', fecha: '16/06/2026', entrada: '09:00', salida: '16:00' } // 7h trabajadas, esperado 9-2=7 -> 0
  ];
  assert.equal(calcularSaldo('Mathias', registros, 9), 0);
});

test('calcularSaldo: días incompletos no cuentan', () => {
  const registros = [
    { nombre: 'Ronald', fecha: '15/06/2026', entrada: '09:00', salida: '' } // sin salida -> ignorado
  ];
  assert.equal(calcularSaldo('Ronald', registros, 7.5), 0);
});

test('formatearHorasHM convierte decimal a "Xh Ym"', () => {
  assert.equal(formatearHorasHM(7.5), '7h 30m');
  assert.equal(formatearHorasHM(8), '8h 0m');
  assert.equal(formatearHorasHM(0), '0h 0m');
});

test('horasTrabajadasTexto entre dos horas HH:MM (sin almuerzo)', () => {
  assert.equal(horasTrabajadasTexto('09:00', '16:30'), '7h 30m');
  assert.equal(horasTrabajadasTexto('09:00', '18:00'), '9h 0m');
});

test('horasTrabajadasNetas descuenta el almuerzo', () => {
  assert.equal(horasTrabajadasNetas('09:00', '16:30', 0.5), 7);   // Ronald/Brandon: 7.5 - 0.5
  assert.equal(horasTrabajadasNetas('09:00', '18:00', 1), 8);     // Mathias: 9 - 1
  assert.equal(horasTrabajadasNetas('09:00', '16:30', 0), 7.5);   // sin almuerzo
  assert.equal(horasTrabajadasNetas('09:00', '09:15', 0.5), 0);   // nunca negativo
});

test('horasTrabajadasTexto con almuerzo muestra horas netas', () => {
  assert.equal(horasTrabajadasTexto('09:00', '16:30', 0.5), '7h 0m');  // Ronald
  assert.equal(horasTrabajadasTexto('09:00', '18:00', 1), '8h 0m');    // Mathias
});

test('saldoDelDia: trabajado - esperado (Ronald turno 7.5)', () => {
  assert.equal(saldoDelDia('Ronald', '15/06/2026', '09:00', '17:30', 7.5), 1);   // 8.5 - 7.5
  assert.equal(saldoDelDia('Ronald', '15/06/2026', '09:00', '16:00', 7.5), -0.5); // 7 - 7.5
  assert.equal(saldoDelDia('Ronald', '15/06/2026', '09:00', '', 7.5), 0);         // incompleto
});

test('saldoDelDia: permiso parcial reduce lo esperado (Mathias 9h, permiso 2h)', () => {
  // 16/06 Mathias tiene permiso de 2h -> esperado 7; trabaja 7 -> 0
  assert.equal(saldoDelDia('Mathias', '16/06/2026', '09:00', '16:00', 9), 0);
});

test('formatearSaldoCorto da signo y tipo', () => {
  assert.deepEqual(formatearSaldoCorto(0.5), { tipo: 'favor', texto: '+30m' });
  assert.deepEqual(formatearSaldoCorto(-1), { tipo: 'pendiente', texto: '-1h 0m' });
  assert.deepEqual(formatearSaldoCorto(0), { tipo: 'neutro', texto: '0m' });
});

test('formatearSaldo da texto y tipo correctos', () => {
  assert.deepEqual(formatearSaldo(0.5), { tipo: 'favor', texto: '+30min a favor' });
  assert.deepEqual(formatearSaldo(-0.5), { tipo: 'pendiente', texto: '-30min pendientes' });
  assert.deepEqual(formatearSaldo(1.5), { tipo: 'favor', texto: '+1h 30min a favor' });
  assert.deepEqual(formatearSaldo(2), { tipo: 'favor', texto: '+2h a favor' });
  assert.deepEqual(formatearSaldo(0), { tipo: 'neutro', texto: 'Al día' });
});
