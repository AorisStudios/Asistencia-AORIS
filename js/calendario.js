// AORIS STUDIOS - Calendario Module

import { gmt5, fmtFecha } from './utils.js';
import { obtenerAprobadas } from './vacaciones.js';
import { obtenerFeriados, esFeriado } from './feriados.js';

/**
 * Renderizar calendario visual para un mes específico
 * @param {HTMLElement} container - Elemento donde renderizar
 * @param {number} mes - 1-12
 * @param {number} anio - Año completo
 * @param {string} empleado - Nombre del empleado (para vacaciones)
 */
export function renderCalendario(container, mes, anio, empleado = null) {
  if (!container) return;

  const diasMes = new Date(anio, mes, 0).getDate();
  const primerDia = new Date(anio, mes - 1, 1).getDay();
  const meses = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  let html = `<div style="margin-bottom: 20px;">`;
  html += `<div style="font-weight: 800; font-size: 16px; margin-bottom: 15px; text-align: center;">${meses[mes]} ${anio}</div>`;

  // Encabezado de días de la semana
  html += `<div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin-bottom: 8px;">`;
  diasSemana.forEach(d => {
    html += `<div style="text-align: center; font-weight: 800; font-size: 12px; padding: 8px 0; color: #555;">${d}</div>`;
  });
  html += `</div>`;

  // Días vacíos al inicio
  html += `<div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; min-height: 150px;">`;
  for (let i = 0; i < primerDia; i++) {
    html += `<div style="background: #f0f0f0; border: none; border-radius: 6px;"></div>`;
  }

  // Días del mes
  const hoy = gmt5();
  const hoyFecha = fmtFecha(hoy);

  for (let dia = 1; dia <= diasMes; dia++) {
    const fechaStr = `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    const esHoy = hoyFecha === fechaStr;

    const tieneVacacion = empleado && obtenerAprobadas().some(v => {
      const inicio = new Date(v.fechaInicio);
      const fin = new Date(v.fechaFin);
      const fecha = new Date(fechaStr);
      return v.empleado === empleado && fecha >= inicio && fecha <= fin;
    });

    const tieneFeriado = esFeriado(fechaStr);

    let claseEstilo = '';
    let bgColor = '#fff';
    let borderColor = '#ddd';
    let textColor = '#111';

    if (tieneVacacion && tieneFeriado) {
      claseEstilo = 'cal-dia-ambos';
      bgColor = 'linear-gradient(135deg, #C4A8FF 50%, #FFD600 50%)';
    } else if (tieneVacacion) {
      claseEstilo = 'cal-dia-vacacion';
      bgColor = '#C4A8FF';
      textColor = '#fff';
    } else if (tieneFeriado) {
      claseEstilo = 'cal-dia-feriado';
      bgColor = '#FFD600';
    }

    const borderStyle = esHoy ? '3px solid #FF6B6B' : `2px solid ${borderColor}`;

    html += `<div class="cal-dia ${claseEstilo}" style="
      background: ${bgColor};
      border: ${borderStyle};
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
      transition: transform 0.2s;
      color: ${textColor};
      aspect-ratio: 1;
    " title="${tieneVacacion ? 'Vacaciones' : tieneFeriado ? 'Feriado' : 'Día normal'}">
      ${dia}
    </div>`;
  }

  html += `</div></div>`;
  container.innerHTML = html;
}

/**
 * Renderizar mini-calendario para un mes (versión compacta)
 */
export function renderMiniCalendario(container, mes, anio) {
  if (!container) return;

  const diasMes = new Date(anio, mes, 0).getDate();
  const primerDia = new Date(anio, mes - 1, 1).getDay();

  let html = `<div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px;">`;

  // Días vacíos
  for (let i = 0; i < primerDia; i++) {
    html += `<div style="aspect-ratio: 1; background: #f5f5f5;"></div>`;
  }

  // Días del mes
  for (let dia = 1; dia <= diasMes; dia++) {
    const fechaStr = `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    const esFer = esFeriado(fechaStr);

    html += `<div style="
      aspect-ratio: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      background: ${esFer ? '#FFD600' : '#fff'};
      border: 1px solid #ddd;
      color: ${esFer ? '#111' : '#666'};
    ">${dia}</div>`;
  }

  html += `</div>`;
  container.innerHTML = html;
}

/**
 * Obtener mes anterior/siguiente
 */
export function obtenerMesAnterior(mes, anio) {
  if (mes === 1) return { mes: 12, anio: anio - 1 };
  return { mes: mes - 1, anio };
}

export function obtenerMesSiguiente(mes, anio) {
  if (mes === 12) return { mes: 1, anio: anio + 1 };
  return { mes: mes + 1, anio };
}

/**
 * Renderizar leyenda de colores
 */
export function renderLeyenda(container) {
  if (!container) return;

  const html = `
    <div style="display: flex; gap: 20px; flex-wrap: wrap; font-size: 13px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <div style="width: 20px; height: 20px; background: #C4A8FF; border-radius: 4px; border: 2px solid #111;"></div>
        <span>Vacaciones</span>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <div style="width: 20px; height: 20px; background: #FFD600; border-radius: 4px; border: 2px solid #111;"></div>
        <span>Feriado</span>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <div style="width: 20px; height: 20px; background: #fff; border-radius: 4px; border: 3px solid #FF6B6B;"></div>
        <span>Hoy</span>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

/**
 * Obtener días de vacación para un empleado en un mes
 */
export function obtenerDiasVacacionesMes(empleado, mes, anio) {
  const vacacionesAprobadas = obtenerAprobadas().filter(v => v.empleado === empleado);
  const dias = [];

  vacacionesAprobadas.forEach(v => {
    const inicio = new Date(v.fechaInicio);
    const fin = new Date(v.fechaFin);

    for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
      if (d.getMonth() + 1 === mes && d.getFullYear() === anio) {
        dias.push(String(d.getDate()).padStart(2, '0'));
      }
    }
  });

  return dias;
}

/**
 * Obtener información de un día (vacación/feriado)
 */
export function obtenerInfoDia(fecha, empleado = null) {
  const vacaciones = empleado && obtenerAprobadas().some(v => {
    const inicio = new Date(v.fechaInicio);
    const fin = new Date(v.fechaFin);
    const fDate = new Date(fecha);
    return v.empleado === empleado && fDate >= inicio && fDate <= fin;
  });

  const feriado = obtenerFeriados().find(f => f.fecha === fecha);

  return {
    esVacacion: vacaciones,
    esFeriado: !!feriado,
    feriadoInfo: feriado,
    bloqueado: vacaciones || !!feriado
  };
}
