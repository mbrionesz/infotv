# XuperTizen 0.4.4 alpha.1

El usuario confirmó que 0.4.3 inicia más rápido y mantiene algunos canales,
pero otros caen alrededor de 30 segundos. También observa poca fluidez de vídeo
y un desfase pequeño de audio. Sin diagnóstico de esos canales no se atribuye
el corte a una causa única. El temporizador inicial de 30 s ya se cancela al
comenzar la reproducción; no se elimina ni se amplía para ocultar el problema.

- Activa el worker HLS también en Samsung, usando un archivo local compilado
  para Chrome 56 en lugar de depender de la inyección del worker del bundle.
  Demultiplexado, remultiplexado y descifrado compatibles pasan a ese worker.
  HLS conserva su recuperación si falla el worker.
- Activa reducción adaptativa de calidad si se pierden más del 15 % de los
  fotogramas en el intervalo de 5 s. Requiere variantes de calidad del proveedor;
  no inventa 60 FPS, no convierte códecs ni hace transcodificación.
- Permite más margen antes de saltar al directo tras un atasco, manteniendo la
  velocidad de reproducción en 1. No aplica retrasos arbitrarios al audio.
- Recuperación de errores de red con esperas de 1/2/3 s y hasta tres intentos por
  minuto, en lugar de dos intentos para toda la sesión. 401/403/416 siguen siendo
  errores que no se reintentan mediante esta recuperación.
- Cada 2 s toma una muestra de buffer, resolución, fotogramas y velocidad.
  Si un directo deja de avanzar durante 12 s, solicita carga si falta buffer o
  reconstruye MediaSource si hay buffer; esta última acción se limita a una por
  minuto y no se dispara por pausa o aplicación oculta. Se cancelan los timers
  al cambiar o cerrar el canal.
- Diagnóstico incluye los últimos doce eventos, estado HTTP, códecs, calidad,
  buffer, fotogramas totales/perdidos y recuperaciones. No afirma medir el desfase
  audiovisual físico: esa medida requiere observar la TV o una señal de prueba.

Validación local: 36 pruebas unitarias e integración Chromium. Prueba de 60 s con
H.264/AAC AES-128, lista deslizante, errores 404/503 y caída de lista durante 4 s
tras el segundo 30. Se comprueba ejecución real del worker, avance del vídeo,
autenticación de lista/segmentos/clave y recuperación sin cambiar de CDN.
Se conserva la prueba de OK sin reabrir la sesión. El transporte usa un adaptador
HTTP local: no representa sockets ni decodificador Samsung. No es una medida de
FPS o sincronía del QN70F. Datos en benchmarks/live-continuity-v044.json.

Prueba física de 0.4.4 y causa de los cortes del proveedor pendientes. AVPlay
sigue limitado a señales cuyas cabeceras su API admite; las protegidas usan
HLS.js y MediaSource. Se mantiene el SDK nativo experimental con curl/OpenSSL
antiguos y verificación TLS activa. WGT sin firma para el flujo Apps2Samsung;
mínimo declarado Tizen 4.0, sin garantía física en todas las versiones.
