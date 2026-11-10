# Auditoría VOD posterior a 0.10.14

Revisión del 10 de noviembre de 2026. Correcciones incluidas en 0.10.15 beta.1.

## Fallos corregidos

- MP4 multipista: MP4Box 0.5.4 conservaba los datos intercalados de pistas no seleccionadas. Ahora se consumen y liberan sus muestras comprimidas mediante la API de extracción, sin decodificarlas. Prueba reproducible: `node tools/mp4-memory-audit.mjs`, MP4 de dos minutos con tres audios. Antes retenía 8.542.577 bytes de entrada al terminar; después, cero. Esto mide buffers del parser, no toda la RAM del televisor. No demuestra que todos los bloqueos observados tengan esta causa; no afecta a la ruta MPEG-TS.
- Operaciones SourceBuffer y liberación de muestras: las excepciones de actualización o reinicio se notifican al reproductor en lugar de quedar como errores asíncronos sin manejar. Un seek que no devuelve posición válida se rechaza de forma controlada.
- Carga del módulo VOD: una respuesta tardía tras un timeout ya no invalida el reintento posterior; se retira también el script incompleto.
- Renovación del enlace: una respuesta mal formada se devuelve como error al solicitante, en vez de lanzar una excepción fuera del callback y dejarlo esperando.
- Diagnóstico: `player.vodMemory` informa bytes de entrada MP4Box, muestras y cola cuando esa ruta está activa. No incluye memoria del decodificador ni representa memoria total.

## Caché y congelamientos

La caché persistente guarda portadas y metadatos; el búfer audiovisual y las muestras del parser viven en RAM. Limpiar caché y reiniciar puede resolver metadatos obsoletos o estado temporal atascado. No repara un fallo de código, códec incompatible, enlace caducado, HTTP 404 o un servidor que deja de enviar vídeo. El reinicio libera recursos de la sesión; la limpieza conserva favoritos, progreso y preferencias. Si el hilo de la interfaz está completamente bloqueado, no podrá ejecutar el botón de limpieza hasta reiniciar la app.

No se aumentó el búfer ni se alteraron DNS o TV en vivo como solución a la retención de memoria. Una propuesta adicional de reset de fragmentos al buscar posición fue descartada al no superar el ensayo de retención tras múltiples saltos.

## Verificación

Resultado: 321 pruebas unitarias aprobadas; compilación y ensayo real de memoria MP4 aprobados. Pasaron `test:vod`, `test:audio`, `test:vod-recovery`, `test:cache-cleanup` y `test:vod-ui`: MP4 faststart/tail, MPEG-TS, FHD, pausa, saltos, reanudación, renovación de enlaces, transición de episodios y salida de errores. La suspensión de dos minutos y el reloj de 45 minutos son simulados; no son una reproducción real de 45 minutos. Estas pruebas locales no sustituyen una sesión prolongada en el Samsung real ni verifican disponibilidad del proveedor.
