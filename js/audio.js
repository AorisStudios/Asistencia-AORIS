// AORIS STUDIOS - Audio Module

const AC = new (window.AudioContext || window.webkitAudioContext)();

function beep(freq, dur, type, vol, delay) {
  const o = AC.createOscillator();
  const g = AC.createGain();
  o.connect(g);
  g.connect(AC.destination);
  o.type = type || 'sine';
  o.frequency.setValueAtTime(freq, AC.currentTime + delay);
  g.gain.setValueAtTime(vol || 0.2, AC.currentTime + delay);
  g.gain.exponentialRampToValueAtTime(0.001, AC.currentTime + delay + dur);
  o.start(AC.currentTime + delay);
  o.stop(AC.currentTime + delay + dur + 0.05);
}

export function sonidoBienvenida() {
  beep(440, 0.25, 'sine', 0.12, 0);
  beep(554, 0.25, 'sine', 0.12, 0.22);
  beep(659, 0.3, 'sine', 0.14, 0.44);
  beep(880, 0.5, 'sine', 0.1, 0.75);
}

export function sonidoEntrada() {
  beep(523, 0.15, 'sine', 0.3, 0);
  beep(659, 0.15, 'sine', 0.3, 0.15);
  beep(784, 0.25, 'sine', 0.35, 0.30);
}

export function sonidoSalida() {
  beep(784, 0.15, 'sine', 0.3, 0);
  beep(659, 0.15, 'sine', 0.3, 0.15);
  beep(523, 0.25, 'sine', 0.35, 0.30);
}

export function sonidoError() {
  beep(180, 0.12, 'sawtooth', 0.25, 0);
  beep(150, 0.15, 'sawtooth', 0.2, 0.12);
}

export function sonidoAlerta() {
  beep(440, 0.1, 'square', 0.2, 0);
  beep(440, 0.1, 'square', 0.2, 0.15);
  beep(440, 0.1, 'square', 0.2, 0.30);
}

export function sonidoPIN() {
  beep(880, 0.08, 'sine', 0.15, 0);
}

export function resumeAudio() {
  if (AC.state === 'suspended') {
    AC.resume();
  }
}
