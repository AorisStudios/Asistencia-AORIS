// AORIS STUDIOS - Reglas de negocio
// Constantes y reglas del dominio en un solo lugar, para no repartirlas por el código.

import { gmt5 } from './utils.js';

// Hora (0-23) a partir de la cual se habilita marcar la salida.
export const HORA_MIN_SALIDA = 13; // 1 PM

// ¿Está habilitada la salida a la hora dada? (por defecto, ahora en Lima)
export function salidaDisponible(fecha = gmt5()) {
  return fecha.getHours() >= HORA_MIN_SALIDA;
}
