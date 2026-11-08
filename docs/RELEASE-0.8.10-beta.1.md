# XuperTizen 0.8.10 beta

- Revisión general de categorías, género, año y país: se mantienen los identificadores de opción y sus etiquetas, incluido el código cero.
- Categorías combinables con género/año/país. Se envían todos los filtros a filterByContent conservando el ID de categoría. Un rechazo no se convierte en resultados sin filtrar ni en la portada antigua.
- Caché de catálogo renovada para evitar reutilizar metadatos con el formato anterior.
- Auditoría opcional desde Debug: `XuperStandalone.auditCatalog("series")` o `XuperStandalone.auditCatalog("movies")`. Registra las opciones reales expuestas por esa sesión; no inicia reproducción. Resultado final: XT_CATALOG_AUDIT. Detener: `XuperStandalone.cancelCatalogAudit()`.

137 pruebas unitarias, incluida una matriz de 240 combinaciones de parámetros con respuestas controladas. Pruebas de interfaz para categoría + género + año + país, etiquetas/códigos, paginación, errores y reintento. Esto no certifica todas las respuestas reales del proveedor; desde el entorno la activación fue rechazada por región.

Conserva Mi lista, Seguir viendo, motores de vídeo y los 17 DNS. Instala el WGT con Apps2Samsung.
