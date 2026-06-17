// Tests del parser del Sheet (js/data.js)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseRegistros } from '../js/data.js';

const CSV = [
  '"N°","Nombre","Fecha","Hora Ingreso","Hora Salida","Tiempo faltante","Dispositivo Entrada","Dispositivo Salida","Alerta"',
  '"1","Ronald","16/06/2026","09:30:00","17:00:00","","GPU X","GPU Y · ISP: RED INTERCABLE PERU SAC","✅ OK"',
  '"2","Mathias","16/06/2026","09:00:00","","","GPU Z","","✅ Sin restricciones"',
  '',
  '"3","","16/06/2026","","","","","",""'
].join('\n');

test('parseRegistros ignora filas vacías o sin entrada', () => {
  const r = parseRegistros(CSV);
  assert.equal(r.length, 2);
});

test('parseRegistros mapea los campos por nombre', () => {
  const [ronald, mathias] = parseRegistros(CSV);
  assert.equal(ronald.nombre, 'Ronald');
  assert.equal(ronald.entrada, '09:30:00');
  assert.equal(ronald.salida, '17:00:00');
  assert.match(ronald.dispSalida, /ISP: RED INTERCABLE/);
  assert.equal(mathias.nombre, 'Mathias');
  assert.equal(mathias.salida, ''); // en turno
});
