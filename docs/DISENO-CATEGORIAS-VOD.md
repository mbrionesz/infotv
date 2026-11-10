# Películas y Series: entrada por categorías

## Interfaz

- Conserva carrusel y Seguir viendo con progreso, minutaje y eliminación manteniendo OK.
- Sustituye las filas de avances de géneros y sus botones Ver todas por tarjetas de categoría. No consulta títulos de cada categoría al pintar la portada.
- Películas: prioriza Acción, Crimen, Suspenso y Terror si están anunciados. Continúa con los demás géneros del portal, hasta 24 categorías.
- Series: primera fila Acción, Serie Coreana, Serie Turca y EEUU; después Crimen y otros géneros. Usa códigos reales de columnas para Corea/Turquía; alternativa de país solo si el portal anuncia ese identificador. EEUU también usa código anunciado. Si falta la categoría/país no se inventa un identificador y la tarjeta lo indica.
- Todo el catálogo abre la sección completa; Mi lista se conserva como tarjeta cuando existen favoritos.
- Cuatro columnas a 720p/1080p y seis en pantallas de 3000 px o más; tres para anchos menores de 1100 px. La navegación por filas se recalcula al cambiar el tamaño.
- Lupa junto a Series: OK abre búsqueda conjunta de películas y series. No se abre al pasar por ella con la flecha. Ajustes sigue a la derecha y requiere OK.
- Las imágenes del carrusel usan contain, con su proporción original. No se estiran ni se recorta una portada para rellenar un banner; una imagen pequeña del proveedor sigue teniendo su resolución original. Se conserva TMDB solo para el carrusel.

## Navegación y rendimiento

Las categorías abren el catálogo paginado existente, conservando sus códigos y filtros. Volver desde una ficha mantiene los resultados; Volver desde resultados recupera la tarjeta de categoría. Se retiró la cola de consultas y el observador de precarga de filas de género. Las tarjetas de categoría usan CSS local; no añaden solicitudes de imágenes ni dependencias.

## QA local

- 277 pruebas unitarias aprobadas.
- test:category-hub: tarjetas, cero consultas de avances, 4/6 columnas a 720p/1080p/4K, flechas arriba/abajo, categoría/ficha/Volver, códigos de Corea/Turquía/EEUU, lupa global y Ajustes.
- test:continue-watching: OK corto/largo, eliminación, foco vecino, favoritos y persistencia.
- test:tv-network-ux: guía, foco, categorías, favoritos y diagnósticos.
- test:cinematic: carrusel automático sin consultas extra, filtros combinados, fichas, reproducción local, reanudación, regreso de Ajustes y cabecera adaptable.

Capturas con datos de prueba: docs/ux-usability/category-hub/. No constituyen una consulta al proveedor ni prueba sobre Samsung real. Diseño local todavía sin nueva publicación.

## Refinamiento de tarjetas y búsqueda integrada

Las tarjetas incorporan iconos SVG locales por género, relieve discreto, foco de alto contraste y una cuadrícula sin desplazamiento horizontal. Solo Seguir viendo conserva su fila horizontal. La navegación de categorías limita izquierda/derecha a la fila y desplaza verticalmente para revelar el foco.

La lupa abre una pantalla con título, tipo Todo/Películas/Series, género, año, país y teclado integrado. Flecha derecha entra al teclado; izquierda desde su primera columna o Volver regresa a los criterios. No se consulta el portal por cada pulsación; Ver resultados aplica el conjunto. La búsqueda conserva los filtros al editar texto y permite editarlos desde los resultados.

Se normalizan las etiquetas para que Action/Acción o USA/United States no aparezcan duplicadas. Al explorar sin texto, se traduce cada etiqueta al código que anuncia el catálogo correspondiente; no se reutiliza el ID de Películas como si fuera el de Series. Al buscar por nombre, género/año/país se aplican a los resultados de la página devuelta si el endpoint no ofrece esa combinación; la pantalla lo indica, conserva Siguiente si quedan páginas y no declara un total filtrado sin verificar. Los metadatos ausentes no se inventan.

Pruebas adicionales: test:search-workspace (720p/1080p/4K, texto y filtros juntos, cambio de zona con mando, edición, regreso a Series y controles dentro de pantalla), además de las regresiones de IDs y alias en catálogo remoto. Capturas: docs/ux-usability/search-workspace/. Estos cambios continúan locales y no están publicados.
