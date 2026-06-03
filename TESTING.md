# 🧪 AORIS Asistencia - Guía de Testing

## ✅ Verificación Pre-Despliegue

### 1. **Estructura de Carpetas**
Verifica que la estructura sea:
```
aoris-asistencia/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── config.js
│   ├── utils.js
│   ├── audio.js
│   ├── fingerprint.js
│   ├── api.js
│   ├── storage.js
│   ├── ui.js
│   ├── auth.js
│   ├── asistencia.js
│   ├── jefe.js
│   ├── historial.js
│   ├── splash.js
│   ├── app.js
│   └── health-check.js
└── assets/
    └── avatars/ (vacío por ahora)
```

### 2. **Testing Local**

#### Opción A: Usando `python -m http.server`
```bash
cd aoris-asistencia
python -m http.server 8000
# Abre http://localhost:8000
```

#### Opción B: Usando Node.js http-server
```bash
npm install -g http-server
cd aoris-asistencia
http-server
# Abre http://localhost:8080
```

### 3. **Health Check en Consola**
1. Abre DevTools (F12)
2. Ve a la pestaña "Console"
3. Ejecuta:
```javascript
import('./js/health-check.js').then(m => m.healthCheck());
```
4. Deberías ver una tabla con ✅ en todos los módulos

### 4. **Verificaciones Manuales**

#### Entry Screen (Pantalla de entrada)
- [ ] El fondo tiene un grid animado (líneas doradas)
- [ ] Aparece un icono AORIS que flota
- [ ] Una frase de motivación se escribe con efecto typewriter
- [ ] Después de completar la frase, aparece "TOCA PARA ENTRAR"
- [ ] Al hacer click, la pantalla se desvanece

#### Splash Screen (Animación)
- [ ] El icono AORIS entra con scale animation
- [ ] Las letras "AORIS" aparecen una por una
- [ ] "STUDIOS" se fade in
- [ ] Una línea dorada crece horizontalmente
- [ ] Aparecen día, fecha y mensaje con emoji
- [ ] Tres puntos pulsantes en la parte inferior
- [ ] Todo se desvanece después ~3.8 segundos

#### App Principal
- [ ] Reloj digital en la esquina superior (actualiza cada segundo)
- [ ] Fecha legible debajo
- [ ] Icono sol (día) / luna (noche)
- [ ] 3 tarjetas de empleados: Ronald, Brandon, Mathias
- [ ] Las tarjetas tienen avatares (SVG) con sus colores

#### Selección de Empleado
- [ ] Click en una tarjeta la resalta con glow animation
- [ ] Aparece un input PIN
- [ ] Input PIN está en 4 caracteres máximo (password masked)
- [ ] Enter o click "Confirmar PIN" valida

#### PIN Validation
- [ ] **Ronald PIN**: `2323`
- [ ] **Brandon PIN**: `1456`
- [ ] **Mathias PIN**: `2867`
- [ ] PIN incorrecto: suena beep de error, mensaje rojo "PIN incorrecto"
- [ ] PIN correcto: suena beep de PIN, desaparece el box, aparece mensaje de bienvenida

#### Welcome Message
- [ ] Muestra "¡Hola, [nombre]! 👋"
- [ ] Muestra hora de entrada prevista y salida esperada
- [ ] Botón "✅ Marcar entrada" si no entró
- [ ] Botón "🚪 Marcar salida" si ya entró (después de las 13:30)

#### Tabla de Estado
- [ ] Se actualiza en tiempo real
- [ ] Muestra entrada, salida prevista, salida real
- [ ] Badge verde para "Entrada", amarillo para "Sale a las"

#### Tema (Día/Noche)
- [ ] 6:00 - 18:00: Tema claro (fondo claro, texto oscuro)
- [ ] 18:00 - 6:00: Tema oscuro (fondo oscuro, texto claro)
- [ ] El ícono sol/luna cambia automáticamente
- [ ] Transición suave entre temas

### 5. **Tests de Funcionalidad**

#### Entrada
1. Selecciona un empleado
2. Entra su PIN correcto
3. Verifica que:
   - [ ] Aparece modal de confirmación con hora de entrada
   - [ ] Se escucha sonido de entrada (beep ascendente)
   - [ ] La barra de progreso se inicia desde 0%
   - [ ] Aparece mensaje "Sales a las [hora]"

#### Salida
1. El mismo empleado hace click en "Marcar salida"
2. **Si falta tiempo**:
   - [ ] Aparece modal de alerta con countdown
   - [ ] Muestra horas/minutos/segundos faltantes
   - [ ] Botón "Salir igual" y "Volver"
3. **Si es a tiempo o tardío**:
   - [ ] Modal con opciones de razón de salida
   - [ ] Modal de despedida con confetti (si está en mensajes anticipada.confetti)

#### Historial (Mi rendimiento)
1. Haz click en "📊 Mi rendimiento" en la tarjeta
2. Verifica:
   - [ ] Modal historial se abre
   - [ ] Muestra estadísticas: días, promedio, completos, anticipadas
   - [ ] Tabla con registros del mes actual
   - [ ] Cada fila tiene fecha, entrada, salida, horas, porcentaje, estado

#### Vista de Jefe
1. Haz click 5 veces en el logo AORIS en 2 segundos
2. Aparece PIN input de administrador
3. Entra PIN: `1215`
4. Verifica:
   - [ ] Se abre vista oscura de jefe
   - [ ] Tabla con registros de asistencia
   - [ ] Filtros: Fecha (Hoy / Semana / Mes), Empleado, Estado
   - [ ] Badges de alerta (rojo para alertas)

### 6. **Tests de Responsividad**

#### Desktop (1024px+)
- [ ] 3 tarjetas lado a lado
- [ ] Tabla completa visible
- [ ] Sin scroll horizontal

#### Tablet (640px - 1023px)
- [ ] Tarjetas aún lado a lado
- [ ] Algunos elementos más pequeños
- [ ] Tabla scrollable horizontalmente si es necesario

#### Mobile (< 640px)
- [ ] Tarjetas apiladas verticalmente
- [ ] Fuentes más pequeñas
- [ ] Botones ocupan ancho completo
- [ ] Tabla scrollable

### 7. **Tests de Conectividad**

#### Google Apps Script
1. Marca entrada/salida
2. Abre la hoja de cálculos Google Sheets
3. Verifica que el registro aparezca con:
   - [ ] Nombre del empleado
   - [ ] Fecha
   - [ ] Hora de entrada
   - [ ] Hora de salida (si aplica)
   - [ ] ISP
   - [ ] Dispositivo/GPU
   - [ ] Alerta (si hay)

#### Carga desde CSV
1. Si hay registros previos en la hoja, el app debe cargarlos al iniciar
2. Verifica que los datos se muestren en las tarjetas al abrir

### 8. **Tests de Almacenamiento Local**

1. Entra con un empleado
2. Recarga la página (F5)
3. Verifica que:
   - [ ] La sesión se mantiene (localStorage)
   - [ ] Los datos de entrada siguen visibles
   - [ ] No necesita entrar PIN de nuevo

### 9. **Tests de Audio**

- [ ] 🔊 Sonido de bienvenida (4 beeps ascendentes)
- [ ] 🔊 Sonido de entrada (3 beeps)
- [ ] 🔊 Sonido de salida (3 beeps descendentes)
- [ ] 🔊 Sonido de error (buzz)
- [ ] 🔊 Sonido de PIN (beep único)

### 10. **Tests de Errores**

#### Validación de PC
1. Intenta marcar entrada desde una red diferente a la autorizada
2. Debería mostrar ⚠️ ISP diferente en la alerta

#### Fingerprint
1. Abre DevTools Console
2. Ejecuta: `window.appState.getFingerprint?.()`
3. Verifica que retorna un hash único

### 11. **Checklist Pre-Producción**

- [ ] No hay errores en la consola (F12 → Console)
- [ ] Todos los módulos cargan sin errores de import
- [ ] Google Apps Script URL es válida y responde
- [ ] CSV Sheet URL es válida y readable
- [ ] Todos los PINs funcionan (2323, 1456, 2867)
- [ ] PIN de jefe funciona (1215)
- [ ] Responsive en móvil, tablet y desktop
- [ ] Audio funciona en navegadores modernos
- [ ] LocalStorage funciona (sin errores de quota)

## 🚀 Despliegue en Netlify

1. Copia la carpeta `aoris-asistencia` a tu repo
2. Configura el build en Netlify:
   - Build command: (dejar vacío, no hay build step)
   - Publish directory: `/aoris-asistencia`
3. Commit y push a GitHub
4. Netlify desplegará automáticamente

## 📝 Notas

- **ES Modules**: Se usan módulos nativos de ES6. Requiere navegadores modernos (2020+)
- **CORS**: Google Apps Script maneja CORS con `mode: 'no-cors'`
- **Audio Context**: Se activa al primer click del usuario (requisito de navegadores)
- **LocalStorage**: Funciona en HTTP y HTTPS

## ❌ Troubleshooting

### "Module not found" en consola
- Verifica que los imports en los archivos .js coincidan exactamente con los nombres de archivo

### Sonidos no se escuchan
- Algunos navegadores requieren interacción del usuario primero
- El audio se activa en `startExperience()`

### PIN no valida
- Verifica que los PINs en `config.js` son correctos
- Ronald: `'2323'`, Brandon: `'1456'`, Mathias: `'2867'`

### Datos no guardan
- LocalStorage podría estar deshabilitado
- Intenta abrir consola: `localStorage.setItem('test', '1')`

### Registros no aparecen en hoja
- Verifica que SCRIPT_URL y CSV_URL en config.js son correctas
- Google Apps Script podría estar desactualizado
- Verifica la hoja de cálculos existe y está publicada
