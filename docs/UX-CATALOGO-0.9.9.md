# Inicio, catálogo y VOD 0.9.9

## Navegación y biblioteca

El menú principal tiene cinco destinos y se oculta fuera del área visible al enfocar el contenido. Izquierda desde el borde abre el menú; derecha vuelve al contenido y OK abre el destino elegido. Inicio conserva cuatro controles pequeños (TV en vivo, Buscar, Mi lista, Ajustes), Mis canales y filas de Seguir viendo/Mi lista. Si no hay biblioteca, ofrece Para descubrir. Se elimina el héroe que duplicaba el título de Seguir viendo y las seis tarjetas grandes. No se cargan vídeos de fondo ni fuentes remotas.

Los minutos restantes se calculan con ceil((duración − posición)/60) únicamente con duración conocida y válida hasta doce horas. Las estimaciones PTS se marcan ≈, incluyendo el progreso guardado. Un historial antiguo sin duración fiable muestra Continuar viendo o el episodio, no una cantidad inventada. Desde Gestionar historial se puede quitar un título o confirmar el borrado completo. Se actualizan el perfil primario, copia de respaldo e IndexedDB mediante el almacén existente; favoritos y preferencias permanecen.

Similares excluye el título actual y duplicados y requiere coincidencia de género. Solicita una página del mismo tipo por el primer género y la combina con los títulos ya cargados. Si el portal no responde, se usan solo coincidencias locales; sin metadatos no se fabrican recomendaciones. La respuesta tardía no cambia de ficha ni deja un foco desconectado.

## Todo y búsqueda

Todo es una agregación local, no una nueva ruta del proveedor. Solicita 18 títulos de cada raíz por página, intercala resultados y mantiene paginación independiente. Las colecciones específicas siguen en Películas/Series; Todo conserva filtros compartidos y búsqueda en ambas raíces. Los totales son declaraciones del portal; no representan un recuento global de títulos únicos verificados. Si una raíz falla, la interfaz lo indica y no declara el total combinado como conocido.

Se mantienen getShelveData para All/colecciones anunciadas, filterByContent para filtros y las rutas editoriales existentes. La referencia TizenXuperTV v1.12.4 (revisión 6aa51f5) utiliza las mismas familias de rutas. No es evidencia de que todas las rutas funcionen con esta sesión ni de que cargar de golpe decenas de miles de títulos sea necesario.

El inicio reanudado conserva la posición fraccionaria del marcador TS cuando cae en el mismo segundo que el historial. Así, redondear 96,223 a 96 no descarta un fotograma clave de 96,021 s. Las huellas del archivo y sus offsets siguen verificándose antes de usar el anclaje.

## Búfer y comparación VOD

Referencia: public/js/tizen-bridge.js, AVPlay con PLAY 3 s, RESUME 5 s para VOD y timeout de búfer 20 s. Su vídeo nativo se autoriza mediante CUSTOM_MESSAGE, cuyo soporte efectivo depende del firmware. Nuestra adaptación AVPlay 3/6 s y fallback proviene de 0.9.8. No se copia un relay FFmpeg/webOS ni se modifica TV en vivo.

La ruta MPEG-TS utiliza descarga anticipada hasta 25 s y reanudación de descarga a 10 s; no equivale a esperar 25 s antes de reproducir. Se corrige stashInitialSize de 128 a 128×1024: mpegts.js 1.8.0 expresa esa opción en bytes (src/io/io-controller.js), no KiB. No cambia los tiempos 25/10. Esto corrige las unidades del búfer inicial, sin demostrar por sí solo que elimine cortes del proveedor o del decodificador.

El ajuste local xt.vodEngine=doh se conserva al actualizar, así como los 17 DNS y diez hosts. AVPlay sigue utilizando DNS del firmware; el transporte alternativo utiliza la resolución de la app. No se envían credenciales de la TV desde el entorno.

## Calidad y verificación

mediaInfo ya expone versiones con calidad, audio, códec y contenedor. La ficha permite escoger una versión 1080p si está anunciada; no transforma una pista 720p a 1080p. La prueba de metadatos desde el entorno recibió portal100024 (región no permitida). Por tanto, no se verificó disponibilidad real de 1080p para ningún título en esta sesión. Las pruebas de UX verifican opciones 720p/1080p simuladas y que la opción escogida llegue a resolve.

Validación: 209 pruebas unitarias; catálogo y filtros; navegación y respuestas tardías; 42 capturas a 1080p, 4K y 720p; historial individual/confirmado y conservación de favoritos; reproducción MP4/TS con fuentes propias de prueba. Estas verificaciones no garantizan reproducción continua en Samsung ni disponibilidad del proveedor.
