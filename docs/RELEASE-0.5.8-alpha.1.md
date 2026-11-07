# XuperTizen 0.5.8 alpha.1

Actualiza HLS.js y el worker local de 1.6.19 a **1.7.4**, con versión exacta en
package.json y package-lock.json. Ambos se compilan para Chrome 56; el empaquetado
verifica la igualdad de versiones y el SHA-256 del worker.

La rama 1.7 incorpora una corrección para ciertos Tizen que quedan buscando
indefinidamente al saltar huecos de buffer (PR #7630). La 1.7.4 incluye correcciones
de carga de fragmentos cancelados, errores de SourceBuffer, continuidad del parser
TS y tiempos de audio/vídeo. Su efecto en el Samsung QN70F requiere prueba física.

Se mantienen buffer 3/6 s, transporte Samsung, DNS, credenciales por CDN, renovación
única tras 404 y recuperación acotada ante desajustes de secuencia. La versión
1.7.4 sigue validando media-sequence y discontinuity-sequence: la actualización no
repara por sí sola listas incompatibles o servidores que devuelven HTTP 404.

## Alternativas del portal

Los registros del usuario muestran cuatro hosts distintos para varios canales.
El adaptador recoge todos los hosts de vivo compatibles con la autorización CFL
que devuelve getSlbInfo, incluyendo direcciones principal y de respaldo, y elimina
duplicados. El reproductor conserva su límite de cuatro candidatos originales;
las variantes HTTPS adicionales son rutas del mismo servidor, no nuevos CDN.
No se ha confirmado el inventario global ni la disponibilidad actual de cada host.

## Validación

Pasaron 56 pruebas unitarias y las pruebas de Chromium: reproducción H.264/AAC
cifrada AES-128 con worker local, controles y cambio de canal; continuidad de 60 s
con errores 404/503, caída temporal de listas, normalización segura y reinicio
completo/cambio de CDN ante desajustes de secuencia. Se verificaron las credenciales
del respaldo y la conservación de Pausa. Metadatos simulados y adaptador HTTP local,
no sockets ni decodificador Samsung.

[Resultados de continuidad](benchmarks/live-continuity-v058.json). No se ha realizado
prueba física de esta versión en Samsung. WGT sin firma para firmar e instalar
con Apps2Samsung.

Fuentes: [release oficial](https://github.com/video-dev/hls.js/releases/tag/v1.7.4)
y [corrección Tizen](https://github.com/video-dev/hls.js/pull/7630).
