# XuperTizen 0.10.17 beta.1

- Recarga VOD durante reproducción: MP4 a 60 s (objetivo máximo 80 s), MPEG-TS a 55 s (máximo 72 s).
- Reserva en pausa hasta cinco minutos. Mantiene presupuestos estimados de datos comprimidos: 16 MiB en reproducción y 32 MiB en pausa; con bitrate alto los segundos se reducen. No son límites de RAM total. AVPlay administra su propia reserva.
- Contador mediante la misma consulta catalogFullPage de Películas y Series. Suma totales conocidos sin filtros; no garantiza un censo único del proveedor.
- Historial de cinco registros: al sexto elimina los cuatro más antiguos y conserva los dos últimos. Migración del historial anterior incluida.
- Doble Atrás desde la raíz guarda progreso y limpia caché temporal/portadas y conexiones, conservando biblioteca, estadísticas y preferencias.
- Diagnóstico de velocidad y tiempo del último bloque VOD descargado.

WGT sin firma para Apps2Samsung. DNS y TV en vivo conservados. Requiere prueba prolongada en Samsung; no garantiza eliminar todos los cortes del proveedor.
