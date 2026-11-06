# Arquitectura autónoma de 0.2.0 alpha

El objetivo es un único WGT para instalar con Apps2Samsung y utilizar sin PC.
El proceso externo Node/FFmpeg de 0.1 ya no forma parte del runtime del widget.
El manifiesto declara Tizen 4.0; JavaScript se compila para Chrome 56 y las APIs
nativas se detectan antes de usarse. Tizen 4–9+ es un objetivo, no una matriz
certificada por hardware en esta entrega.

## Catálogo y sesión

`browser/standalone.js` adapta los métodos que consumía la UI a funciones del
protocolo original `magis.js`. En la compilación se sustituyen crypto, Buffer,
fs, HTTP/HTTPS, URL y rutas por implementaciones del widget. El transporte es XHR
con TLS y restricciones reales del navegador; no hay proxy externo, servidor
local, desactivación de CORS ni certificados ignorados. Se usan el DNS y la
confianza TLS del TV. Las sesiones prestadas y su descarga están desactivadas.

El cifrado 3DES/MD5 se mantiene por compatibilidad con el protocolo existente,
no como recomendación para diseñar un sistema nuevo. CryptoJS 4.2.0 está fijado;
npm informa que ya no tiene desarrollo activo. Sus resultados se comparan con
OpenSSL/Node mediante pruebas. Cambiar el algoritmo unilateralmente rompería
el protocolo del proveedor.

Una comprobación al portal respondió `403 Invalid CORS request` al preflight.
Además, el diagnóstico de sesión anónima, usando el protocolo correcto a través
del proxy de esta máquina, fue rechazado por `portal100024` (restricción de región).
Eso no confirma que falle igual en Chile, pero tampoco permite afirmar que el
catálogo/canales originales funcionen. Es imprescindible probar el widget real.

## Reproductor

- HLS con cabeceras arbitrarias: HLS.js 1.6.15, cabeceras para manifiestos,
  segmentos y claves, MSE/fMP4 y ABR. User-Agent, Cookie y otros encabezados
  reservados no pueden forzarse por XHR; si el proveedor exige esos valores
  exactos la reproducción puede fallar. No se oculta esta restricción.
- Fuentes sin esas cabeceras: AVPlay si está disponible, con Cookie/User-Agent
  únicamente mediante propiedades documentadas. Para HLS puede retroceder a
  HLS.js; las fuentes normales también tienen ruta HTML5.
- Fuentes progresivas MP4/TS con Content-Auth/Content-License: no están resueltas
  por esta alfa. AVPlay no documenta un equivalente general para esos headers;
  no se simula soporte pasando una URL sin autorización.
- HLS.js sólo se selecciona si isSupported() confirma MSE compatible.
  Audio/vídeo se decodifican con las capacidades reales de la plataforma.
  HEVC, AC-3, E-AC-3 o DTS no se convierten por incluir HLS.js.

Los buffers HLS están acotados (objetivo 20 s, máximo 40 s/24 MB, buffer anterior
15 s). La recuperación de errores multimedia es limitada a un intento, el arranque
tiene plazo de 20 s y cada cambio destruye el HLS anterior y cierra AVPlay.
La vista previa automática del inicio está desactivada para evitar dos sesiones.
El relay FFmpeg y su antiguo selector Modo Fluido no se ofrecen en esta versión.

## Interfaz y controles

La UI mantiene flechas/OK, Return una vez, Play/Pause y avance. El adaptador
AVPlay expone los controles que la interfaz esperaba del elemento vídeo,
restaurándolos al cerrar. La marca solicitada está sólo en el panel de canales.
Las licencias originales y de dependencias se conservan dentro del WGT.

La compilación produce un WGT sin firma; su publicación en GitHub requiere
autorización del usuario. Apps2Samsung gestionará la instalación cuando se
pruebe con el dispositivo y su perfil de firma. Publicar en GitHub no publica
ni modifica la configuración de este entorno en la nube.
