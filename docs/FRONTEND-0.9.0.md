# Frontend 0.9.0

La capa studio.css unifica superficies, tamaños, foco y controles conservando el canvas 1920×1080 que adapta la plataforma a 1080p y 4K. No introduce desenfoques, reproducción de fondo, fuentes remotas ni dependencias. El inicio tiene una ficha destacada real tomada de Seguir viendo o del catálogo, seis accesos y biblioteca desplazable. Los accesos solo se abren con OK; derecha en el menú lateral mueve el foco.

El catálogo separa destinos de categorías/filtros y resultados. Las opciones de cada filtro se ordenan sin cambiar sus identificadores enviados al servidor. La paginación sigue siendo del proveedor; no se promete orden alfabético de todo el catálogo ni más títulos. Resolución continúa filtrando solo la página cargada, indicándolo en pantalla. El foco de un filtro se conserva al actualizar sus resultados.

La ficha obtiene mediaInfo del título/episodio seleccionado, nunca de todos los pósteres. Muestra únicamente etiquetas disponibles. En automático resume todas las calidades/idiomas/formatos de sus variantes; al elegir una muestra los de esa variante. No supone resolución a partir del nombre del título, HDR, 5.1, duración, bitrate ni fps. El índice explícito de variante viaja hasta resolve, incluido el índice cero, para que la preferencia automática de idioma no lo sustituya. Si solo existe una variante no aparece selector. Conserva reanudación y preferencias de audio/subtítulos.

El botón Continuar usa el historial local y restaura episodio/temporada. Desde el principio omite la posición guardada para esa reproducción. Las imágenes de episodio usan picture real; si no existe, se muestra una tarjeta neutra, evitando recortar una portada vertical como si fuese una miniatura horizontal. Los subtítulos externos conservan tamaño/color y usan letra recta.

## Rutas revisadas

En reference/TizenXuperTV-review/public/js/magis-client.js figuran los IDs 76784 (Explorar) y 76301 (Hot Search / Búsquedas populares). Se incorporan al mapa existente de catálogos, usando v3/getColumnContents para descubrir categorías no restringidas, getShelveData para colecciones y filterByContent para filtros. Se elige la primera colección devuelta y se refleja su ID en el filtro; no se inventan categorías ni se activa la ruta restringida de adultos. Las rutas existentes de películas/series siguen igual. Los hosts, sesiones, DNS y transporte no cambian.

La consulta nueva desde el entorno devolvió portal100024: rechazo de región. No se ha confirmado que ambos IDs estén disponibles en la sesión del usuario ni que aumenten el catálogo; ante error se informa y permite volver, sin sustituir la ruta por otra colección silenciosamente.

## Validación

Pruebas unitarias de etiquetas, información ausente, índice explícito cero y raíces adicionales. Integración del catálogo con filtros/categorías/paginación, reproducción MP4 y TS, conservación de preferencias y reanudación avanzada. Recorrido de 38 capturas en 1080p/4K con selección de variante enviada al resolver, desplazamiento de ficha hasta recomendaciones, ajustes hasta controles inferiores y regreso visible. Los contenidos y variantes de las capturas son datos locales de laboratorio. Pendiente prueba física del Samsung.
