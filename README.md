# AORIS STUDIOS — Sistema de Asistencia

Control de asistencia digital para AORIS STUDIOS. App web _vanilla_ (HTML/CSS/JS con módulos ES nativos), backend en Google Apps Script y hosting en Netlify. Sin bundler ni paso de build.

## Estructura

```
Asistencia-AORIS/
├── index.html            # Estructura de la UI (sin onclick ni estilos inline estáticos)
├── css/
│   └── styles.css        # Estilos
├── js/                   # Módulos ES (type="module")
│   ├── config.js         # Fuente única de verdad (EMPLEADOS) + URLs y constantes
│   ├── utils.js          # Helpers de fecha/hora y cálculos
│   ├── data.js           # Acceso a datos: descarga y parsea el CSV del Sheet
│   ├── api.js            # Envío de marcas al Apps Script + detección de IP/ISP
│   ├── storage.js        # localStorage (sesión del día)
│   ├── fingerprint.js    # Info de dispositivo (GPU, cores, RAM) con cache
│   ├── audio.js          # Sonidos (beeps sintetizados)
│   ├── ui.js             # Utilidades de UI (tema, countdown, toast)
│   ├── auth.js           # Validación de PIN e ISP
│   ├── asistencia.js     # Lógica de entrada/salida y modales
│   ├── historial.js      # Historial mensual por empleado
│   ├── jefe.js           # Vista de administrador
│   ├── splash.js         # Animaciones de inicio
│   ├── eventos.js        # Cableado de la UI (addEventListener, delegación)
│   ├── app.js            # Orquestador principal
│   └── health-check.js   # Validación de módulos (debug)
├── eslint.config.js      # Configuración de ESLint
├── .prettierrc.json      # Configuración de Prettier
├── .editorconfig
├── .gitattributes        # Normaliza finales de línea a LF
├── package.json
└── README.md
```

## Stack

- **Frontend:** HTML/CSS/JavaScript vanilla con módulos ES nativos (sin bundler).
- **Backend:** Google Apps Script (serverless) que escribe en Google Sheets.
- **Lectura de histórico:** CSV público del Sheet.
- **Storage de sesión:** localStorage (estado del día).
- **Deploy:** Netlify (hosting estático).

## Funcionalidades

### Empleados
- Marcar entrada/salida con PIN.
- Validación de ISP autorizado (configurable por empleado).
- Barra de progreso del turno y cuenta regresiva.
- Historial del mes ("Mi rendimiento").
- Tema día/noche automático (hora de Lima).
- Aviso si una marca no se pudo guardar (sin conexión).

### Administrador
- Vista de registros con filtros (hoy/semana, empleado, estado).
- Información del dispositivo por marca (GPU, cores, RAM, SO, ISP).
- Alertas por ISP fuera de lo autorizado.

## Empleados (configuración)

Todo lo de cada empleado vive en un único arreglo `EMPLEADOS` en `js/config.js`
(pin, horas de turno, si valida ISP, colores y avatar). Para agregar o cambiar
un empleado, se edita **solo ese arreglo**.

| Nombre  | PIN  | Turno | Valida ISP |
|---------|------|-------|------------|
| Ronald  | 2323 | 7.5h  | Sí         |
| Brandon | 1456 | 7.5h  | Sí         |
| Mathias | 2867 | 9h    | No         |

**PIN de administrador:** `1215` (5 clics en el logo de AORIS).

## Configuración

En `js/config.js`:
- `SCRIPT_URL` — endpoint del Apps Script (recibe los POST de marcado).
- `CSV_URL` — URL pública (CSV) del Sheet para leer el histórico.
- `ISP_AUTORIZADO` — ISP permitido.
- `EMPLEADOS` — fuente única de datos por empleado.
- `JEFE_PIN` — PIN de la vista de administrador.

> Importante: `SCRIPT_URL` y `CSV_URL` deben apuntar al **mismo** Google Sheet.

## Backend (Apps Script)

La app envía un POST al `SCRIPT_URL` con:

```
{ nombre, fecha, hora, tipo: "entrada"|"salida", isp, dispositivo, alerta, temprano, fingerprintHash }
```

El script busca la fila por nombre+fecha y la actualiza, o crea una nueva, y
responde `{ ok: true }`. La app lee esa respuesta para confirmar el guardado.

> Tras editar el código del Apps Script hay que publicar una **versión nueva**
> (Implementar → Administrar implementaciones → Editar → Versión: nueva) para
> que el cambio tome efecto en la URL `/exec`.

## Desarrollo local

Necesita un servidor (los módulos ES no funcionan abriendo el archivo con `file://`):

```bash
python -m http.server 8000   # o:  npm run serve
# abrir http://localhost:8000
```

### Tooling

```bash
npm install        # instala ESLint y Prettier (una sola vez)
npm run lint       # revisa el código
npm run format     # formatea el código
```

## Despliegue (Netlify)

1. `commit` + `push` a GitHub.
2. Netlify despliega automáticamente la rama conectada.

## Autor

Deiv Rivera · AORIS STUDIOS

## Licencia

Privada — uso interno de AORIS STUDIOS.
