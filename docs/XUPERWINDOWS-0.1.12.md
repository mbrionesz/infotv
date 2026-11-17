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

Validación completada: 345 pruebas generales, 28 de escritorio y prueba real de filtro prefetch/decodificación/pausa/seek/EOF en x64 y x86, incluyendo recursos empaquetados. [Ejecución Windows](https://github.com/mbrionesz/infotv/actions/runs/44177736183), fuente inmutable `v0.1.12-beta.1`.

Arranque de la fuente de prueba: 2636 ms x64 y 7234 ms x86 en la primera prueba; 672 ms y 899 ms con los recursos empaquetados. Son mediciones del entorno CI con una fuente pequeña y condiciones distintas de calentamiento, no una comparación controlada contra 0.1.11 ni una predicción para el portal. Falta medir cortes de red y reserva real en el PC del usuario.

SHA256 descargados coincidentes con los activos públicos:

- x64: `53eb2d126e92c98196572d4d6a36d02fd4f7bb6c0dfd73d161e93d398c17e61d`
- x86: `0b9941cf1f5f8ea7cb5da7621ef0032e85cf2a8e9bd4d0c5842c1fc07cde4920`

Publicación limpia: https://github.com/mbrionesz/infotv/releases/tag/v0.10.21-beta.3 . La publicación anterior se retiró después de verificar la nueva; Tizen permanece idéntico y las etiquetas Git se conservan.
