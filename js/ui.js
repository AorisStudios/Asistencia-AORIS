// AORIS STUDIOS - UI Module

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
  const esDia = new Date(new Date().getTime() + new Date().getTimezoneOffset() * 60000 - 5 * 3600000).getHours() >= 6 &&
                new Date(new Date().getTime() + new Date().getTimezoneOffset() * 60000 - 5 * 3600000).getHours() < 18;
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
