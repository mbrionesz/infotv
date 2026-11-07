# Reproducción autorizada de archivos VOD

MP4/MPEG-TS del portal requieren Content-Auth/Content-License. AVPlay no admite estas cabeceras arbitrarias. La nueva ruta usa solicitudes HTTP Range y MediaSource; no intenta pasar credenciales en la URL ni fingir que un archivo TS es una lista HLS.

- HTTP Range de 512 KiB, con las cabeceras propias de cada CDN, validación de Content-Range y tamaño, cancelación y un reintento ante fallos temporales. El transporte Samsung conserva DNS seguro, SNI y Host; si no está disponible se usa XHR, sujeto a CORS.
- MP4Box 0.5.4 remultiplexa MP4 a fragmentos MSE. Se admiten metadatos al principio o al final y búsqueda por índice de muestras. Se liberan muestras usadas; se limitan colas y el búfer por duración y presupuesto aproximado de bytes.
- mpegts.js 1.8.0 remultiplexa MPEG-TS a fragmentos MSE. No convierte códecs ni mejora FPS artificialmente. El avance está limitado al tramo ya cargado cuando no hay índice de búsqueda; se evita el bloqueo que provocaba un salto fuera del búfer y se muestra un aviso.
- El módulo de 432 KiB aproximadamente se carga solo al necesitar MP4/TS autorizado; no se añade a la ruta inicial de HLS/TV en vivo. El remultiplexado de esta versión ocurre en el hilo principal con lectura por bloques; la decodificación queda a cargo del navegador/TV.
- Si la primera ruta falla antes de reproducir se prueban los respaldos suministrados, con sus propias cabeceras. Las respuestas antiguas no pueden iniciar una sesión nueva.

## Límites comprobables

Se requiere que el servidor admita Range para archivos grandes. Un servidor que ignore Range se rechaza antes de acumular el archivo completo. MediaSource debe admitir los códecs de la pista; esto no elimina DRM, restricciones regionales ni falta de permisos. No se afirma compatibilidad universal de códecs.

`npm run test:vod` genera vídeo H.264/AAC y comprueba MP4 faststart, MP4 con moov al final, TS y un CDN de respaldo: autorización, audio/vídeo decodificados, pausa, búsqueda MP4 en ambos sentidos, búsqueda TS dentro del búfer, protección fuera del búfer y teardown. Son pruebas locales de Chromium; faltan señales reales del proveedor y validación física Samsung.

`npm run test:startup` comprueba que el diseño XuperTizen / by Matias aparece antes del runtime y permanece al menos 1,8 s tras iniciar la app. La pantalla nativa de Samsung anterior al HTML no está bajo control de esta página y no se intenta reemplazar con metadatos de configuración no documentados.
