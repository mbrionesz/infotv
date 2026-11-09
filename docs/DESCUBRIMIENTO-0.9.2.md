# Descubrimiento de películas y series

La entrada de Películas y Series cambia de un grid genérico a una portada con hero, novedades horizontales, accesos por país y género, y búsqueda. «Catálogo completo» mantiene los filtros y paginación del proveedor. Los destinos Infantil/Anime/Explorar/Populares conservan su ruta previa. Derecha/izquierda recorre una fila; arriba/abajo pasa entre secciones. Volver desde la ficha restaura la posición y el foco de la tarjeta. El clic con puntero actualiza el mismo foco que el D-Pad.

## Novedades y períodos

El worker consulta las categorías del root real, sus filtros y la selección editorial. Busca una colección cuyo nombre indique novedades/estrenos/recientes/últimos. En «Novedades» usa la colección del proveedor, sin deducir que cada título sea nuevo por su año. Si no existe colección, puede usar estrenos recientes con fechas verificables de la selección editorial; la etiqueta refleja esa diferencia. Una colección de novedades vacía no se rellena silenciosamente con títulos editoriales antiguos.

Los últimos siete/treinta días filtran releaseDate completa y válida; excluyen fechas futuras, fechas inválidas y metadatos de solo año. Se ordenan por fecha de estreno. No se afirma que releaseDate sea fecha de incorporación ni de actualización de episodios. Se consultan como máximo tres páginas de 24 títulos de novedades para mantener acotados red, memoria y tiempo de arranque. La consulta tiene un presupuesto de 21 segundos y puede devolver una selección parcial ante lentitud. Las portadas se piden al entrar en pantalla, sin descargar todas las filas al iniciar. El panel muestra que el alcance es esa selección y no todo el catálogo. Si faltan fechas, muestra la limitación en lugar de inventarlas.

El caché en memoria del worker dura diez minutos y su clave incluye root, período y fecha local del televisor. Se actualiza al abrir o volver si venció, al cambiar de día y cada diez minutos mientras se usa la portada. No consulta con la portada suspendida, durante el teclado o un menú abierto. «Actualizar novedades» fuerza una consulta. La actualización conserva el foco si el título sigue disponible.

## Países

Los nombres conocidos Turkey/TR/Türkiye, Korea/KR/South Korea y United States/US/USA se presentan como Turquía, Corea del Sur y Estados Unidos. El valor enviado sigue siendo exactamente la clave del portal. El resto de países permanece en «Todos los países». Si un país destacado no está en los filtros informados, se presenta desactivado con explicación; no se fabrica una clave ni se devuelve otro país a escondidas. El filtro completo muestra nombres traducidos sin alterar sus valores.

## Hosts y alcance

Tras la pregunta específica sobre el envío de solicitudes con datos de sesión/autorización e identificadores del dispositivo a dtgrd.txhnojlbu.com y c2tgd.izvhrdcjb.com, el usuario respondió «Lo autorizo asi que agregalo al codigo no más». Se añaden ambos al mapa de portal que usa el worker, sin cambiar el protocolo ni crear sesiones por host. Son diez hosts únicos; no diez DNS ni necesariamente diez CDN de un canal. Los diecisiete resolutores y los límites de recuperación/almacenamiento se mantienen.

## Validación

Unitarias: países con claves opacas, fechas en límites de semana/mes, futuro/fechas inválidas, actualización por TTL/día, selección acotada y colección vacía. Chromium: entrada distinta del catálogo completo, cambio de período, país enviado con su clave real, desplazamiento arriba/abajo y horizontal, ficha/Return Samsung, foco restaurado, teclado y capturas 1080p/4K/720p. La suite anterior sigue comprobando el catálogo completo. Las capturas están generadas con metadatos locales de demostración, no certifican novedades del proveedor.
