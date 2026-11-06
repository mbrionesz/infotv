# Arquitectura autónoma de 0.3.1 alpha

Un WGT, sin proceso Node/FFmpeg ni PC durante el uso. Mínimo declarado Tizen 4.0,
JavaScript compilado para Chrome 56. La detección de APIs evita asumir soporte,
pero no sustituye a probar cada familia de TV.

## Trabajo y almacenamiento

`core-client.js` envía solicitudes a `vendor/core-worker.js`: protocolo original,
TripleDES/MD5, red XHR e índice del catálogo quedan fuera del hilo de interfaz.
Se conserva el algoritmo del proveedor por compatibilidad y se verifica contra
OpenSSL; no es una recomendación criptográfica para protocolos nuevos.
No se descargan sesiones prestadas.

IndexedDB guarda metadatos (máximo 160 entradas/16 MB) y miniaturas (80/12 MB).
Los datos vencidos pueden mostrarse durante un plazo acotado de 24 h mientras
se actualizan en segundo plano; se indica el uso de lista guardada. Las sesiones,
licencias y URLs de reproducción resueltas no se persisten en esa caché.
Las miniaturas se reducen fuera del hilo principal cuando OffscreenCanvas está
disponible; con CORS o APIs ausentes la carga/caché de imágenes es best effort.
No hay reproducción offline de canales.

El índice contiene sólo metadatos recibidos, con filtros por género/año/país/
resolución cuando existan. Las 21.000 entradas son un ensayo sintético; no se
inventa el tamaño ni la resolución del catálogo real. Se muestran 36 tarjetas
por página, hasta 12 canales en la guía y 24 filas en el inicio.

## Reproducción

AVPlay es prioritario para fuentes que su API puede autorizar (URL, COOKIE y
USER_AGENT documentados). Para Content-Auth/Content-License se usa HLS.js con
headers en manifiesto, segmentos y claves. No existe una propiedad AVPlay general
documentada para esos headers; no se elimina la autorización para forzarlo.
MP4/TS progresivo que los necesite continúa sin soporte.

HLS.js requiere MSE, CORS y códecs presentes en el TV; no transcodifica audio o
vídeo. Se comprueba primero el manifiesto protegido (plazo 6,5 s), se informa la
etapa/HTTP y se limita el buffering y la recuperación. Si falla HTTP se intenta
HTTPS en el mismo hostname, conservando path/query y validando TLS; no se cambia
a IP ni se desactiva la validación. No garantiza que el proveedor admita HTTPS.
El worker blob de HLS.js se desactiva con UA Samsung como ruta de compatibilidad;
el worker empaquetado del protocolo sigue activo. AVPlay tiene fallback tras
8 s de preparación y usa coordenadas normalizadas a su espacio 1920×1080.
Cambiar/cerrar destruye la instancia anterior. La vista previa se inicia con OK
y se detiene antes de abrir pantalla completa.

## DNS y red

Se usa el DNS y la confianza TLS del TV. XHR/fetch no permiten proporcionar una
función `lookup`, forzar `Host` ni elegir SNI; acceder por IP tampoco preserva
por sí solo el hostname del certificado. Por ello **no se implementa la carrera
DoH por IP** de seis resolutores con caché/timeout/cooldown solicitada. Una ruta
nativa de sockets/TLS o equivalente exigiría otra implementación y validación
por versión; no se presenta como disponible en todos los Tizen 4–9+.
No hay proxy externo ni certificados ignorados.

## Mando y diagnóstico

Flechas/OK navegan; Return cierra la capa activa. En guía: Rojo favoritos,
Verde teclado, Amarillo actualizar, Azul pantalla completa, Canal ± cambia con
breve debounce y Play/Pause controla reproducción. El volumen queda al sistema.
La columna derecha ofrece Diagnóstico de la vista previa; fuera de la guía,
Azul abre el diagnóstico del reproductor principal. No muestra tokens ni URLs
firmadas. La marca se conserva como «By MatiasB» en menú y «XuperTizen by Matias»
en búsqueda/selección; desaparece en vídeo a pantalla completa.

El WGT se distribuye sin firma para Apps2Samsung. Publicar la release de GitHub
no publica ni modifica la configuración de este entorno en la nube.

La 0.3.1 añade diagnóstico DoH por IP y recuperación de CDN documentados en
[la revisión de referencias](REFERENCIAS-RENDIMIENTO-DNS.md). Las IP obtenidas
no sustituyen el resolver del vídeo. El límite global de arranque es 30 s.
