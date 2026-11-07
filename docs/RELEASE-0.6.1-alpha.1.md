# XuperTizen 0.6.1 alpha.1

Prueba solicitada de menor retraso en directo 720p: pasa de dos a **un segmento**
de distancia objetivo al borde HLS publicado. Con segmentos de 5 s, objetivo nominal
aproximado de 5 s; no es latencia extremo a extremo garantizada ni elimina el retraso
de captura, codificación o distribución del proveedor.

- Aplica solo al perfil activado y a vídeo de altura real 720 y ancho hasta 1280.
- Mantiene avance inicial único únicamente si el destino está almacenado y queda
  al menos 0,5 s de vídeo por delante; conserva Pausa y velocidad de reproducción 1x.
- Dos eventos de bloqueo después del arranque restauran el objetivo estable de tres
  segmentos durante esa apertura. Se conserva el búfer de arranque/espera 3/6 s.
- Ajustes → Reproducción etiqueta el perfil como experimental y permite desactivarlo.
  Conserva la preferencia anterior; se aplica al abrir el siguiente canal.
- Diagnóstico conserva liveLatency.mode, targetSegments, seconds, stalls y reason,
  y añade experimental. targetSegments:1 identifica el perfil nuevo; si vuelve a 3,
  reason:repeated-stalls identifica el retorno automático al objetivo estable.

FHD, VOD, HLS.js/worker 1.7.4, DNS, CDN e interfaz conservan su comportamiento.

Validación: 66 pruebas unitarias y Chromium con reproducción AES-128 H.264/AAC
720p, objetivo de un segmento, Pausa/reanudación, preferencias y navegación. Las
pruebas unitarias cubren destino almacenado, ausencia de seek durante Pausa, perfil
FHD/VOD estable y retorno a tres segmentos tras dos stalls. Metadatos simulados y
adaptador HTTP local; no prueba física Samsung ni medida de retraso real.
WGT sin firma para firmar e instalar con Apps2Samsung. El comando anterior de registro
720p sigue siendo compatible y captura el perfil experimental y las recuperaciones.
