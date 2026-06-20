// AORIS STUDIOS - API Module

import { SCRIPT_URL } from './config.js';

export let ipInfo = {};

export async function obtenerIPInfo() {
  const servicios = [
    () => fetch('https://ipapi.co/json/').then(r => r.json()).then(d => ({ query: d.ip, isp: d.org, city: d.city })),
    () => fetch('https://api.ipify.org?format=json').then(r => r.json()).then(d => ({ query: d.ip, isp: '', city: '' })),
    () => fetch('https://icanhazip.com').then(r => r.text()).then(ip => ({ query: ip.trim(), isp: '', city: '' })),
    () => fetch('https://ifconfig.co/json').then(r => r.json()).then(d => ({ query: d.ip, isp: d.organisation || '', city: d.city || '' }))
  ];
  function probar(i) {
    if (i >= servicios.length) {
      ipInfo = {};
      return Promise.resolve({});
    }
    return servicios[i]()
      .then(d => { if (d && d.query) { ipInfo = d; return d; } return probar(i + 1); })
      .catch(() => probar(i + 1));
  }
  return probar(0);
}

export async function enviarMarquilla(nombre, fecha, hora, tipo, dispositivo, alerta, temprano, fpHash) {
  const isp = (ipInfo && ipInfo.isp) ? ipInfo.isp : '?';
  const payload = {
    nombre,
    fecha,
    hora,
    tipo,
    isp,
    dispositivo,
    alerta,
    temprano,
    fingerprintHash: fpHash
  };

  // Petición "simple" (sin Content-Type personalizado) para evitar el preflight
  // CORS que Apps Script no maneja. Así sí se puede leer la respuesta y verificar.
  // Apps Script igual parsea el body con JSON.parse, así que no afecta al guardado.
  const res = await fetch(SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  // Intentar confirmar con la respuesta del servidor.
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    // Respuesta no legible (CORS opaco): se envió pero no se puede verificar.
  }

  if (data && data.ok === false) {
    throw new Error(data.error || 'El servidor rechazó el guardado');
  }

  // data.ok === true -> confirmado | data === null -> enviado, no verificable
  return data || { ok: true, verificado: false };
}

// Envía una acción de gestión al Apps Script (crear/editar/eliminar ausencias).
export async function enviarAccion(payload) {
  const res = await fetch(SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    // respuesta no legible
  }
  if (data && data.ok === false) {
    throw new Error(data.error || 'No se pudo completar la acción');
  }
  return data || { ok: true };
}
