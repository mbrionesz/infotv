# XuperTizen 0.8.8 beta

- Películas, series y demás secciones exploran el catálogo paginado del portal, además de las portadas editoriales anteriores.
- Categorías reales, género/año/país consultados al servidor y búsqueda paginada por sección. Resolución y filtrado mientras escribes se aplican a la página visible; confirma Buscar para consultar al proveedor.
- Páginas de 36 títulos, caché de páginas y metadatos en IndexedDB, portadas bajo demanda y memoria de fichas acotada. Sin descargas masivas al iniciar.
- Reintento de páginas fallidas, control de páginas repetidas y regreso a la vista de portada identificada si la API completa no está disponible.

Puede mostrar títulos que no aparecían en las portadas. La cantidad depende del catálogo y permisos de la sesión; no se promete una cifra de títulos. Se preservan reproducción VOD/TV en vivo y los 17 DNS.

Instala el WGT mediante Apps2Samsung. Validado con respuestas de laboratorio; pendiente comprobar categorías, filtros y totales del proveedor desde el Samsung físico.
