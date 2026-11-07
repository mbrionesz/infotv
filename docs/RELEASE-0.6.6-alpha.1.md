# XuperTizen 0.6.6 alpha

## Películas y series: nueva ruta MP4/MPEG-TS con autorización

Los archivos MP4/TS del portal que requieren Content-Auth y Content-License ya tienen una implementación de reproducción por MediaSource. Antes se rechazaban porque AVPlay no admite esas cabeceras personalizadas.

- Lectura HTTP Range en bloques de 512 KiB, con autorización por servidor, validación de rangos, cancelación y reintento de fallos temporales.
- MP4Box remultiplexa MP4 a fragmentos reproducibles, con soporte para metadatos al principio o al final y búsqueda por índice.
- mpegts.js remultiplexa MPEG-TS a fragmentos reproducibles. **Cuando el TS no tiene índice, el avance se limita al tramo ya cargado**; un salto fuera de ese tramo muestra un aviso y conserva la reproducción, evitando el bloqueo anterior.
- Servidor de respaldo antes de iniciar si la primera ruta falla; se conservan las cabeceras propias de cada candidato.
- Carga del módulo VOD solo cuando se necesita: TV en vivo y HLS no descargan las bibliotecas adicionales.

Requiere Range para archivos grandes y códecs que admita MediaSource del TV. No es transcodificación ni garantiza todos los códecs, DRM o servidores. El remultiplexado de esta versión se hace en el hilo principal con bloques acotados; falta medir su rendimiento real en Samsung. [Detalles](VOD-PROGRESSIVE.md).

## Arranque

XuperTizen / by Matias se muestra antes del runtime pesado, ocupa correctamente 1080p/4K y permanece al menos 1,8 s tras iniciar la app. Se elimina el temporizador de 250 ms y se evita que el OK de lanzamiento salte inmediatamente la marca. La versión queda disponible en diagnóstico, sin formar parte del diseño de arranque.

**La pantalla nativa de Samsung anterior a cargar el HTML puede seguir apareciendo.** No se afirma que esta actualización la reemplace: esa parte depende del sistema/instalación del televisor.

## Validación

83 pruebas unitarias. Navegador: MP4 faststart, MP4 con moov al final, MPEG-TS, respaldo tras 404 y vídeo 1080p; decodificación real H.264/AAC, cuadros que avanzan de forma continua, pausa, búsqueda MP4 en ambos sentidos, búsqueda TS dentro del búfer y protección fuera, cambio al episodio 2 y cierre del reproductor.

Regresión de HLS, guía, teclado y navegación. Arranque probado a 1080p y 4K antes de cargar el runtime y con OK de lanzamiento. Instalación reproducible de dependencias verificada desde caché vacía por HTTPS.

Estas pruebas usan contenido local de prueba. La comprobación de sesión anónima del proveedor desde el entorno devuelve portal100024; quedan pendientes señales reales y validación física en Samsung. Los tiempos locales de arranque no representan al proveedor.

WGT sin firma, instalable con Apps2Samsung. Se conserva Infotv2026.InfoTV, Tizen mínimo 4.0 y HLS.js/worker 1.7.4. Se añaden MP4Box 0.5.4 y mpegts.js 1.8.0 con avisos de licencia incluidos.
