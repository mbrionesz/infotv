# Navegación y categorías de Películas y Series

Se corrigieron dos problemas: la condición para subir al menú superior comparaba índices con un conjunto que incluía botones ocultos; el desplazamiento hacia un botón del carrusel hacía visible solo ese botón. Ahora se identifica el encabezado por su elemento y al volver al carrusel se recupera su inicio completo.

El regreso de una ficha conserva el identificador y la fila de origen. Si un título también está en Seguir viendo o Mi lista, no se confunde con esa copia. La carga de una fila conserva el elemento enfocado y los controles del filtro se gestionan aparte de los del catálogo.

## Filas

Películas prioriza Acción, Drama y los demás géneros anunciados. Series muestra Acción, Crimen, Serie Coreana y Serie Turca. Los géneros utilizan los IDs de `catalogFilters`; las series regionales prefieren un código de categoría compatible de `catalogColumns` y, si no existe, un país anunciado por el portal. No se envían traducciones españolas como identificadores inventados.

Cada fila contiene hasta 12 vistas previas y **Ver todas** abre el catálogo completo paginado para ese filtro. No se reduce todo el género a esas 12 tarjetas. La ausencia de metadatos o de resultados se comunica explícitamente.

Las filas se solicitan al entrar cerca de la pantalla mediante IntersectionObserver, con una consulta en curso y caché de diez minutos acotada a 24 consultas. No utilizan TMDB para sus tarjetas. Cambiar de sección o abrir una ficha cancela las actualizaciones de la vista anterior.

## Filtro

El panel presenta Género, Año, País y Colección, con las opciones reales del proveedor. Se editan los valores y se confirma con Ver resultados. Cancelar no aplica la selección. Los botones se recorren con Arriba/Abajo y OK; el desplazamiento se limita al propio panel. Volver desde los resultados devuelve a la portada del catálogo.

## Comprobación

`npm run test:catalog-remote-ux` recorre mediante D-Pad las doce tarjetas de Acción y abre cada ficha, comprueba el regreso a la misma tarjeta, recorre las cuatro filas de Series y abre sus fichas, verifica Ver todas, los códigos de categorías coreanas/turcas, la combinación género/año/país y el regreso al carrusel completo a 720p y 4K. Los datos son propios de prueba: esto no demuestra disponibilidad del proveedor ni sustituye probar el firmware Samsung.
