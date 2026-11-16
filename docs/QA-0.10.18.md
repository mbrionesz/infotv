# QA 0.10.18 beta

Verificación previa a publicación, 16 de noviembre de 2026.

- Compilación y 340 pruebas unitarias aprobadas tras recuperar el entorno y repetidas después de integrar los cinco commits remotos de magis.js. La publicación final usa v0.10.18-beta.2.
- Transporte Samsung WASM: TLS, Host/SNI y los 17 resolutores DoH por IP aprobados.
- Resultados de navegador recuperados del mismo código: salida al 96 % en MP4 y MPEG-TS con minuto, temporada y episodio conservados; más de 285 s en pausa; controles en 720p/1080p/4K.
- Transición automática MP4/TS, recuperación de enlaces, retorno al catálogo y salida ante error aprobados con proveedor simulado.
- Doble Atrás: limpieza de caché temporal, una llamada de salida Samsung simulada y conservación de progreso, favoritos y estadísticas.
- Limpieza MP4 comprobada ante excepción de cierre y sin recorrer muestras no leídas de toda una película.

No se midió RAM, CPU ni estabilidad prolongada en el Samsung real. Liberar recursos permite que el navegador recupere memoria; no fuerza el recolector del firmware. No equivale a garantizar ausencia de fallos del proveedor o del decodificador. Continúa pendiente aclarar el fallo intermitente de reanudación TS documentado en QA-0.10.17.md.
