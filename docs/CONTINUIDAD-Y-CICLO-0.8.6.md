# Continuidad de reproducción y ciclo de vida

Referencia estudiada: [TizenXuperTV 1.12.2](https://github.com/juliochemoreno/TizenXuperTV/tree/v1.12.2), commit `314308b82f2d986742669ac2fe6f3389dd410600`, especialmente `src/lib/mediaSequence.ts` y `src/services/playerService.ts`. El proyecto usa React/TypeScript; sus ideas de reproducción se adaptan aquí mediante módulos independientes. No se migró la interfaz ni se copió su código de normalización.

## Normalización conservadora

Antes se rechazaba toda regresión grande de MEDIA-SEQUENCE, incluso si los mismos segmentos demostraban que solo había cambiado la numeración. `playlist-continuity.js` mantiene un máximo de trescientas identidades por URL/sesión. Exige al menos dos identidades consecutivas comunes, una correspondencia coherente para todos los segmentos conocidos, duraciones con diferencia menor o igual a 10 ms y mismo contexto de discontinuidad/cifrado. Solo entonces cambia la etiqueta MEDIA-SEQUENCE que recibe HLS.js. No cambia URLs, cabeceras, IV, bytes de medios ni números de discontinuidad.

La identidad conserva origen, ruta y parámetros funcionales, eliminando solo parámetros de autenticación enumerados. Así `part.ts?id=1` y `part.ts?id=2` permanecen distintos. Sin solapamiento, con un único anclaje, conflicto de orden/metadatos, BYTERANGE, MAP, segmentos parciales, GAP o VOD no se adivina una numeración. AES-128 con IV implícito no se renumera porque el IV depende de la secuencia; los demás cifrados tampoco se fuerzan. Las listas no aceptadas no actualizan el historial de identidades. El guard previo y su margen de buffer siguen actuando.

Esto supone que una URI estable y sus metadatos describen el mismo segmento. No compara ni certifica todos los bytes del proveedor. La prueba física debe confirmar que existe solapamiento real en sus listas. Los diagnósticos muestran `playlistNormalized`, `playlistContinuity`, y en cada lista `serverMediaSequence`, secuencia efectiva, `normalized` y `sharedSegments`.

## Ciclo de vida

`playback-lifecycle.js` concentra los eventos de visibilidad y red. `live-buffer.js` permite suspender sin convertirlo en una pausa del usuario y sin que su temporizador vuelva a reproducir en segundo plano. La pausa manual se conserva al regresar. Una ausencia larga de TV en vivo reinicia la sesión de medios con la ruta y sus cabeceras actuales; una corta reanuda sin descartarla. Los eventos online se agrupan y se comprueba que siga seleccionado el mismo contenido antes de actuar. Un error terminal live puede reintentarse con un evento online posterior; salir o cambiar de canal cancela esa posibilidad. Depende de los eventos que emita la plataforma y requiere ensayo en firmware Samsung.

## Historial local

`playback-journal.js` guarda hasta cien eventos, agrupa repeticiones cercanas y difiere las escrituras. Registra fecha, canal/título, host, motor, tipo, HTTP y cantidad. No registra URL completa, parámetros firmados, cuerpos, cabeceras, tokens o licencias. Soporta almacenamiento corrupto o denegado. Se consulta en Diagnóstico o mediante `XuperStandalone.playbackHistory()`. No se envía a terceros.

## Validación

Pruebas unitarias cubren anclajes, numeración fija de servidor con ventana móvil, ausencia de solapamiento, conflictos, parámetros funcionales, cifrado, tamaño acotado, pausa, cancelación de reconexión y privacidad del historial. Las pruebas de navegador simulan cuatro cambios de numeración con segmentos compartidos y verifican avance de frames sin reinicios, 404 temporal con reserva, reloj fuera de buffer, respuestas ambiguas persistentes y salida al menú. Se comprueban además HLS cifrado y películas/series con vídeo/audio, pausa y regreso desde segundo plano. No es una certificación de todos los canales, códecs ni del firmware Samsung.
