# XuperTizen 0.8.12 beta

- Tamaño y color de subtítulos se aplican y se guardan desde el reproductor. Se unifican todas las opciones visibles: normal/grande/pequeño/muy grande y blanco/amarillo/fondo oscuro/cian/verde lima. Cambiar de estilo elimina las clases anteriores.
- Se corrige la reanudación: antes el historial guardaba posición/episodio, pero no aplicaba la posición al abrir. Ahora Seguir viendo recupera el punto y la temporada/episodio, conservando la elección tras reiniciar.
- MPEG-TS puede guardar un anclaje de byte/fotograma verificado con huella parcial, ruta y tamaño de archivo. Se lee la cabecera y se salta por Range al punto guardado; no se descarga desde el principio hasta el minuto solicitado. Usa los nuevos puntos guardados con esta versión. Un archivo cambiado o un anclaje inválido no se usa para saltar a ciegas.
- Con anclaje disponible, cambiar audio MPEG-TS también puede conservar la posición. Si no lo hay, se mantiene el aviso de reinicio.

Pruebas de todos los tamaños/colores con estilo calculado, guardado y reinicio, reanudación TS avanzada fuera del búfer inicial y serie en temporada dos/episodio dos con posición MP4 avanzada. Datos de laboratorio; pendiente validar los archivos del proveedor en el Samsung. Mantiene los 17 DNS y selección de español latino.

Instala el WGT con Apps2Samsung. El guardado es local al televisor.
