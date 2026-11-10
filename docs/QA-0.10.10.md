# QA 0.10.10 beta

- Regresiones unitarias: respuesta de metadatos obsoleta, lector MP4 detenido tras error y reinicio de EOF MPEG-TS.
- Metadatos de subtítulos: marcas explícitas forced/isForced, ausencia de inferencias por idioma/URL, diagnóstico sin URLs y preferencia manual separada de subtítulos completos.
- test:audio: audio/subtítulos conservados tras reiniciar, siguiente capítulo y pistas reordenadas; apagado manual respetado.
- test:vod-recovery: reproducción MP4/TS, avance automático, botón siguiente, reintentos con autorización nueva y regreso al catálogo. Fuentes locales y portal simulado.
- test:vod aprobado durante la auditoría precedente con estas correcciones del lector: MP4, MPEG-TS, FHD, reanudación y renovación de autorización.

No se certifica disponibilidad de subtítulos forzados del proveedor. La activación del portal desde este entorno devolvió portal100024 en la consulta anterior. Pendiente Samsung real y sesiones prolongadas con el proveedor. DNS y perfiles de buffer conservados.
