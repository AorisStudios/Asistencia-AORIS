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

export function getGPU() {
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
      return r;
    }
  } catch (e) {}
  return 'Desconocido';
}

export function getDispositivoInfo() {
  const gpu = getGPU();
  const cores = navigator.hardwareConcurrency || '?';
  const ram = (navigator.deviceMemory || '?') + 'GB';
  const so = navigator.platform || '?';
  const res = screen.width + 'x' + screen.height;
  const nav = navigator.userAgent.match(/(Chrome|Firefox|Safari|Edge)\/[\d.]+/)?.[0] || 'Desconocido';
  return gpu + ' · ' + cores + ' cores · ' + ram + ' · ' + so + ' · ' + res + ' · ' + nav;
}
