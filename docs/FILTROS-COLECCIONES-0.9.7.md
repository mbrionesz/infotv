# Comparación de consultas y filtros

Referencia: TizenXuperTV v1.12.4, revisión `6aa51f5`, `public/js/magis-client.js`, `src/services/catalogService.ts` y `src/screens/FilterScreen.tsx`.

La referencia consulta una colección con `v3/getShelveData` (`columnId`, `columnType: "2"`). Su pantalla de filtros llama a `v3/filterByContent` usando la raíz de películas o series y parámetros `tags`, `year`, `originalCountry` y `audio`. Esas dos operaciones no prueban que el proveedor admita combinar una subcolección como Prime Video con todos los filtros de raíz.

Nuestra interfaz anterior enviaba esa combinación a `filterByContent` con el ID de la subcolección. Aunque preservaba las selecciones en el JSON, podía recibir un listado vacío. La nueva combinación se implementa en el worker: consulta páginas sin filtrar de la colección seleccionada y comprueba género y año de sus títulos. Los identificadores de género se resuelven con los nombres informados por `filterGenre`, y se normalizan equivalencias como Action/Acción. Los filtros generales, sin colección, conservan la consulta remota del proveedor.

Cada interacción revisa hasta tres páginas de 36 títulos. Si todavía no alcanza una página de coincidencias, Seguir buscando continúa sin saltarse resultados. Hay deduplicación y detección de páginas repetidas, caché de dos consultas y límite de metadatos retenidos de páginas anteriores. Los resultados no se sustituyen por títulos de otra colección. No se informa un total final hasta terminar el recorrido y disponer de los metadatos necesarios.

Si la colección no devuelve géneros o años, la app no puede certificar todos los resultados. Lo indica en la interfaz y permite quitar filtros. No se inicia una descarga masiva ni se consulta cada ficha al abrir el catálogo.

La portada visual usa `getNextColumns` para filas editoriales y `getColumnContents` para enlazarlas con su colección. Evita la consulta `getHome`, que en la sesión del usuario respondió `portal100023`, y no consulta novedades por fechas ni países al entrar. No se inventa un ranking ni recomendaciones personales.

Se conserva el soporte de las 22 rutas conocidas. Tener más rutas en el código no acredita que el proveedor habilite todas para la sesión. Esta revisión no altera las rutas de reproducción ni el DNS.
