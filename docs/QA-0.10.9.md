# Validación 0.10.9 beta

- 259 pruebas unitarias aprobadas: calidad heredada, resolución, FPS fraccionales, versiones separadas y ventana del siguiente episodio.
- Compilación Chrome 56/Tizen 4 completada.
- test:vod: MP4, MPEG-TS, fichero FHD 1920x1080, renovación de autorización, reanudación larga, vídeo/audio y liberación del reproductor; fuentes locales.
- test:catalog-remote-ux: navegación de filas, regreso al carrusel, filtros combinados y tamaños 720p/4K; proveedor simulado.
- test:vod-recovery: cambio automático/manual, errores recuperables, siguiente temporada, historial y botón Siguiente capítulo con foco y OK; reloj simulado para la aparición cerca del final.
- El smoke general antiguo falla en una expectativa de foco de dashboard (smoke-browser.mjs:97), que precede al cambio de inicio a Películas. No se ha usado ese resultado como validación de la portada.

La consulta real del portal desde el entorno recibió portal100024 al activar sesión. No se certifican nuevas calidades disponibles, disponibilidad de recomendaciones ni estabilidad en Samsung real. No se cambió el buffer ni el transporte en esta entrega. Se conserva DNS.
