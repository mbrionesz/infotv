# XuperWindows 0.1.12 beta · caché VOD

`network-caching=2000` es el objetivo de retardo/preparación de entrada, no la reserva total de vídeo. VLC 3 usa además el filtro de lectura anticipada `prefetch`, con valor por defecto de 16 MiB y lecturas máximas de 16 MiB. La ruta anterior de mpv usaba un límite de demux de 32 MiB. Por tanto, no era correcto describir toda la caché actual como dos segundos.

Se configura explícitamente prefetch con límite de 32 MiB en x64 y 16 MiB en x86, lecturas máximas de 256 KiB y umbral de salto de 16 KiB. Se mantiene el objetivo de entrada en 2000 ms para no pedir una precarga inicial de varios minutos. El filtro puede usar menos memoria para fuentes pequeñas; no es el consumo total del proceso, ni son minutos garantizados. Un salto grande reutiliza datos si están en caché o solicita otra posición al servidor, sujeto al índice del medio y al soporte de rangos.

Durante reproducción se rellena la lectura anticipada hasta su límite. El código de VLC puede pausar ese hilo cuando la entrada está pausada: no se promete descargar tres minutos durante una pausa. A 4 Mbps, 32 MiB representan como máximo unos 67 s de datos comprimidos; a menor bitrate pueden representar minutos. No se deriva la reserva actual de los bytes acumulados del proxy.

El motor publica sus límites de caché por el canal privado y la UI muestra el límite real configurado según la arquitectura. Las pruebas Windows comprueban que se selecciona el filtro prefetch, leen los límites, miden el arranque y verifican pausa/seek/EOF x64/x86, también en recursos empaquetados.

Fuentes oficiales revisadas:

- https://github.com/videolan/vlc/blob/3.0.x/modules/stream_filter/prefetch.c
- https://github.com/videolan/vlc/blob/3.0.x/src/input/access.c
- https://github.com/videolan/vlc/blob/3.0.x/modules/access/http/access.c

Tizen 0.10.21 se conserva byte por byte en una publicación conjunta limpia.
