# XuperTizen 0.8.5 beta

DNS integrado ampliado de 14 a 17 direcciones, de nueve proveedores:

- DNS.SB: `185.222.222.222` y `45.11.45.11`.
- Mullvad: `194.242.2.2`.

Se conservan los proveedores existentes, validación TLS, carrera con presupuesto de 5 s, caché y fallback informado. El módulo Samsung se recompila y verifica con las nuevas IP, Host/SNI y rutas DNS-over-HTTPS. Las correcciones de reproducción de 0.8.3/0.8.4 se mantienen.

Actualización enfocada en DNS: conserva los hosts del portal de la versión publicada 0.8.4. Más DNS aporta alternativas de resolución; no garantiza corregir cortes, secuencias HLS o HTTP 404.

Instala el WGT con la firma habitual de Apps2Samsung. Pendiente comprobar los nuevos resolutores desde la red del TV.
