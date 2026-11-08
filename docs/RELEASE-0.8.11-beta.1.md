# XuperTizen 0.8.11 beta

- Audio preferido: prioriza español latino cuando las pistas/variantes lo identifican, después español genérico y castellano. No inventa un doblaje ni distingue regiones si la fuente solo declara spa/es.
- MPEG-TS selecciona el PID de audio real a partir de la PMT y su idioma; MP4/HLS/AVPlay usan las pistas disponibles. Se elimina el manejador heredado que volvía a imponer el primer español del portal.
- El menú muestra las pistas y selección reales, permite cambiarlas y conserva el foco. MP4 mantiene posición y pausa al cambiar; MPEG-TS sin índice reinicia el archivo y lo avisa antes de seleccionar.
- Subtítulos SRT/WebVTT: timestamps con/sin horas, carga mediante transporte Samsung con alternativa XHR, cancelación y límites de tamaño. La apertura del vídeo ya no cancela permanentemente su descarga. Un fallo se informa y no se deja activado como si hubiese cargado.

Pruebas con tres pistas: portugués primero, español de España y español latino. Se mide la frecuencia del audio decodificado para comprobar selección/cambio, se verifica pausa, posición MP4 y subtítulos en pantalla desde los controles reales. Mantiene los 17 DNS. Los idiomas y formatos disponibles dependen de cada fuente.

Instala el WGT con Apps2Samsung. En Ajustes → Reproducción → Audio preferido elige Español latino; las preferencias anteriores se conservan.
