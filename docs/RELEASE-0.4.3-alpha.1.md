# XuperTizen 0.4.3 alpha.1

Corrige cortes tras los primeros segundos de reproducción observados en el
QN55QN70FAGXZS con 0.4.2. Aquella versión sí llegó a reproducir señales reales;
la estabilidad de esta actualización todavía requiere prueba en el televisor.

- Omite Range cuando HLS no solicita bytes concretos: antes podía enviar
  `bytes=0--1`, coherente con el HTTP 416 de las fotos.
- Reintenta de forma acotada listas y segmentos con fallos temporales, conserva
  el buffer y evita cambiar inmediatamente de CDN. No reintenta 401/403/416.
- Corrige los tiempos de descarga usados para elegir calidad y mantiene hasta
  30 segundos objetivo de buffer, con límite de memoria de vídeo de 24 MB.
- Elimina la descarga duplicada del manifiesto antes de iniciar HLS.
- Reutiliza conexiones TCP/TLS, elimina la espera Expect en POST, prioriza
  peticiones de reproducción y recuerda la IP alternativa que sí respondió.
- Solicita OK solo ante NotAllowedError. AbortError puede recuperarse al estar
  listo el vídeo; pulsar OK en la vista previa reanuda la sesión existente.
- Añade diagnóstico de reintentos, recuperaciones, rechazo de play y arranque.

Comprobaciones: 33 pruebas unitarias, integración Chromium y 22 segundos de
vídeo sintético AES-128 con lista deslizante y fallos 404/503 inducidos. El vídeo
avanzó más de 18 segundos, mantuvo autenticación en lista/segmentos/clave y no
reinició el CDN. También se verificó el caso de interacción real sin resolver
otra vez el canal. Esta prueba usa un adaptador HTTP local, no sockets Samsung.
Una prueba C++ local verifica una sola conexión TLS para dos GET y un POST.

WASM recompilado para Samsung. Verificación de certificado y nombre activa.
El SDK incluye curl 7.68.0 y OpenSSL 1.1.1w antiguos; esta ruta sigue siendo
experimental. No hay garantía de códecs no compatibles con el hardware ni de
continuidad de servidores externos. Instalación WGT sin firma mediante el
flujo de firma de Apps2Samsung; mínimo declarado Tizen 4.0, prueba física de
esta versión pendiente, especialmente fuera de Tizen 9.
