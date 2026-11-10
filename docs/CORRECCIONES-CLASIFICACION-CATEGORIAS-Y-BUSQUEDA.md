# Correcciones posteriores a 0.10.13

Incluido en 0.10.14 beta. Se conserva el trabajo previo de caché, contador y limpieza desde Ajustes.

- La película podía tratarse como serie porque `simpleProgramList` se convertía en `episodes`, incluso cuando `type` indicaba movie. Se unifica la clasificación: el tipo explícito prevalece sobre entradas de reproducción y banderas antiguas. El normalizador, el reproductor, las fichas, el historial y la fila Seguir viendo usan esa regla. Nuevos registros guardan el tipo. Registros antiguos se reparan y persisten cuando se conoce su tipo por el catálogo, sin adivinar a partir del título ni borrar el progreso.
- La auditoría de una película tampoco debe usar `detailEpisode` ni `playerEpisode` sobrantes: solicita el ID del título y deja vacío seriesContentId. Ahora imprime el alcance de la solicitud, sin URLs firmadas, licencias ni cabeceras.
- Algunas portadas recibían géneros al nivel superior y un objeto facets vacío ocultaba esos géneros. Se combina la metadata disponible. Las tarjetas principales de Películas se mantienen; si no hay un identificador anunciado se usa el filtro semántico existente, que busca el identificador válido y, si falta, filtra los resultados recibidos. No se inventan códigos del portal ni se devuelven resultados genéricos como si cumplieran el género; puede necesitarse paginar si faltan metadatos.
- Se retira la tarjeta EEUU de Series. Los filtros de país siguen disponibles en búsqueda.
- No se guarda ni muestra historial del teclado. Se elimina el historial antiguo y las consultas dejan de guardarse en la caché persistente de metadatos; las entradas de búsqueda antiguas de esa caché se eliminan al iniciar. Los criterios de una búsqueda activa se mantienen mientras se editan.
- Seguir viendo usa tarjetas verticales, marcos 2:3 iguales, imagen completa con contain, título de hasta dos líneas y episodio/temporada debajo. La fila sigue desplazándose horizontalmente con el control.

## Calidad y log recibido

La muestra de Hope: El primer impacto muestra una sola variante declarada 720p, HEVC/TS, audio coreano y subtítulos en/en español genérico, sin una variante 1080p en esa respuesta. Dimensiones observadas 1281×534, aproximadamente 2,40:1. El timeout corresponde a una portada. Los mensajes de suspensión/reanudación del transmultiplexado corresponden a regulación del búfer.

La ficha de esa película presenta una entrada de reproducción, coherente con el fallo de clasificación. El borrador corrige que el ID de esa entrada se utilice como episodio en vez de consultar el título. No se afirma que la consulta corregida devuelva 1080p hasta comprobarla en el TV. La selección máxima conserva todas las variantes recibidas y las preferencias de idioma; una etiqueta de calidad no aumenta la resolución de un archivo.

## Verificación

Prueba de navegador reproduce un MP4 local con película de tipo movie y una entrada de reproducción: solicita el ID del título sin seriesContentId, muestra ambas calidades de la respuesta controlada y guarda el progreso en Películas. Comprueba portadas sin recorte, ausencia de EEUU y eliminación de historial de búsqueda viejo/nuevo. Pruebas de categorías y filtros de búsqueda con mando y escalas 720p/1080p/4K. La muestra con dos calidades es sintética y no confirma disponibilidad del proveedor para Hope.

Resultado: 315 pruebas unitarias aprobadas. Integración de clasificación/ID de película, categorías, teclado/filtros, Seguir viendo y audio/subtítulos aprobada. Regresión VOD con MP4/MPEG-TS, decodificación local 1920×1080, pausa, seek, autorización renovada y recuperación de biblioteca aprobada. Los tiempos y archivos de prueba no certifican el proveedor ni el rendimiento real del Samsung.
