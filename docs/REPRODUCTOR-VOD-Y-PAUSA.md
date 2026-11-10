# Reproductor VOD y pausa

Cambios del borrador local, todavía sin publicar:

- Seguir viendo separa nombre y episodio/temporada (`EP. 3 · T2`). Las películas muestran su nombre; no se inventan temporadas ausentes.
- La sugerencia de siguiente episodio aparece a 2 minutos del final en episodios de 24 minutos; a 4 min 30 s en episodios de 45 minutos y a 6 minutos en episodios de una hora. Es una aproximación por duración, no detección de créditos. La reproducción automática conserva la condición de final confirmado.
- Controles VOD renovados con pausa, saltos, audio/subtítulos y regreso a la ficha. Se ocultan tras inactividad y devuelven el foco al reproductor.
- Al pausar, MP4/MPEG-TS pueden ampliar la reserva hacia 90 segundos, con presupuesto estimado de datos comprimidos de 24 MiB. Al continuar se recupera el perfil normal. No es un límite de RAM total: una descarga puede sobrepasar el objetivo por el tamaño de su bloque. Con bitrate desconocido se mantiene la reserva conservadora.
- HLS VOD amplía su techo temporal al pausar y conserva su límite de bytes. AVPlay conserva la gestión nativa del búfer. TV en vivo y DNS no cambian.

La prueba de navegador `test:vod-ui` usa archivos locales autorizados MP4 y MPEG-TS: comprueba que aumenta la reserva en pausa, no avanza el reloj, vuelve el perfil normal, funcionan controles/ocultación y se conserva episodio/temporada. Revisa geometría en 1280×720, 1920×1080 y 3840×2160. Las pruebas unitarias cubren los márgenes de siguiente episodio y los presupuestos de búfer. La reproducción real prolongada en Samsung sigue requiriendo validación en el televisor.

Ajuste visual posterior: barra inferior y panel de opciones de borde a borde, sin esquinas redondeadas externas; se conserva margen interior para controles. Abajo abre controles; Audio y subtítulos + OK abre el panel. La barra utiliza calidad y FPS declarados de la pista seleccionada cuando no hay datos observados; identifica el origen portal y prioriza dimensiones/FPS observados. Sin datos no asigna valores ficticios. La lectura del portal usa los campos ya normalizados por `trackSummary`, sin otra ruta ni peticiones nuevas.
