# Estilos persistentes y reanudación efectiva

## Correcciones

Los botones de tamaño/color del reproductor cambiaban Zi/en pero no X.playback ni su almacenamiento. Además el HTML ofrecía huge/cyan/lime y el controlador solo contemplaba tres tamaños y tres estilos: podía guardar -1 y dejar clases CSS antiguas. Ahora ambos menús comparten los valores existentes con nuevos índices añadidos, sin desplazar los antiguos. Se guardan al pulsar cada opción y se eliminan todas las clases de estilo previas. Se añade la opción de fondo oscuro al reproductor y nombres accesibles a los colores.

El historial almacenaba position y episodeId, pero el reproductor no recibía position al abrir. Las pruebas anteriores que esperaban currentTime>3 podían pasar reproduciendo desde cero y no acreditaban un salto. Ahora startTime se transmite al motor, se consume solo para el contenido/episodio correspondiente y se limpia el registro temporal para no aplicarlo a otro episodio. Se restaura la temporada guardada antes de permitir reproducir si sus episodios aún no se han cargado. La posición se guarda periódicamente, al pausar y al salir normalmente. Se mantiene el historial local acotado a treinta títulos.

## MPEG-TS

El estado ts-seek observa los keyframes que el demultiplexor ya procesa; no escanea todo el archivo. Mantiene un máximo de 4096 puntos en memoria y guarda solo el anclaje anterior a la posición de reproducción, su timestamp/base, tamaño y SHA-256 de los primeros 64 KiB y la ruta. No almacena URLs completas, licencias ni cabeceras. La huella es parcial: no certifica todos los bytes, pero permite rechazar una cabecera, ruta o tamaño distintos antes de utilizar un anclaje anterior. Un anclaje de archivo o posición inválidos no se aplica.

Al reabrir se lee el comienzo para recuperar pistas/metadatos y verificar el archivo; se publica un índice de salto con el anclaje guardado y se usa Range para el seek. El adaptador del controlador actualiza hasKeyframesIndex al disponer de puntos, y el demultiplexor usa la duración declarada para impedir que el navegador limite el salto al tamaño del búfer inicial. La búsqueda precisa conserva el segundo solicitado mientras decodifica desde el keyframe anterior. No se habilitan saltos por huecos grandes sin puntos verificados ni se convierten formatos/códecs.

Los puntos nuevos se obtienen al reproducir con esta versión. Un historial antiguo sin anclaje puede reanudarse dentro de lo ya indexado/cargado; no se promete un salto lejano de un TS sin información suficiente. Si la fuente cambió, se muestra un aviso y se comienza sin reutilizar un offset no validado. Fuentes con timestamps/discontinuidades incompatibles o servidores sin Range requieren tratamiento adicional; no se certifican todos los TS del proveedor.

Los cambios de audio pueden reutilizar el anclaje de la sesión actual cuando corresponde al mismo archivo, conservando posición y pausa. Sin anclaje se mantiene el aviso antes de reiniciar. Los MPEG-TS sin duración total conocida no guardan el extremo del búfer como si fuese el final del título, para evitar ocultar contenido en progreso.

## Pruebas

Unitarias: huella, tamaño/ruta/anclaje, rechazo de fuentes distintas, límites y publicación única de metadatos. Navegador: todos los tamaños y colores con getComputedStyle y preferencias almacenadas; reinicio con Muy grande/Cian y reproducción posterior. Película TS de tres minutos: reproducción avanzada, salida, reinicio y recuperación más allá de 95 s; se comprueba un Range al offset de keyframe >512 KiB. Serie en segunda temporada/segundo episodio: reapertura y recuperación MP4 a 95 s, imposible de confundir con reproducción normal durante el timeout de la prueba. Se mantienen comprobaciones de audio decodificado, subtítulos, favoritos, pausa y vídeo. La prueba física del Samsung y los archivos reales del proveedor sigue pendiente.
