// AORIS STUDIOS - Bloqueo Tiempo Libre Module

import { estaEnVacacionesHoy, obtenerSolicitudes } from './vacaciones.js';
import { esFeriado, obtenerFeriado, obtenerFeriados } from './feriados.js';
import { fmtFecha, gmt5 } from './utils.js';

/**
 * Verificar si empleado puede marcar hoy
 * Retorna true si PUEDE marcar, false si está bloqueado
 */
export function puedeMarcaHoy(empleado) {
  try {
    // SOLO bloquear si hay datos cargados Y hay un bloqueo real

    // Verificar si tenemos datos de vacaciones cargados
    const solicitudes = obtenerSolicitudes();
    const feriados = obtenerFeriados();

    // Si no hay datos cargados aún, permitir marcar
    if ((!solicitudes || solicitudes.length === 0) && (!feriados || feriados.length === 0)) {
      return true; // Permitir mientras cargamos datos
    }

    // Verificar vacaciones aprobadas SOLO si tenemos datos
    if (solicitudes && solicitudes.length > 0) {
      if (estaEnVacacionesHoy(empleado)) {
        return false;
      }
    }

    // Verificar feriados SOLO si tenemos datos
    if (feriados && feriados.length > 0) {
      const hoy = fmtFecha(gmt5());
      if (esFeriado(hoy)) {
        return false;
      }
    }

    return true;
  } catch (e) {
    console.warn('puedeMarcaHoy error (permitiendo marcar):', e.message);
    // Si hay error, permitir marcar (no bloquear)
    return true;
  }
}

/**
 * Obtener razón del bloqueo (si está bloqueado)
 */
export function obtenerRazonBloqueo(empleado) {
  try {
    const hoy = fmtFecha(gmt5());

    // Verificar vacaciones
    try {
      if (estaEnVacacionesHoy(empleado)) {
        return {
          bloqueado: true,
          tipo: 'vacaciones',
          mensaje: '🏖️ Estás disfrutando tus vacaciones',
          detalles: 'No se pueden marcar asistencias durante el período de vacaciones aprobadas.'
        };
      }
    } catch (e) {
      console.warn('Error checking vacaciones:', e);
    }

    // Verificar feriado
    try {
      if (esFeriado(hoy)) {
        const feriado = obtenerFeriado(hoy);
        return {
          bloqueado: true,
          tipo: 'feriado',
          mensaje: `📅 ${feriado?.nombre || 'Feriado'}`,
          detalles: feriado?.esLaboral
            ? 'Este es un feriado. Descansa y que disfrutes el día.'
            : 'Hoy no es día laboral.'
        };
      }
    } catch (e) {
      console.warn('Error checking feriados:', e);
    }

    return { bloqueado: false };
  } catch (e) {
    console.warn('obtenerRazonBloqueo error:', e);
    return { bloqueado: false };
  }
}

/**
 * Mostrar alerta visual si está bloqueado
 */
export function mostrarAlertaBloqueado(empleado) {
  try {
    const razon = obtenerRazonBloqueo(empleado);

    if (!razon.bloqueado) return;

    // Crear overlay de alerta
    const overlay = document.createElement('div');
  overlay.id = 'bloqueo-alerta-' + Date.now();
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.3s ease-in;
  `;

  const modal = document.createElement('div');
  modal.style.cssText = `
    background: #F5F0E8;
    padding: 30px;
    border-radius: 12px;
    border: 3px solid #111;
    max-width: 400px;
    text-align: center;
    box-shadow: 8px 8px 0 #444;
    animation: slideUp 0.3s ease-out;
  `;

  modal.innerHTML = `
    <div style="font-size: 32px; margin-bottom: 15px;">${razon.mensaje.split(' ')[0]}</div>
    <div style="font-size: 20px; font-weight: 800; color: #111; margin-bottom: 10px;">${razon.mensaje.substring(razon.mensaje.indexOf(' ') + 1)}</div>
    <div style="font-size: 14px; color: #555; margin-bottom: 20px; line-height: 1.5;">${razon.detalles}</div>
    <button onclick="this.closest('[id^=bloqueo-alerta-]').remove()" style="padding: 12px 24px; background: #FFD600; border: 2px solid #111; border-radius: 8px; font-weight: 800; cursor: pointer; font-family: 'Space Grotesk', Arial, sans-serif; font-size: 14px;">Entendido</button>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Remover después de 5 segundos automáticamente
    setTimeout(() => {
      if (overlay.parentElement) {
        overlay.remove();
      }
    }, 5000);
  } catch (e) {
    console.error('Error mostrando alerta bloqueado:', e);
  }
}

/**
 * Verificar todos los bloqueos (vacaciones + feriados)
 */
export function verificarBloqueos(empleado) {
  const razon = obtenerRazonBloqueo(empleado);
  return {
    puedeMarca: !razon.bloqueado,
    razon: razon.bloqueado ? razon.mensaje : null,
    tipo: razon.tipo || null
  };
}

/**
 * Obtener mensaje para mostrar en UI principal
 */
export function obtenerMensajeBloqueo(empleado) {
  const razon = obtenerRazonBloqueo(empleado);

  if (!razon.bloqueado) {
    return null;
  }

  return {
    titulo: razon.mensaje,
    subtitulo: razon.detalles,
    color: razon.tipo === 'vacaciones' ? '#C4A8FF' : '#FFD600'
  };
}
