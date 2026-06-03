# AORIS STUDIOS - Sistema de Asistencia

Control de asistencia digital para AORIS STUDIOS. App vanilla JS con módulos ES Modules, Google Apps Script como backend, y Netlify para hosting.

## 📁 Estructura

```
aoris-asistencia/
├── index.html              # HTML principal (limpio, sin código JS incrustado)
├── css/
│   └── styles.css         # Todo el CSS consolidado (7000+ líneas)
├── js/                    # Módulos ES (type="module")
│   ├── config.js         # Constantes (PINs, URLs, empleados)
│   ├── utils.js          # Helpers (fecha, tiempo, cálculos)
│   ├── audio.js          # Síntesis de audio (beeps)
│   ├── fingerprint.js    # Hardware info (GPU, cores, RAM)
│   ├── api.js            # Fetch IP + Google Apps Script
│   ├── storage.js        # localStorage wrapper
│   ├── ui.js             # DOM utilities
│   ├── auth.js           # PIN validation
│   ├── asistencia.js     # Lógica entrada/salida
│   ├── jefe.js           # Vista de administrador
│   ├── historial.js      # Registros del mes
│   ├── splash.js         # Animaciones iniciales
│   ├── app.js            # Orquestador principal
│   └── health-check.js   # Validación de módulos
├── assets/
│   └── avatars/          # (Vacío por ahora)
├── TESTING.md            # Guía completa de testing
└── README.md             # Este archivo
```

## 🚀 Stack Tecnológico

- **Frontend**: HTML/CSS/JavaScript vanilla
- **Módulos**: ES Modules nativos (sin bundler, directo a producción)
- **Backend**: Google Apps Script (API serverless)
- **Storage**: localStorage (sesión diaria) + Google Sheets (histórico)
- **Deployment**: Netlify (static hosting)

## 🎯 Funcionalidades

### Para Empleados
- ✅ Marcar entrada/salida con PIN
- ✅ Validación de ISP autorizado
- ✅ Barra de progreso del turno
- ✅ Alertas si falta completar turno
- ✅ Historial del mes actual
- ✅ Tema día/noche automático

### Para Administrador
- ✅ Vista de registros con filtros
- ✅ Información de dispositivo (GPU, cores, SO)
- ✅ Alertas por ISP fuera de rango
- ✅ Búsqueda por fecha, empleado, estado

## 📋 Empleados (Hardcoded)

| Nombre | PIN | Turno | Color |
|--------|-----|-------|-------|
| Ronald | 2323 | 7.5h | #C4A8FF (púrpura) |
| Brandon | 1456 | 7.5h | #FFBC6B (naranja) |
| Mathias | 2867 | 9h | #8DCF5B (verde) |

**Admin PIN**: `1215` (5 clicks en logo AORIS)

## 🔧 Configuración

Edita `js/config.js`:
- `SCRIPT_URL`: Endpoint de Google Apps Script
- `CSV_URL`: URL pública de la hoja de cálculos (CSV)
- `ISP_AUTORIZADO`: ISP permitido para entrada/salida
- `PINS`: Diccionario de PINs por empleado
- `JEFE_PIN`: PIN de acceso a vista de jefe

## 📱 Responsive

- **Mobile** (<640px): Tarjetas stacked, fuentes pequeñas
- **Tablet** (640-1023px): Tarjetas 2-3 por fila
- **Desktop** (>1024px): Layout completo 3 tarjetas lado a lado

## 🎨 Temas

- **Día** (6:00-18:00): Fondo claro, texto oscuro, amarillo AORIS
- **Noche** (18:00-6:00): Fondo oscuro, texto claro, azul neón

## 🔌 API (Google Apps Script)

```javascript
// POST al SCRIPT_URL con:
{
  nombre: "Ronald",
  fecha: "25/12/2024",
  hora: "09:30:45",
  tipo: "entrada" | "salida",
  ip: "ISP Name",
  dispositivo: "GPU · cores · RAM · SO · res · Nav",
  alerta: "✅ ISP: RED INTERCABLE...",
  temprano: "faltaron 45min" | "",
  fingerprintHash: "DEADBEEF"
}
```

La respuesta se guarda en Google Sheets automáticamente.

## 💾 Storage

### LocalStorage (por sesión)
```javascript
{
  fecha: "25/12/2024",
  estado: {
    Ronald: { entrada: "09:30:45", salida: "17:30:45", temprano: "" },
    Brandon: { entrada: "10:00:00", salida: null, temprano: "" },
    Mathias: { entrada: null, salida: null, temprano: "" }
  }
}
```

### Google Sheets (histórico)
Columnas: Nombre | Fecha | Entrada | Salida | Temprano | ISP | Dispositivo | Alerta

## 🧪 Testing Local

```bash
# Opción 1: Python
python -m http.server 8000
# Abre http://localhost:8000

# Opción 2: Node.js
npx http-server
# Abre http://localhost:8080
```

Ver `TESTING.md` para checklist completo.

## 📊 Health Check

En consola:
```javascript
import('./js/health-check.js').then(m => m.healthCheck());
```

## 🐛 Debugging

En consola:
```javascript
// Estado actual
window.appState.estado

// Hora GMT-5
window.appState.gmt5()

// Iniciar app manualmente
window.appState.iniciarApp()
```

## 🔐 Seguridad

- ✅ PIN validation local
- ✅ Fingerprint + ISP check
- ✅ No credenciales en URLs (Google Apps Script usa POST)
- ✅ CORS handled via `mode: 'no-cors'`

## 📈 Performance

- **Cero build step**: Módulos nativos ES6
- **Lightweight**: ~150KB CSS + JS combinados (sin gzip)
- **Fast**: LocalStorage para sesión, CSV para histórico
- **Offline-ready**: Funciona sin conexión (dentro de la sesión)

## 🚢 Despliegue Netlify

1. Commit `aoris-asistencia/` a GitHub
2. Connect repo a Netlify
3. Build command: (dejar vacío)
4. Publish directory: `aoris-asistencia/`
5. Deploy

La app estará live en https://tu-sitio.netlify.app

## 📝 Notas

- No requiere compilación ni bundler
- Funciona en navegadores 2020+ (Chrome, Firefox, Safari, Edge)
- Google Apps Script debe estar publicado y accesible
- Hoja de Google Sheets debe ser pública (o con acceso compartido)

## 👤 Autor

Deiv Rivera | AORIS STUDIOS

## 📄 Licencia

Privada - Solo para AORIS STUDIOS
