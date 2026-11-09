# UX y regresiones 0.10.6

- Fuentes, colores y tamaños: selección única con aria-checked. Un check significa elegido; un borde significa foco. Se prueba también el foco sobre una fuente no elegida para descartar una segunda marca visual.
- Películas/series: dos títulos cambian fuente, color y tamaño de forma diferente; el primero recupera sus elecciones al volver. Se conservan audio y subtítulos por título y por serie/episodios.
- Catálogo: izquierda o abajo desde Ver todas entra a las tarjetas de la misma fila. Abrir Ver todas lleva al primer resultado tras cargar; se verifican las 12 tarjetas de Acción y las cuatro filas de series.
- TV: prueba HLS real con tres audios y WebVTT; logo local, resolución observada 640×360, menú derecho, lista izquierda, preferencias independientes y foco al abrir el canal 98 de una lista de 120.
- Diagnóstico: seis tarjetas, resultados CDN por servidor, sin pre/JSON visible; verde solo para medición correcta y ámbar para avisos/no medible. Sin desplazamiento horizontal; resultados largos se desplazan verticalmente y cerrar cancela las solicitudes.
- La estabilidad describe tres muestras de latencia HTTP. No es un monitor continuo ni mide el enlace Wi-Fi. El detalle técnico continúa disponible por las APIs de debug.

Las capturas usan datos y señales de prueba; no son mediciones del TV del usuario. No se cambian los resolutores, hosts, perfiles de búfer ni la lógica de recuperación de vídeo. Los subtítulos incrustados en la imagen no admiten estos cambios de estilo.
