# XuperTizen 0.6.2 alpha.1

## Corrección verificable del objetivo 720p

La política anterior podía marcar el posicionamiento como terminado antes de que
la línea de tiempo estuviera lista. Además, una espera al buscar una posición con
vídeo ya almacenado podía entrar en el relleno de seis segundos, alejando otra vez
la reproducción del borde HLS. La nueva prueba con vídeo 720p real reprodujo esa
interacción; la prueba anterior solo comprobaba el valor de configuración en una
lista con ENDLIST y no demostraba la distancia de una señal móvil en directo.

- Comprueba la posición tras iniciar reproducción y en actualizaciones de búfer y
  del monitor, sin concluir para siempre que ya está alineado tras un valor inicial.
- Avanza solo hacia una posición calculada por HLS.js que esté almacenada y tenga
  al menos 0,5 s de vídeo por delante. Respeta Pausa y seeking, mantiene velocidad 1x
  y limita las correcciones a tres por minuto, separadas al menos diez segundos.
- Usa edge + age de latestLevelDetails menos currentTime para medir la distancia
  actual, en vez de copiar solo la caché de latencia al añadir un segmento.
- Espera 500 ms después de playing antes de buscar una posición. Una espera de
  seek con reserva no fuerza relleno. Con al menos un segundo disponible deja
  actuar al reproductor; conserva seis segundos tras una falta real de reserva.
- En el perfil experimental, una lista de nivel que repite la secuencia anterior
  puede consultarse hasta dos veces más a intervalos de 250 ms. Evita esperar
  medio segmento cuando se consultó justo antes de publicarse el nuevo. Conserva
  URL y autorización, la respuesta sigue siendo real y el cierre cancela la espera.

Diagnóstico liveLatency: engineTargetSeconds, engineSyncPosition, measurementMethod,
seconds, alignment, alignmentSeeks y último avance. targetSegments:1 continúa siendo
objetivo nominal aproximado de 5 s con segmentos de 5 s, no retraso desde el estadio.
FHD mantiene tres segmentos; no se ignora la validación de secuencias del proveedor.

## Apertura y cambios de canal

- La reserva inicial pasa de tres a un segundo en HLS en vivo. BUFFER_APPENDED
  revisa el control inmediatamente, evitando depender solo de la revisión de 250 ms.
- La guía detiene descargas del canal anterior antes de resolver el siguiente y no
  reinicia un canal que ya está reproduciéndose al pulsar OK otra vez.
- Debounce de cambios repetidos: 120 ms, manteniendo selección explícita inmediata.
- Las cancelaciones eliminan HTTP en cola; una operación HTTP síncrona activa se
  corta terminando su worker y creando reemplazo. Los demás trabajos no se abortan.
  La consulta DNS compartida conserva deduplicación y caché. Reemplazar un worker
  tiene un coste de inicialización que debe medirse en el Samsung.
- El presupuesto de cada petición incluye inicialización, DNS, cola, direcciones
  y redirecciones; cada salto deja de reiniciar el tiempo disponible.
- sourceResolveMs mide resolución; startupMs mide desde la apertura del reproductor;
  channelOpenMs suma ambos desde el inicio de resolución (no incluye debounce).
  El transporte informa trabajos activos/en cola, cancelaciones y reemplazos.

## Validación

Pasaron 71 pruebas unitarias, Chromium (720p cifrado AES-128, controles, guía,
cambio de canal, preferencias y diagnóstico), continuidad de 60 s con 404/503 y
listas inconsistentes, y la nueva prueba de latencia con señal móvil 720p y segmentos
de cinco segundos. Esta última comprueba avance de fotogramas decodificados y cero
muestras en pausa durante su tramo de observación, además de Pausa/reanudación.

Prueba local: objetivo del motor 5 s; distancia medida 5,02–5,34 s, mediana 5,225 s;
229 fotogramas avanzados entre primera y última muestra; apertura local 158 ms.
Metadatos simulados y adaptador HTTP local, no sockets/decodificador Samsung ni
servidores del proveedor. No es una medición del tiempo desde que ocurre el partido.

[Latencia y apertura](benchmarks/live-latency-v062.json) ·
[Continuidad](benchmarks/live-continuity-v062.json).
Prueba física Samsung pendiente.
El servidor y la sesión del proveedor siguen determinando parte del arranque.
No se promete apertura en milisegundos ni cinco segundos constantes en el TV.
HLS.js y worker siguen en 1.7.4. WGT sin firma para Apps2Samsung.
