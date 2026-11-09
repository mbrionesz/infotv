# Películas y series: comparación y verificación 0.9.8

Referencia consultada: [TizenXuperTV](https://github.com/juliochemoreno/TizenXuperTV), revisión `6aa51f5` (v1.12.4), `public/js/tizen-bridge.js`. La referencia utiliza AVPlay y solicita cabeceras adicionales mediante CUSTOM_MESSAGE. Se adopta esa idea mediante un adaptador propio, validando nombres y rechazando CR/LF. Aceptar esa propiedad no demuestra que el firmware envíe todas las cabeceras. Se registra `nativeHeaderMode: custom-message-unverified` y se conserva el fallback.

## Reproducción

VOD en Samsung intenta AVPlay; el inicio usa 3 s y la reanudación 6 s de búfer. No modifica el perfil de TV en vivo. Se obtiene la duración con getDuration y se espera el resultado de seekTo antes de reproducir un título reanudado. El plano HTML se hace transparente durante la ruta nativa y se restaura al salir. Audio, subtítulos externos y relación de aspecto mantienen los controles de la app.

Un fallo tras comenzar puede renovar una vez la fuente y reabrirla en el minuto actual. Hay como máximo dos intentos nativos por apertura antes del fallback; las credenciales se conservan por URL, sin mezclar servidores. Un fallo definitivo conserva datos de diagnóstico y OK consulta una fuente nueva. No se implementa FFmpeg ni un relay local de webOS.

AVPlay conecta y resuelve nombres desde el firmware de Samsung. No permite aplicar el lookup del transporte de la app. Los 17 resolutores DoH permanecen para el portal y transporte alternativo; no se sustituyen dominios HTTPS por direcciones IP. Para comparar el transporte anterior se puede ejecutar `localStorage.setItem('xt.vodEngine','doh')` y volver a abrir el título. Restaurar con `localStorage.removeItem('xt.vodEngine')` y volver a abrirlo.

## Catálogo y duración

getShelveData es una ruta de catálogo, no de vídeo. Se prefiere para la colección All realmente anunciada por catalogColumns. Un error permite volver a filterByContent de la raíz equivalente. Colecciones específicas y sus filtros conservan su lógica; no se agregan categorías ni servidores inventados. La caché cambia a catalog-v5.

Se corrige la interpretación MM:SS del portal. Para MPEG-TS sin duración conocida se consulta como máximo 512 KiB finales con las mismas cabeceras y se compara el PTS de vídeo con el inicio, comprobando PID y tamaño del archivo. Es una estimación, marcada ≈; no es un índice de seek y puede ser inexacta en archivos con discontinuidades. La consulta opcional no renueva la sesión ni interrumpe la descarga si falla. El total permanece sin informar si no se puede estimar.

## Validación y límites

204 pruebas unitarias, incluidas cabeceras nativas, rechazo y fallback, duración, seek antes de play y renovación; pruebas Chromium con MP4 y MPEG-TS autorizados, duración estimada, reintento con OK, posición guardada, renovación 403 y decodificación de audio/vídeo. Pruebas de audio/subtítulos, catálogo, filtros, navegación y 41 capturas de UX. Los servidores de prueba usan archivos propios y respuestas simuladas; no prueban Samsung ni el portal real.

El log Babil confirma HEVC hvc1.1.1.L93.B0 y HE-AAC mp4a.40.5. Los mensajes Maximum buffering duration exceeded / Continue loading son parte del control normal de descarga de mpegts.js; no demuestran por sí solos una avería. La excepción de consola ocurrió por un punto final añadido al comando, por lo que falta el diagnóstico del congelamiento.

En Samsung, abrir Babil y ejecutar sin punto adicional:

```js
console.log(JSON.stringify(XuperStandalone.diagnostics().player,null,2))
```

Revisar engine, nativeAttempts, nativeHeaderMode, transportRoute, durationSource, nativeFallbackReason, failure, media y sourceRefreshes. No publicar URLs completas ni cabeceras de autorización.
