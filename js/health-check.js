// AORIS STUDIOS - Health Check Module
// Valida que todos los módulos se cargaron correctamente

export async function healthCheck() {
  console.log('🏥 AORIS Health Check iniciando...');

  const checks = [];

  try {
    const config = await import('./config.js');
    checks.push({ name: 'config.js', ok: !!(config.SCRIPT_URL && config.PINS), msg: config.SCRIPT_URL ? '✅' : '❌ SCRIPT_URL no encontrada' });
  } catch (e) { checks.push({ name: 'config.js', ok: false, msg: '❌ Error: ' + e.message }); }

  try {
    const utils = await import('./utils.js');
    checks.push({ name: 'utils.js', ok: !!(utils.gmt5 && utils.fmt), msg: utils.gmt5 ? '✅' : '❌' });
  } catch (e) { checks.push({ name: 'utils.js', ok: false, msg: '❌ Error: ' + e.message }); }

  try {
    const audio = await import('./audio.js');
    checks.push({ name: 'audio.js', ok: !!(audio.sonidoBienvenida && audio.resumeAudio), msg: '✅' });
  } catch (e) { checks.push({ name: 'audio.js', ok: false, msg: '❌ Error: ' + e.message }); }

  try {
    const fingerprint = await import('./fingerprint.js');
    checks.push({ name: 'fingerprint.js', ok: !!(fingerprint.getFingerprint && fingerprint.getGPU), msg: '✅' });
  } catch (e) { checks.push({ name: 'fingerprint.js', ok: false, msg: '❌ Error: ' + e.message }); }

  try {
    const api = await import('./api.js');
    checks.push({ name: 'api.js', ok: !!(api.obtenerIPInfo && api.enviarMarquilla), msg: '✅' });
  } catch (e) { checks.push({ name: 'api.js', ok: false, msg: '❌ Error: ' + e.message }); }

  try {
    const storage = await import('./storage.js');
    checks.push({ name: 'storage.js', ok: !!(storage.cargarLocal && storage.guardarLocal), msg: '✅' });
  } catch (e) { checks.push({ name: 'storage.js', ok: false, msg: '❌ Error: ' + e.message }); }

  try {
    const ui = await import('./ui.js');
    checks.push({ name: 'ui.js', ok: !!(ui.typeWriter && ui.aplicarTema), msg: '✅' });
  } catch (e) { checks.push({ name: 'ui.js', ok: false, msg: '❌ Error: ' + e.message }); }

  try {
    const auth = await import('./auth.js');
    checks.push({ name: 'auth.js', ok: !!(auth.selEmp && auth.verPin), msg: '✅' });
  } catch (e) { checks.push({ name: 'auth.js', ok: false, msg: '❌ Error: ' + e.message }); }

  try {
    const splash = await import('./splash.js');
    checks.push({ name: 'splash.js', ok: !!(splash.runSplash && splash.startExperience), msg: '✅' });
  } catch (e) { checks.push({ name: 'splash.js', ok: false, msg: '❌ Error: ' + e.message }); }

  const allOk = checks.every(c => c.ok);
  console.log('═══════════════════════════════════════');
  console.table(checks.map(c => ({ Módulo: c.name, Estado: c.msg })));
  console.log('═══════════════════════════════════════');
  console.log(allOk ? '✅ Todos los módulos cargados correctamente' : '❌ Algunos módulos no cargaron');

  return { allOk, checks };
}

// Ejecutar en consola: import('./js/health-check.js').then(m => m.healthCheck());
