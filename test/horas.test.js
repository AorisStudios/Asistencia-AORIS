// Tests del banco de horas (js/horas.js)
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { setCalendario } from '../js/calendario.js';
import { esDiaLaborable, horasTrabajadas, calcularSaldo, formatearSaldo } from '../js/horas.js';

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

test('formatearSaldo da texto y tipo correctos', () => {
  assert.deepEqual(formatearSaldo(0.5), { tipo: 'favor', texto: '+30min a favor' });
  assert.deepEqual(formatearSaldo(-0.5), { tipo: 'pendiente', texto: '-30min pendientes' });
  assert.deepEqual(formatearSaldo(1.5), { tipo: 'favor', texto: '+1h 30min a favor' });
  assert.deepEqual(formatearSaldo(2), { tipo: 'favor', texto: '+2h a favor' });
  assert.deepEqual(formatearSaldo(0), { tipo: 'neutro', texto: 'Al día' });
});
