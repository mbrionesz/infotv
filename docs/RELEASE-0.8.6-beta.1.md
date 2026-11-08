# XuperTizen 0.8.6 beta

Ideas de reproducción y diagnóstico estudiadas en TizenXuperTV 1.12.2, adaptadas a nuestra arquitectura:

- Continuidad HLS: corrige el número de secuencia únicamente cuando dos o más segmentos compartidos consecutivos demuestran la correspondencia y sus metadatos coinciden. Puede evitar reinicios ante listas renumeradas. Las URLs y los segmentos no se modifican; los casos ambiguos conservan la recuperación limitada.
- Suspensión y reconexión: pausa interna separada de la pausa voluntaria, reanudación al volver, recuperación de TV en vivo ante eventos de red y cancelación de recuperaciones al cambiar o salir de canal.
- Historial técnico local, acotado a cien eventos por canal/host y visible en Diagnóstico. Excluye URLs completas, cabeceras y credenciales. Debug: `XuperStandalone.playbackHistory()`.

Conserva los diecisiete DNS, TLS y la corrección MPEG-TS/MP4. No garantiza disponibilidad de una ruta que devuelve 404. Pendiente validar la continuidad con los segmentos reales del proveedor y el ciclo de suspensión del Samsung.

Instala el WGT con tu firma habitual de Apps2Samsung. Mantiene los hosts del portal de la versión publicada; la edición local pendiente de dos hosts continúa aparte.
