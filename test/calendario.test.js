// Tests de la lógica de feriados/ausencias (js/calendario.js)
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  setCalendario, esFeriadoNoLaboral, ausenciaDe, estaBloqueado, horasEsperadas
} from '../js/calendario.js';

beforeEach(() => {
  setCalendario(
    [
      { fecha: '28/07/2026', nombre: 'Fiestas Patrias', esLaboral: false },
      { fecha: '29/07/2026', nombre: 'Feriado laborable', esLaboral: true }
    ],
    [
      { empleado: 'Brandon', desde: '20/06/2026', hasta: '22/06/2026', tipo: 'vacaciones', horas: null, estado: 'Aprobada', motivo: 'Viaje' },
      { empleado: 'Mathias', desde: '23/06/2026', hasta: '23/06/2026', tipo: 'permiso', horas: 2, estado: 'Aprobada', motivo: 'Médico' },
      { empleado: 'Ronald', desde: '24/06/2026', hasta: '24/06/2026', tipo: 'libre', horas: null, estado: 'Pendiente', motivo: '' }
    ]
  );
});

test('esFeriadoNoLaboral distingue feriado de descanso vs laborable', () => {
  assert.equal(esFeriadoNoLaboral('28/07/2026'), true);
  assert.equal(esFeriadoNoLaboral('29/07/2026'), false); // es laborable
  assert.equal(esFeriadoNoLaboral('30/07/2026'), false);
});

test('ausenciaDe encuentra ausencias aprobadas dentro del rango', () => {
  assert.ok(ausenciaDe('Brandon', '21/06/2026'));      // dentro de 20-22
  assert.equal(ausenciaDe('Brandon', '23/06/2026'), null); // fuera de rango
  assert.equal(ausenciaDe('Ronald', '24/06/2026'), null);  // Pendiente -> no cuenta
  assert.equal(ausenciaDe('Mathias', '20/06/2026'), null); // no es suya
});

test('estaBloqueado: feriado y ausencia de día completo bloquean; permiso parcial no', () => {
  assert.equal(estaBloqueado('Brandon', '28/07/2026').bloqueado, true);  // feriado
  assert.equal(estaBloqueado('Brandon', '21/06/2026').bloqueado, true);  // vacaciones día completo
  assert.equal(estaBloqueado('Mathias', '23/06/2026').bloqueado, false); // permiso parcial NO bloquea
  assert.equal(estaBloqueado('Ronald', '19/06/2026').bloqueado, false);  // día normal
});

test('horasEsperadas aplica turno, feriados, ausencias y permiso parcial', () => {
  // día normal laborable
  assert.equal(horasEsperadas('Ronald', '19/06/2026', 7.5, true), 7.5);
  // fin de semana (no laborable)
  assert.equal(horasEsperadas('Ronald', '20/06/2026', 7.5, false), 0);
  // feriado de descanso
  assert.equal(horasEsperadas('Ronald', '28/07/2026', 7.5, true), 0);
  // vacaciones día completo (Brandon)
  assert.equal(horasEsperadas('Brandon', '21/06/2026', 7.5, true), 0);
  // permiso parcial de 2h sobre turno de 8 (Mathias)
  assert.equal(horasEsperadas('Mathias', '23/06/2026', 8, true), 6);
});
