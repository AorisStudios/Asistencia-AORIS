// AORIS STUDIOS - API Module

import { SCRIPT_URL, CSV_URL } from './config.js';

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

export function enviarMarquilla(nombre, fecha, hora, tipo, dispositivo, alerta, temprano, fpHash) {
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

  console.log('📤 Enviando payload:', payload);
  console.log('Dispositivo que se envía:', dispositivo);
  console.log('ISP que se envía:', isp);

  return fetch(SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}
