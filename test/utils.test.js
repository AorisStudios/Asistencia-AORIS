// Tests unitarios de la matemática de horas y helpers (js/utils.js)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  addH, fmtHM, fmtFecha, getShiftHours, minutosTemprano,
  textoTemprano, shadeColor, simpleHash, parseCSVLine, jHoras
} from '../js/utils.js';

test('addH suma horas de turno', () => {
  assert.equal(addH('09:00:00', 7.5), '16:30:00');
  assert.equal(addH('09:30:00', 9), '18:30:00');
  assert.equal(addH('', 8), '00:00:00');
});

test('fmtHM normaliza a HH:MM', () => {
  assert.equal(fmtHM('09:30:45'), '09:30');
  assert.equal(fmtHM('9:5'), '09:05');
  assert.equal(fmtHM(''), '');
});

test('fmtFecha formatea dd/mm/yyyy', () => {
  assert.equal(fmtFecha(new Date(2026, 5, 16)), '16/06/2026');
  assert.equal(fmtFecha(new Date(2026, 0, 3)), '03/01/2026');
});

test('getShiftHours sale de EMPLEADOS (Mathias = 9)', () => {
  assert.equal(getShiftHours('Ronald'), 7.5);
  assert.equal(getShiftHours('Brandon'), 7.5);
  assert.equal(getShiftHours('Mathias'), 9);
  assert.equal(getShiftHours('Desconocido'), 7.5); // fallback
});

test('minutosTemprano calcula minutos faltantes', () => {
  // Ronald (7.5h): entrada 09:00 -> sale 16:30
  assert.equal(minutosTemprano('09:00:00', '16:00:00', 'Ronald'), 30);
  assert.equal(minutosTemprano('09:00:00', '17:00:00', 'Ronald'), 0); // salió después
  // Mathias (9h): entrada 09:00 -> sale 18:00
  assert.equal(minutosTemprano('09:00:00', '17:00:00', 'Mathias'), 60);
});

test('textoTemprano formatea minutos', () => {
  assert.equal(textoTemprano(30), '30min');
  assert.equal(textoTemprano(60), '1h');
  assert.equal(textoTemprano(90), '1h 30min');
});

test('shadeColor devuelve hex válido', () => {
  const c = shadeColor('#C4A8FF', -15);
  assert.match(c, /^#[0-9a-f]{6}$/i);
});

test('simpleHash es determinista y 8 chars hex', () => {
  const a = simpleHash('AORIS-2026');
  const b = simpleHash('AORIS-2026');
  assert.equal(a, b);
  assert.match(a, /^[0-9A-F]{1,8}$/);
});

test('parseCSVLine respeta comillas', () => {
  assert.deepEqual(parseCSVLine('"1","Ronald","16/06/2026"'), ['1', 'Ronald', '16/06/2026']);
  assert.deepEqual(parseCSVLine('a,b,c'), ['a', 'b', 'c']);
});

test('jHoras calcula duración HH:MM', () => {
  assert.equal(jHoras('09:00', '17:00'), '8h 00m');
  assert.equal(jHoras('09:30', '17:36'), '8h 06m');
  assert.equal(jHoras('', 'x'), '—');
});

test('minutosTemprano tolera horas sin segundos (HH:MM)', () => {
  // Ronald (7.5h): entrada 09:00 -> sale 16:30; salió 16:00 -> faltaron 30 min
  assert.equal(minutosTemprano('09:00', '16:00', 'Ronald'), 30);
  assert.equal(minutosTemprano('09:00', '16:30', 'Ronald'), 0);
});
