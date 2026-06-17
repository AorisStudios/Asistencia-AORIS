// ===================================================================
// AORIS STUDIOS - Apps Script (backend)
// Pega TODO esto en el editor de Apps Script, reemplazando lo que tengas.
// Luego: Implementar > Administrar implementaciones > Editar (lapiz) >
// Version: Nueva version > Implementar.
//
// - doPost: guarda la marca (entrada/salida) en el Sheet.
// - doGet : devuelve registros + feriados + ausencias en JSON (tiempo real).
// ===================================================================

const SPREADSHEET_ID = '1fOp6pZLGUjmy0socmHCnBA52gyhDR2d6ofZG7n-t-3s';
const SHEET_NAME = 'Asistencia';
const FERIADOS_SHEET = 'Feriados';
const AUSENCIAS_SHEET = 'Ausencias';

// Normaliza una fecha (Date o texto) a "dd/MM/yyyy". Devuelve '' si viene vacia.
function formatearFecha(fecha, tz) {
  if (!fecha && fecha !== 0) return '';
  if (fecha && typeof fecha.getMonth === 'function') {
    return Utilities.formatDate(fecha, tz, 'dd/MM/yyyy');
  }
  const partes = String(fecha).trim().split('/');
  if (partes.length === 3) {
    return partes[0].padStart(2, '0') + '/' + partes[1].padStart(2, '0') + '/' + partes[2];
  }
  return String(fecha).trim();
}

// Normaliza una hora (Date o texto) a "HH:mm".
function formatearHora(hora, tz) {
  if (!hora && hora !== 0) return '';
  if (hora && typeof hora.getHours === 'function') {
    return Utilities.formatDate(hora, tz, 'HH:mm');
  }
  return String(hora).trim();
}

function leerFeriados(ss, tz) {
  const sh = ss.getSheetByName(FERIADOS_SHEET);
  if (!sh) return [];
  const d = sh.getDataRange().getDisplayValues();
  const out = [];
  for (let i = 1; i < d.length; i++) {
    const fecha = formatearFecha(d[i][0], tz);
    if (!fecha) continue;
    const esLaboral = ['si', 'sí', 'true', '1', 'x'].indexOf((d[i][2] + '').trim().toLowerCase()) > -1;
    out.push({ fecha: fecha, nombre: (d[i][1] + '').trim(), esLaboral: esLaboral });
  }
  return out;
}

function leerAusencias(ss, tz) {
  const sh = ss.getSheetByName(AUSENCIAS_SHEET);
  if (!sh) return [];
  const d = sh.getDataRange().getDisplayValues();
  const out = [];
  for (let i = 1; i < d.length; i++) {
    const empleado = (d[i][0] + '').trim();
    const desde = formatearFecha(d[i][1], tz);
    if (!empleado || !desde) continue;
    const horasRaw = (d[i][4] + '').trim();
    out.push({
      empleado: empleado,
      desde: desde,
      hasta: formatearFecha(d[i][2], tz) || desde,
      tipo: (d[i][3] + '').trim(),
      horas: horasRaw === '' ? null : Number(horasRaw),
      estado: (d[i][5] + '').trim(),
      motivo: (d[i][6] + '').trim()
    });
  }
  return out;
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    const tz = ss.getSpreadsheetTimeZone();

    const dispositivoCompleto = body.dispositivo + ' · ISP: ' + (body.isp || '?');
    const hoy = Utilities.formatDate(new Date(), tz, 'dd/MM/yyyy');
    const fechaBuscada = formatearFecha(body.fecha, tz) || hoy;

    const data = sheet.getDataRange().getValues();
    let rowFound = -1;

    for (let i = 1; i < data.length; i++) {
      const nombreEnFila = (data[i][1] + '').trim();
      const fechaEnFila = formatearFecha(data[i][2], tz);
      if (nombreEnFila === body.nombre && fechaEnFila === fechaBuscada) {
        rowFound = i + 1;
        break;
      }
    }

    if (rowFound > 0) {
      if (body.tipo === 'entrada') {
        sheet.getRange(rowFound, 4).setNumberFormat('@').setValue(body.hora);
        sheet.getRange(rowFound, 7).setValue(dispositivoCompleto);
      } else {
        sheet.getRange(rowFound, 5).setNumberFormat('@').setValue(body.hora);
        sheet.getRange(rowFound, 8).setValue(dispositivoCompleto);
        sheet.getRange(rowFound, 6).setValue(body.temprano);
      }
      sheet.getRange(rowFound, 9).setValue(body.alerta);
    } else {
      const lastRow = sheet.getLastRow() + 1;
      sheet.getRange(lastRow, 1).setValue(lastRow - 1);
      sheet.getRange(lastRow, 2).setValue(body.nombre);
      sheet.getRange(lastRow, 3).setNumberFormat('@').setValue(fechaBuscada);
      if (body.tipo === 'entrada') {
        sheet.getRange(lastRow, 4).setNumberFormat('@').setValue(body.hora);
        sheet.getRange(lastRow, 7).setValue(dispositivoCompleto);
      } else {
        sheet.getRange(lastRow, 5).setNumberFormat('@').setValue(body.hora);
        sheet.getRange(lastRow, 8).setValue(dispositivoCompleto);
      }
      sheet.getRange(lastRow, 9).setValue(body.alerta);
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    const tz = ss.getSpreadsheetTimeZone();
    const data = sheet.getDataRange().getValues();

    const registros = [];
    for (let i = 1; i < data.length; i++) {
      const nombre = (data[i][1] + '').trim();
      const entrada = formatearHora(data[i][3], tz);
      if (!nombre || !entrada) continue;
      registros.push({
        nombre: nombre,
        fecha: formatearFecha(data[i][2], tz),
        entrada: entrada,
        salida: formatearHora(data[i][4], tz),
        temprano: (data[i][5] + '').trim(),
        dispEntrada: (data[i][6] + '').trim(),
        dispSalida: (data[i][7] + '').trim(),
        alerta: (data[i][8] + '').trim()
      });
    }

    return ContentService.createTextOutput(JSON.stringify({
      ok: true,
      registros: registros,
      feriados: leerFeriados(ss, tz),
      ausencias: leerAusencias(ss, tz)
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
