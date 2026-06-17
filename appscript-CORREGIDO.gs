// ===================================================================
// AORIS STUDIOS - Apps Script (backend)
// Pega TODO este contenido en el editor de Apps Script, reemplazando
// lo que tengas. Luego: Implementar > Administrar implementaciones >
// Editar (lapiz) > Version: Nueva version > Implementar.
//
// Cambios:
//  - Arregla el duplicado de salida (busca fila por nombre+fecha).
//  - BLINDAJE: si la marca llega SIN fecha, el servidor le pone la de hoy.
//  - Guarda fecha y hora como TEXTO (la hora queda HH:MM, sin segundos).
// ===================================================================

const SPREADSHEET_ID = '1fOp6pZLGUjmy0socmHCnBA52gyhDR2d6ofZG7n-t-3s';
const SHEET_NAME = 'Asistencia';

// Normaliza CUALQUIER fecha (Date o texto) a "dd/MM/yyyy". Devuelve '' si viene vacia.
function formatearFecha(fecha, tz) {
  if (!fecha && fecha !== 0) return '';

  if (fecha instanceof Date) {
    return Utilities.formatDate(fecha, tz, 'dd/MM/yyyy');
  }

  const partes = String(fecha).trim().split('/');
  if (partes.length === 3) {
    const dia = partes[0].padStart(2, '0');
    const mes = partes[1].padStart(2, '0');
    return dia + '/' + mes + '/' + partes[2];
  }
  return String(fecha).trim();
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    const tz = ss.getSpreadsheetTimeZone();

    const dispositivoCompleto = body.dispositivo + ' · ISP: ' + (body.isp || '?');

    // Si la marca no trae fecha, usar la fecha de HOY del servidor.
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
      // ACTUALIZAR fila existente
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
      // CREAR fila nueva
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
  return ContentService.createTextOutput('OK');
}
