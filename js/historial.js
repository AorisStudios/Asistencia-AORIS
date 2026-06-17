// AORIS STUDIOS - Historial Module

import { gmt5, fmtFechaLegible, fmtHM, calcPct, getShiftHours } from './utils.js';
import { obtenerRegistros } from './data.js';

let histColorActual = '#C4A8FF';

export function abrirHistorial(nombre, color) {
  histColorActual = color;
  const now = gmt5();
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const mesNombre = meses[now.getMonth()];
  document.getElementById('hist-title').textContent = '📊 ' + nombre + ' — ' + mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1) + ' ' + now.getFullYear();
  document.getElementById('hist-body').innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--txt3);font-weight:600;">⏳ Cargando...</td></tr>';
  document.getElementById('hist-dias').textContent = '—';
  document.getElementById('hist-prom').textContent = '—';
  document.getElementById('hist-comp').textContent = '—';
  document.getElementById('hist-ant').textContent = '—';
  document.getElementById('hist-overlay').classList.add('show');
  renderHistorial(nombre, color);
}

function renderHistorial(nombre, color) {
  const hoyDate = gmt5();
  const mesActual = hoyDate.getMonth();
  const anioActual = hoyDate.getFullYear();
  const turnoSegs = getShiftHours(nombre) * 3600; // turno real del empleado

  obtenerRegistros()
    .then(filas => {
      const registros = [];
      filas.forEach(r => {
        if (r.nombre !== nombre || !r.entrada) return;
        const parts = r.fecha.split('/');
        if (parts.length < 3) return;
        const dm = parseInt(parts[1]) - 1, dy = parseInt(parts[2]);
        if (dm !== mesActual || dy !== anioActual) return;
        const { fecha, entrada, salida, temprano } = r;
        let horas = '—', pct = 0, est = 'sin-salida';
        if (salida) {
          const [eh, em, es] = entrada.split(':').map(Number);
          const [sh, sm, ss] = salida.split(':').map(Number);
          const segs = (sh * 3600 + sm * 60 + ss) - (eh * 3600 + em * 60 + es);
          pct = Math.min(100, Math.max(0, Math.round((segs / turnoSegs) * 100)));
          const hh = Math.floor(segs / 3600), mm = Math.floor((segs % 3600) / 60);
          horas = hh + 'h ' + mm + 'm';
          const saleSegs = eh * 3600 + em * 60 + es + turnoSegs;
          est = sh * 3600 + sm * 60 + ss > saleSegs + 60 ? 'tardia' : pct >= 100 ? 'completo' : 'anticipada';
        } else {
          pct = calcPct(entrada, nombre);
          horas = 'En turno';
          est = 'en-turno';
        }
        registros.push({ fecha, entrada, salida: salida || '—', horas, pct, est, temprano });
      });

      const completos = registros.filter(r => r.est === 'completo').length;
      const anticipadas = registros.filter(r => r.est === 'anticipada').length;
      const totalMin = registros.filter(r => r.horas !== '—' && r.horas !== 'En turno').reduce((a, r) => {
        const [h, rest] = r.horas.split('h ');
        return a + parseInt(h) * 60 + parseInt((rest || '0').replace('m', ''));
      }, 0);
      const prom = registros.length > 0 ? Math.round(totalMin / registros.length) : 0;

      document.getElementById('hist-dias').textContent = registros.length;
      document.getElementById('hist-prom').textContent = Math.floor(prom / 60) + 'h ' + prom % 60 + 'm';
      document.getElementById('hist-comp').textContent = completos + '/' + registros.length;
      document.getElementById('hist-ant').textContent = anticipadas;

      if (registros.length === 0) {
        document.getElementById('hist-body').innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--txt3);font-weight:600;">Sin registros este mes</td></tr>';
        return;
      }

      registros.reverse();
      let html = '';
      registros.forEach(r => {
        const barColor = r.pct >= 100 ? '#BDEFC4' : r.est === 'tardia' ? '#4A9EFF' : '#FFB347';
        const estadoHtml = r.est === 'completo' ? '<span style="color:#2d6a4f;font-weight:800;font-size:11px;">✅ Completo</span>' :
          r.est === 'tardia' ? '<span style="color:#185FA5;font-weight:800;font-size:11px;">🌙 Extra</span>' :
          r.est === 'anticipada' ? '<span style="color:#cc0000;font-weight:800;font-size:11px;">⏰ Anticipada</span>' :
          '<span style="color:#856404;font-weight:800;font-size:11px;">🟡 En turno</span>';
        html += '<tr><td style="font-weight:700;font-size:12px;white-space:nowrap;padding:10px 8px;">' + fmtFechaLegible(r.fecha) + '</td>';
        html += '<td style="white-space:nowrap;padding:10px 8px;"><span class="ao-bdg in" style="font-size:11px;border-color:' + color + ';background:' + color + '30;">' + fmtHM(r.entrada) + '</span></td>';
        const salidaHtmlFixed = r.salida === '—' ? '<span style="color:var(--txt3);">—</span>' :
          r.est === 'anticipada' ? '<span class="ao-bdg hora-temprano" style="font-size:11px;">' + fmtHM(r.salida) + '</span>' :
          '<span class="ao-bdg in" style="font-size:11px;">' + fmtHM(r.salida) + '</span>';
        html += '<td style="white-space:nowrap;padding:10px 8px;">' + salidaHtmlFixed + '</td>';
        html += '<td style="color:var(--txt2);font-size:12px;font-weight:700;white-space:nowrap;padding:10px 8px;">' + r.horas + '</td>';
        html += '<td style="white-space:nowrap;padding:10px 8px;"><div style="display:inline-flex;align-items:center;gap:5px;"><div style="height:8px;width:55px;border-radius:10px;border:2px solid var(--border);background:var(--card);overflow:hidden;"><div style="height:100%;width:' + r.pct + '%;background:' + barColor + ';border-radius:8px;"></div></div><span style="font-size:11px;font-weight:800;color:var(--txt);">' + r.pct + '%</span></div></td>';
        html += '<td style="white-space:nowrap;padding:10px 8px;">' + estadoHtml + '</td></tr>';
      });
      document.getElementById('hist-body').innerHTML = html;
    })
    .catch(() => { document.getElementById('hist-body').innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--txt3);">❌ No se pudo cargar</td></tr>'; });
}
