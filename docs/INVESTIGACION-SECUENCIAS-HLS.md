# Error de secuencia HLS: investigación y límites

Consulta de fuentes públicas: 7 de noviembre de 2026. Versión analizada: HLS.js 1.7.4.

## Qué comprueba HLS.js

En mergeDetails/intersection, HLS.js compara el relurl del segmento viejo y del
nuevo que ocupan el mismo número de secuencia. La función
notEqualAfterStrippingQueries ignora la consulta y compara el resto de la URI.
Si difiere, produce `media sequence mismatch`; la comprobación siguiente compara
el contador de discontinuidades. No mide FPS, CPU, bitrate ni errores de decodificación.
Las huellas de URL no prueban igualdad o diferencia de los bytes multimedia.

[Implementación](https://github.com/video-dev/hls.js/blob/v1.7.4/src/utils/level-helper.ts).

## Casos públicos relevantes

- [PR 7465](https://github.com/video-dev/hls.js/pull/7465): corrigió falsas alarmas
  al cambiar la URL base o la consulta sin cambiar la URI relativa. Este antecedente
  demuestra que un error de parser puede ser un bug del cliente. La implementación
  instalada ya compara relurl e ignora consultas; no corresponde reaplicar el parche.
- [Issue 7962](https://github.com/video-dev/hls.js/issues/7962): reporta un falso
  desajuste de discontinuidad en un fragment hint LL-HLS sin partes. Hubo corrección
  en el historial oficial (fe00c648a0). No es equivalente a nuestra señal: usamos
  HLS normal, lowLatencyMode:false y listas de segmentos completos de unos 5 s.
- [PR 8048](https://github.com/video-dev/hls.js/pull/8048): limita el realineamiento
  de discontinuidades para no borrar una discontinuidad insertada en contenido ya
  publicado. Una validación más estricta puede descubrir un defecto antes oculto.
- [RFC 8216, secciones 6.2.1 y 6.3.4](https://www.rfc-editor.org/rfc/rfc8216):
  las actualizaciones deben mantener la coherencia de los segmentos publicados.
  Un salto del primer número de secuencia cuando avanza la ventana no es por sí
  solo un error; tampoco hay que comparar números entre rendiciones diferentes.
- La búsqueda en Stack Overflow devolvió un caso de TS truncado y desincronización
  ([57346378](https://stackoverflow.com/questions/57346378/ffmpeg-hls-timing-broken-because-of-broken-ts-file)).
  Es un error PES/TS, no evidencia de media-sequence-mismatch: se descarta como explicación.
  La búsqueda global de issues de GitHub devolvió HTTP 422; se revisaron directamente
  issues, PR, historial por archivo y código oficial, sin afirmar una búsqueda exhaustiva.

## Qué sabemos del Samsung

La misma app 0.5.9 reproduce 720p sin errores ni reinicios en las muestras entregadas,
y FHD reproduce con reserva de unos 12 s antes de errores de secuencia y respaldos
404. Esto orienta hacia la variante FHD/listas/distribución, no demuestra por sí solo
un defecto del proveedor ni descarta carga adicional del televisor.

FHD exige más ancho de banda y decodificación. Una descarga lenta puede agotar el
búfer, perder segmentos de una ventana corta o producir 404; no modifica por sí
sola la asociación entre número de secuencia y URI que evalúa el parser.

Próxima instrumentación propuesta: huellas de URI relativas sin consultas, duración,
byterange, discontinuidad y secuencia entre actualizaciones, junto a bytes/tiempos
reales de descarga y, cuando estén disponibles, métricas de fotogramas. Comparar
solo dentro de una ruta y sesión, sin conservar URL, claves ni tokens en el log.
No se desactiva ignorePlaylistParsingErrors ni se renumeran listas sin evidencia.

## Perfil 720p de 0.6.0

Después de conocer dimensiones reales 1280x720 (ancho hasta 1280, altura 720), la app
ajusta liveSyncDurationCount de 3 a 2 en directo. Puede avanzar una sola vez a
liveSyncPosition si el destino ya está almacenado y hay al menos 0,5 s por delante.
No fuerza un seek durante Pausa. Mantiene la velocidad 1x y el control de búfer 3/6 s.
Dos eventos bufferStalledError después de empezar restauran objetivo de 3 segmentos
para esa apertura. Ajustes permite desactivar el perfil para el siguiente canal.
No reduce el retraso de captura/codificación del proveedor ni garantiza 5 s exactos.
