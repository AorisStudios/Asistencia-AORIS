// AORIS STUDIOS - UI Module

import { gmt5 } from './utils.js';

export function typeWriter(text, el, speed, onDone) {
  el.innerHTML = '<span id="entry-cursor">|</span>';
  let i = 0;
  function next() {
    if (i < text.length) {
      el.innerHTML = text.slice(0, i + 1) + '<span id="entry-cursor">|</span>';
      i++;
      setTimeout(next, speed);
    } else {
      el.innerHTML = text;
      if (onDone) onDone();
    }
  }
  setTimeout(next, 400);
}

export function aplicarTema() {
  const h = gmt5().getHours();
  const esDia = h >= 6 && h < 18;
  if (esDia) {
    document.getElementById('body').className = 'tema-dia';
    document.getElementById('sun-moon').textContent = '☀️';
  } else {
    document.getElementById('body').className = 'tema-noche';
    document.getElementById('sun-moon').textContent = '🌙';
  }
}

export function actualizarCountdown(segs) {
  const h = Math.floor(segs / 3600);
  const m = Math.floor((segs % 3600) / 60);
  const s = segs % 60;
  document.getElementById('cd-h').textContent = String(h).padStart(2, '0');
  document.getElementById('cd-m').textContent = String(m).padStart(2, '0');
  document.getElementById('cd-s').textContent = String(s).padStart(2, '0');
}

// Aviso flotante (toast) no bloqueante. Se usa, por ejemplo, si falla el guardado.
export function mostrarToast(mensaje, ms = 5000) {
  let toast = document.getElementById('aoris-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'aoris-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = mensaje;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), ms);
}
