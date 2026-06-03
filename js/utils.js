// AORIS STUDIOS - Utility Functions

export function gmt5() {
  const n = new Date();
  return new Date(n.getTime() + n.getTimezoneOffset() * 60000 - 5 * 3600000);
}

export function fmt(d) {
  return String(d.getHours()).padStart(2, '0') + ':' +
         String(d.getMinutes()).padStart(2, '0') + ':' +
         String(d.getSeconds()).padStart(2, '0');
}

export function fmtHM(t) {
  if (!t) return '';
  const parts = t.split(':');
  if (parts.length < 2) return t;
  const h = String(parseInt(parts[0] || 0)).padStart(2, '0');
  const m = String(parseInt(parts[1] || 0)).padStart(2, '0');
  return h + ':' + m;
}

export function fmtFecha(d) {
  return String(d.getDate()).padStart(2, '0') + '/' +
         String(d.getMonth() + 1).padStart(2, '0') + '/' +
         d.getFullYear();
}

export function getShiftHours(nombre) {
  return nombre === 'Mathias' ? 9 : 7.5;
}

export function addH(h, hrs) {
  const [hh, mm, ss] = h.split(':').map(Number);
  const t = hh * 3600 + mm * 60 + ss + hrs * 3600;
  return String(Math.floor(t / 3600) % 24).padStart(2, '0') + ':' +
         String(Math.floor((t % 3600) / 60)).padStart(2, '0') + ':' +
         String(t % 60).padStart(2, '0');
}

export function saludo() {
  const h = gmt5().getHours();
  return h < 12 ? '¡Buenos días' : h < 18 ? '¡Buenas tardes' : '¡Buenas noches';
}

export function fechaL(d) {
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const mes = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return dias[d.getDay()] + ', ' + d.getDate() + ' de ' + mes[d.getMonth()] + ' ' + d.getFullYear();
}

export function esDia() {
  const h = gmt5().getHours();
  return h >= 6 && h < 18;
}

export function esSalidaDesbloqueada(nombre) {
  if (nombre === 'Mathias') return true;
  const n = gmt5();
  return n.getHours() > 13 || (n.getHours() === 13 && n.getMinutes() >= 30);
}

export function segundosRestantes(e, nombre) {
  const s = addH(e, getShiftHours(nombre));
  const [sh, sm, ss] = s.split(':').map(Number);
  const n = gmt5();
  return Math.max(0, sh * 3600 + sm * 60 + ss - (n.getHours() * 3600 + n.getMinutes() * 60 + n.getSeconds()));
}

export function minutosTemprano(e, s, nombre) {
  const sale = addH(e, getShiftHours(nombre));
  const [ph, pm, ps] = sale.split(':').map(Number);
  const [sh, sm, ss] = s.split(':').map(Number);
  return Math.max(0, Math.floor((ph * 3600 + pm * 60 + ps - sh * 3600 - sm * 60 - ss) / 60));
}

export function textoTemprano(m) {
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const r = m % 60;
    return r > 0 ? `${h}h ${r}min` : `${h}h`;
  }
  return `${m}min`;
}

export function shadeColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + percent));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + percent));
  const b = Math.min(255, Math.max(0, (num & 0xff) + percent));
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

export function calcPct2(entrada, salida, nombre) {
  const [eh, em, es] = entrada.split(':').map(Number);
  const sale = addH(entrada, getShiftHours(nombre));
  const [sh2, sm2, ss2] = sale.split(':').map(Number);
  const [sh, sm, ss] = salida.split(':').map(Number);
  const total = sh2 * 3600 + sm2 * 60 + ss2 - (eh * 3600 + em * 60 + es);
  const transcurrido = sh * 3600 + sm * 60 + ss - (eh * 3600 + em * 60 + es);
  return Math.min(100, Math.max(0, Math.round((transcurrido / total) * 100)));
}

export function calcPct(entrada, nombre) {
  const [eh, em, es] = entrada.split(':').map(Number);
  const sale = addH(entrada, getShiftHours(nombre));
  const [sh, sm, ss] = sale.split(':').map(Number);
  const n = gmt5();
  const ahora = n.getHours() * 3600 + n.getMinutes() * 60 + n.getSeconds();
  const inicio = eh * 3600 + em * 60 + es;
  const fin = sh * 3600 + sm * 60 + ss;
  const total = fin - inicio;
  const transcurrido = ahora - inicio;
  return Math.min(100, Math.max(0, Math.round((transcurrido / total) * 100)));
}

export function calcEta(entrada, nombre) {
  const segs = segundosRestantes(entrada, nombre);
  if (segs <= 0) return '¡Turno completo!';
  const h = Math.floor(segs / 3600);
  const m = Math.floor((segs % 3600) / 60);
  return h > 0 ? `Faltan ${h}h ${m}min` : `Faltan ${m}min`;
}

export function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(16).toUpperCase().slice(0, 8);
}

export function parseCSVLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim());
  return result;
}

export function fmtFechaLegible(fechaStr) {
  const parts = fechaStr.split('/');
  if (parts.length < 3) return fechaStr;
  const d = parseInt(parts[0]), m = parseInt(parts[1]) - 1, y = parseInt(parts[2]);
  const date = new Date(y, m, d);
  const dias = ['Dom.', 'Lun.', 'Mar.', 'Mié.', 'Jue.', 'Vie.', 'Sáb.'];
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return dias[date.getDay()] + ' ' + d + ' ' + meses[m];
}

export function jFmtFecha(f) {
  const [d, m, y] = f.split('/').map(Number);
  const dt = new Date(y, m - 1, d);
  const ds = ['Dom.', 'Lun.', 'Mar.', 'Mié.', 'Jue.', 'Vie.', 'Sáb.'];
  const ms = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return ds[dt.getDay()] + ' ' + d + ' ' + ms[m - 1];
}

export function jHoras(e, s) {
  if (!e || !s) return '—';
  const [eh, em] = e.split(':').map(Number);
  const [sh, sm] = s.split(':').map(Number);
  const t = (sh * 60 + sm) - (eh * 60 + em);
  if (t < 0) return '—';
  return Math.floor(t / 60) + 'h ' + String(t % 60).padStart(2, '0') + 'm';
}
