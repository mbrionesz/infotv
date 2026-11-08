# Congelamiento por incoherencia de secuencias

El log del TV 0.8.0 muestra `MEDIA-SEQUENCE` 10356 → 8905 → 10358 en el mismo origen, todas con HTTP 200. El reloj pasa de 28.718s a 7317.827s, fuera del buffer [15.209,40.139]. Más tarde ocurre otro salto a 6338.903s tras cambiar de CDN. Aparece `bufferAppendNoProgress` y la app hace reintentos de red; la primera recuperación por cambio de CDN tarda aproximadamente un minuto. El debug sigue cada cinco segundos (desfase 0–22ms): no demuestra un bloqueo global de JavaScript en esa captura. Los contadores de fotogramas son cero y no permiten deducir FPS reales.

Reproducción antes de la corrección: `XUPER_TIMELINE_BASELINE=1 npm run test:timeline`, con bundle 0.8.0. Una sola respuesta con una secuencia atrasada 1451 posiciones produce un reloj a 2914s, readyState=1 y fotogramas estancados. No hace falta acceder a la cuenta ni a servidores reales del proveedor.

La protección compara únicamente listas del mismo URL y sesión. Mantiene el último estado aceptado: no lo sustituye por el de una respuesta rechazada. Tolera listas idénticas, avances normales, ventanas perdidas compatibles con el tiempo transcurrido y sesiones nuevas con otro origen. Reintenta hasta dos veces antes de recuperar la sesión o cambiar de ruta. No inventa secuencias, ni altera URLs o autorizaciones. En el navegador se usa un loader nuevo por reintento: HLS 1.7 rechaza reutilizar instancias ya consumidas.

El watchdog distingue reloj fuera de todo el buffer de falta de descarga. Tras dos muestras anómalas reinicia la sesión con presupuesto limitado. Respeta pausa voluntaria, pestaña oculta, VOD y cambios de canal. No busca automáticamente una posición corrupta de liveSyncPosition.

Prueba después: la misma respuesta atrasada se rechaza, siguen avanzando los frames y el reloj no salta. Se inyecta el valor 7317.827 para comprobar la recuperación y se comprueba que la salida a Principal y navegación sigan funcionando ante respuestas incoherentes persistentes. También se verifica el ciclo HLS cifrado, errores HTTP, pausa y cambio de CDN con autorización por ruta. La prueba física en Samsung queda pendiente. No se han cambiado DNS ni TLS.
