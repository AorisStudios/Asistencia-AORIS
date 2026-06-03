// AORIS STUDIOS - Splash Animations

import { sonidoBienvenida, resumeAudio } from './audio.js';
import { gmt5, fechaL } from './utils.js';
import { iniciarApp } from './app.js';

export function runSplash() {
  document.getElementById('splash-screen').classList.add('show');
  const now = gmt5();
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const h = now.getHours();
  const emoji = h < 12 ? '☀️' : h < 18 ? '🌤️' : '🌙';
  const msg = h < 12 ? '¡Que empiece el trabajo!' : h < 18 ? '¡Buenas tardes, equipo!' : '¡Buenas noches, equipo!';
  
  document.getElementById('splash-day').innerHTML = `${dias[now.getDay()]} <span>${now.getDate()} de ${meses[now.getMonth()]}</span>`;
  document.getElementById('splash-msg').textContent = `${emoji} ${msg}`;
  sonidoBienvenida();
  
  setTimeout(() => { const i = document.getElementById('splash-icon'); i.style.transition = 'opacity 0.4s ease,transform 0.5s cubic-bezier(0.34,1.56,0.64,1)'; i.style.opacity = '1'; i.style.transform = 'scale(1)'; }, 50);
  document.querySelectorAll('.a-letter').forEach((l, i) => { setTimeout(() => { l.style.transition = 'opacity 0.3s ease,transform 0.4s cubic-bezier(0.34,1.56,0.64,1)'; l.style.opacity = '1'; l.style.transform = 'translateY(0)'; }, 400 + i * 90); });
  setTimeout(() => { const s = document.getElementById('studios-text'); s.style.transition = 'opacity 0.5s ease'; s.style.opacity = '1'; }, 900);
  setTimeout(() => { const l = document.getElementById('splash-line'); l.style.transition = 'width 0.5s ease'; l.style.width = '80px'; }, 1050);
  setTimeout(() => { const d = document.getElementById('splash-day'); d.style.transition = 'opacity 0.5s ease,transform 0.5s ease'; d.style.opacity = '1'; d.style.transform = 'translateY(0)'; }, 1400);
  setTimeout(() => { const m = document.getElementById('splash-msg'); m.style.transition = 'opacity 0.5s ease,transform 0.5s ease'; m.style.opacity = '1'; m.style.transform = 'translateY(0)'; }, 1700);
  setTimeout(() => { document.getElementById('splash-dots').style.transition = 'opacity 0.4s ease'; document.getElementById('splash-dots').style.opacity = '1'; }, 2200);
  setTimeout(() => { const c = document.getElementById('splash-content'); c.style.transition = 'opacity 0.5s ease,transform 0.5s ease'; c.style.opacity = '0'; c.style.transform = 'translateY(-30px)'; document.getElementById('splash-screen').style.transition = 'opacity 0.6s ease'; document.getElementById('splash-screen').style.opacity = '0'; }, 3200);
  setTimeout(() => { document.getElementById('splash-screen').style.display = 'none'; document.getElementById('app-root').classList.add('show'); iniciarApp(); }, 3800);
}

export function startExperience() {
  resumeAudio();
  document.getElementById('entry-screen').style.transition = 'opacity 0.4s ease';
  document.getElementById('entry-screen').style.opacity = '0';
  setTimeout(() => { document.getElementById('entry-screen').style.display = 'none'; runSplash(); }, 400);
}
