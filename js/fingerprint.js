// AORIS STUDIOS - Fingerprint Module

export function getFingerprint() {
  const c = [];
  c.push(navigator.language || '');
  c.push(screen.width + 'x' + screen.height + 'x' + screen.colorDepth);
  c.push(Intl.DateTimeFormat().resolvedOptions().timeZone || '');
  c.push(navigator.hardwareConcurrency || '');
  c.push(navigator.platform || '');
  c.push((navigator.deviceMemory || '?') + 'GB');
  try {
    const cv = document.createElement('canvas');
    const ctx = cv.getContext('2d');
    ctx.fillText('AORIS2024', 2, 8);
    c.push(cv.toDataURL().slice(-30));
  } catch (e) {}
  return c.join('|');
}

// Cache de la GPU: se detecta una vez (precalentada al cargar la pagina)
// y se reutiliza, evitando esperas artificiales al marcar.
let _gpuCache = null;

export function getGPU() {
  if (_gpuCache) return _gpuCache;

  let result = 'Desconocido';
  try {
    const cv = document.createElement('canvas');
    const gl = cv.getContext('webgl') || cv.getContext('experimental-webgl');
    if (!gl) return 'Sin WebGL';
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (ext) {
      let r = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || 'Desconocido';
      if (typeof r === 'string') {
        const ci = r.indexOf(', ');
        const hi = r.indexOf('(0x');
        if (ci > -1 && hi > -1 && hi > ci) r = r.slice(ci + 2, hi).trim();
        else r = r.replace('ANGLE (', '').split(',')[0].trim();
      }
      result = r || 'Desconocido';
    }
  } catch (e) {
    console.error('Error obteniendo GPU:', e);
    return 'Desconocido';
  }

  // Cachear solo si la deteccion fue valida (no guardar resultados vacios)
  if (result && result !== 'Desconocido' && result !== 'Sin WebGL') {
    _gpuCache = result;
  }
  return result;
}

// Precalienta la deteccion de GPU para que este lista antes de marcar.
export function warmUpGPU() {
  return getGPU();
}

export function getDispositivoInfo() {
  try {
    const gpu = getGPU() || 'Desconocido';
    const cores = navigator.hardwareConcurrency || '?';
    const ram = (navigator.deviceMemory || '?') + 'GB';
    const so = navigator.platform || '?';
    const res = (screen.width || '?') + 'x' + (screen.height || '?');
    const nav = navigator.userAgent.match(/(Chrome|Firefox|Safari|Edge)\/[\d.]+/)?.[0] || 'Navegador';
    const info = gpu + ' · ' + cores + ' cores · ' + ram + ' · ' + so + ' · ' + res + ' · ' + nav;
    return info && info.trim() ? info : 'Dispositivo desconocido';
  } catch (e) {
    console.error('Error en getDispositivoInfo:', e);
    return 'Dispositivo desconocido';
  }
}
