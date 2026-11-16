# XuperTizen Windows 0.1.1 beta

Misma interfaz que Tizen: TV, Películas, Series, lupa y ajustes. Ratón, rueda, flechas, Enter, Escape/Atrás; F11 alterna pantalla completa. La ventana también se puede maximizar. El instalador por usuario no requiere administrador.

## Arquitectura

- `desktop/main.cjs`: ventana Electron, origen local estable `xuper://app`, recursos empaquetados, puente de red y permisos.
- `desktop/preload.cjs`: API acotada con aislamiento de contexto. La página no recibe Node, archivos, shell ni IPC arbitrario.
- `desktop/transport.cjs`: HTTP(S) de Node con Host/SNI originales, certificados validados, rangos para VOD, cancelación, redirecciones controladas, cuatro descargas activas y 24 en espera como máximo. Cada respuesta tiene límite de 16 MiB; las lecturas VOD siguen por bloques.
- `desktop/dns.cjs`: consultas DoH por IP a los 17 resolutores configurados en la app. Primera respuesta A pública válida, caché 10 minutos; alternativa al DNS de Windows y pausa de DoH cinco minutos ante fallo. No cambia el DNS del sistema.
- `browser/desktop-transport.js`: adapta ese puente al mismo contrato de transporte usado por Tizen. La selección de esta capa ocurre solo si existe el puente de escritorio.
- `tools/build-desktop.mjs`: copia la interfaz compartida y adapta textos de plataforma. El catálogo, protocolo, biblioteca, HLS.js, MPEG-TS y reglas de búfer tienen una única implementación.
- El diseño Zinc de shadcn es la misma adaptación CSS que en TV. No se añade React/Radix ni se mantiene otra interfaz divergente.

No usa el binario Samsung ni AVPlay. Reutiliza HLS.js, MPEG-TS/MSE y MP4 con las capacidades del Chromium de Electron. La compatibilidad HEVC/AC3/EAC3 depende del equipo y del motor; esta beta no añade FFmpeg/mpv. No se promete compatibilidad con todos los títulos.

## Sistemas y recursos

- Instaladores separados x64 y ia32/x86, Electron fijado en 43.8.10: ambos binarios verificados en el release de Electron. Las ramas posteriores no siempre incluyen ia32.
- Windows 10 de 32/64 bits; Windows 11 es un sistema de 64 bits. La compilación x86 también puede ejecutarse bajo WOW64, aunque se recomienda x64 en equipos de 64 bits.
- Objetivo inicial: CPU con SSE3 y 4 GB de RAM. No se garantiza reproducción HD/HEVC en equipos de 2 GB o sin decodificación apropiada. Se mantiene la aceleración gráfica cuando está disponible.
- Una ventana, servicio compartido, cachés acotadas, carga diferida de VOD, cola de red limitada. No se inicia con Windows ni queda en bandeja al cerrar.
- Al cerrar la ventana se intenta guardar el progreso antes de destruir los servicios. El origen de almacenamiento es estable, independiente del directorio de instalación. El historial no se borra al reinstalar.
- El instalador beta no tiene firma Authenticode; Windows puede mostrar aviso de editor desconocido. La firma de Samsung/Apps2Samsung no sirve para Windows.

## Construcción y comprobaciones

```sh
npm ci
npm run build
node tools/build-desktop.mjs
npm ci --prefix desktop
node --test tests/desktop/*.test.mjs
desktop/node_modules/.bin/electron tools/desktop-smoke.cjs
npm run dist --prefix desktop
```

GitHub Actions construye ambos `.exe` en Windows, ejecuta un arranque real de Electron y adjunta los instaladores y sus hashes a `v0.10.20-beta.1`. La prueba de arranque comprueba el protocolo local, preload aislado, Worker, puente de DNS, encabezado compartido, rechazo de URL no admitida y pantalla completa. No equivale a reproducción prolongada contra el proveedor ni a una prueba en Windows de 32 bits físico.

Antes de promover a estable: pruebas de sesiones largas y reanudación en Windows 10 x86/x64 y Windows 11 x64, selección de audio/subtítulos y decodificación HEVC, medición de RAM en PC modesto y comprobación de instalación/actualización con perfiles existentes.
