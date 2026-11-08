# Audio y subtítulos: selección efectiva

## Fallos encontrados

MPEG-TS usaba el primer PID de audio y el wrapper ignoraba preferredAudio. MP4 seleccionaba un idioma solo al abrir y no implementaba selectAudio. El manejador heredado onloadedmetadata volvía a seleccionar por el primer idioma español anunciado por el portal, pudiendo sobrescribir la elección del reproductor y dejarlo pausado. El menú podía presentar Español como pista predeterminada aunque careciese de información real.

Los subtítulos se descargaban solo mediante XHR y su parser requería HH:MM:SS; el WebVTT MM:SS no funcionaba. La descarga iniciada al resolver el título era cancelada al limpiar el reproductor antes de abrir su URL, sin recargarse posteriormente.

## Implementación

Una política común reconoce ISO 639 y etiquetas de idioma. Prioriza español latino cuando hay evidencia regional (es-419/es-MX/es-CL, latino/latam), luego español sin región y después castellano/es-ES. Si la fuente solo marca spa/es, no puede determinar si se trata de doblaje latino. Cuando faltan etiquetas, puede usar audioInfo del portal por orden como indicio, sin sustituir un idioma ISO conocido por una etiqueta contradictoria. Si no identifica español conserva la primera pista y lo refleja en diagnóstico, sin rotularla Español por defecto.

El núcleo puede elegir una variante que anuncie el idioma preferido en la selección automática; índices no predeterminados solicitados explícitamente se respetan. La calidad y códec siguen dependiendo de la variante y el soporte del TV.

La compilación usa el código fuente de mpegts.js 1.8.0 con un adaptador propio en la PMT, validado contra un anclaje único. Lee descriptores ISO 639, enumera los PIDs de audio soportados y asigna el elegido a common_pids antes de la demultiplexación. No reescribe paquetes, CRC, bytes de vídeo ni timestamps. Los codecs privados no soportados por el demultiplexor no se convierten en soportados por asignarles idioma. Worker MPEG-TS permanece desactivado. Se añade events 3.3.0 para la compilación de fuente; licencias incluidas.

MP4Box elige entre pistas reales y al cambiar crea una nueva sesión MSE con el mismo archivo/cabeceras. Recupera posición por su índice y conserva una pausa manual. MPEG-TS sin índice reinicia al cambiar de pista: el menú muestra esa limitación antes de seleccionar. La selección automática se realiza antes de comenzar, por lo que no introduce ese reinicio inicial. HLS usa audioTracks y AVPlay usa getTotalTrackInfo/setSelectTrack; su soporte efectivo depende del firmware. El cambio de idioma no transcodifica ni traduce audio.

El menú obtiene las pistas del motor, utiliza nombres regionales cuando están identificados y conserva el foco después de reconstruir opciones. El audio por defecto sigue la preferencia guardada: no se fuerza español a quien tenía portugués seleccionado. La opción de español se presenta como Español latino para indicar la prioridad y admite fallback a otros españoles disponibles.

La carga de SRT/WebVTT usa el transporte Samsung cuando está disponible y mantiene Host/TLS/DNS de esa capa; si este devuelve control al navegador, XHR depende del DNS del sistema y CORS. No reenvía las credenciales del vídeo a una URL de subtítulos distinta. Limita el archivo a 1 MiB, admite cancelación, descarta respuestas de sesiones antiguas y muestra errores HTTP/formato. Se interpreta texto y se renderiza con textContent, sin crear HTML a partir de los subtítulos. ASS/TTML no se anuncian como compatibles con este parser.

## Validación

Unitarias: idiomas/regiones, español ausente, PMT con tres AAC y ausencia de idioma, preferencia entre variantes, formatos y timestamps SRT/VTT, HTTP y cancelación. Navegador: archivos generados con portugués a 440 Hz, castellano a 660 Hz y latino a 880 Hz, portugués primero. Un analizador WebAudio comprueba el tono decodificado (no solo el índice mostrado). Comprueba selección latina, cambio desde el diálogo real a portugués, cambio estando pausado, posición MP4, aviso MPEG-TS y subtítulos que se activan/desactivan en pantalla. Se conserva la prueba contra HTML ejecutable en subtítulos. Son datos de laboratorio; las etiquetas reales del proveedor y el firmware Samsung requieren comprobación física.
