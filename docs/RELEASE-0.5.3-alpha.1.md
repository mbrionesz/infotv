# XuperTizen 0.5.3 alpha.1

Actualiza HLS.js de 1.6.15 a 1.6.19, fijado en package.json y package-lock.json.
El worker se recompila desde dist/hls.worker.js del mismo paquete instalado;
ambos bundles apuntan a Chrome 56. build-info registra versión de ambos y hash
del worker; el empaquetador comprueba versión, dependencia y hash coherentes.

## Buffer y recuperación

Para HLS en vivo se esperan aproximadamente 3 s de contenido almacenado antes
de play. Tras un evento waiting durante la reproducción, se pausa internamente
mientras continúan las descargas y se intenta reunir 6 s antes de reanudar.
Pausa del usuario cancela la reanudación automática; cambiar/cerrar el canal
restaura controles y cancela esperas y timers. No se alteran timestamps ni se
aplica un desfase fijo de audio. VOD y HTML5 conservan su comportamiento.
AVPlay solicita también 3/6 s mediante su API, si el firmware la admite.

La ventana de algunos directos no permite reunir esos umbrales. Para no esperar
indefinidamente, tras 6 s de espera inicial o 12 s de rebuffer puede reanudar con
al menos 0,5 s disponibles; bufferGate.limited identifica esa salida. No implica
que se hayan almacenado 3/6 s. El plazo total inicial sigue limitado a 30 s y
puede cambiar de candidato antes si el origen no responde. Máximo de buffer HLS
sigue en 30 s objetivo/45 s techo temporal y límite configurado de 24 MB.

Errores fatales de lista levelParsingError/levelEmptyError pueden reintentar el
mismo candidato incluso antes del primer playing, antes de pasar a respaldos.
Se usa el presupuesto compartido de hasta tres recuperaciones de red por minuto,
con esperas de 1/2/3 s. Los reintentos HTTP acotados existentes se mantienen.
No se ignoran errores de parseo ni se alimenta al decoder con listas inventadas.
404 conserva su renovación única; 401/403/416 no se convierten en esos reintentos.
Se mantienen los cuatro candidatos y sus autorizaciones separadas.

Diagnóstico añade bufferGate (objetivo, cantidad al liberar play, motivo de
salida limitada) y playlistError (categoría del error, longitud de respuesta,
cabecera EXTM3U y número de segmentos si el error expone texto). No imprime el
cuerpo de listas ni credenciales. No demuestra por sí solo el origen de una
respuesta defectuosa, DNS alterado, FPS o sincronía física del televisor.

## Validación y límites

46 pruebas unitarias e integración Chromium de reproducción/controles, cuatro
candidatos, credenciales, renovación 404 e importación propia M3U. Prueba de 60 s
con H.264/AAC AES-128, worker real 1.6.19, umbral inicial de 3 s y reanudación con
6 s, respuesta de lista sin TARGETDURATION, 404/503 transitorios y caída después
del segundo 30. Verifica recuperación del parseo en el mismo CDN y avance del
vídeo. Se simula metadata del portal y se usa adaptador HTTP local, no sockets ni
decodificador Samsung. Ver datos en benchmarks/live-continuity-v053.json.

La 1.6.19 incluye correcciones de timestamps y bloqueos específicos, pero no se
garantiza que resuelva los errores de las señales del usuario ni servidores 404.
Prueba física de 0.5.3 pendiente. Se mantiene el SDK nativo experimental antiguo,
TLS verificado, ausencia de presets externos y WGT sin firma para Apps2Samsung.
