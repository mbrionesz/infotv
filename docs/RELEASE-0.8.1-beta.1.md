# XuperTizen 0.8.1 beta

Corrección del congelamiento causado por listas del proveedor con secuencias que retroceden o saltan de forma incoherente:

- Comprueba la continuidad antes de entregar la lista a HLS. Descarta la respuesta incompatible y reintenta; no modifica números de secuencia ni URLs firmadas.
- Si el reloj queda miles de segundos fuera del buffer, reinicia la sesión de vídeo en vez de acumular reintentos de red. Recuperación limitada y cambio de ruta si persiste.
- Corrige la reutilización de loaders del navegador durante reintentos con HLS 1.7.

Mantiene la UX y las correcciones de 0.8, HLS.js 1.7.4 y los ocho DNS integrados.
Instala el WGT con la firma habitual de Apps2Samsung.

El fallo de secuencias se reprodujo en Chromium con la versión anterior; pendiente confirmar la corrección en Samsung con las señales reales.
