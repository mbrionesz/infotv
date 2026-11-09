# XuperTizen 0.10.4 beta

- Corrige volver hacia arriba y recuperar el carrusel completo.
- Conserva la tarjeta y fila al regresar desde una ficha.
- Películas organizadas por géneros, con Ver todas para el catálogo paginado completo.
- Series: Acción, Crimen, Serie Coreana y Serie Turca, usando los identificadores anunciados por el portal.
- Nuevo filtro con género, año, país y colección, aplicado al confirmar.

Las filas cargan al acercarse a ellas y reutilizan caché. Si el portal no informa una categoría o país, se muestra un aviso; no se inventan códigos. TMDB público, DNS y reproducción se conservan.

Validación: 238 pruebas unitarias y pruebas locales con D-Pad, apertura/regreso de tarjetas, filtros combinados y carrusel completo a 720p/4K. Fuentes simuladas; pendiente de comprobar el firmware Samsung y el catálogo real.
