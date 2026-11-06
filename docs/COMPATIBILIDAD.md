# Compatibilidad de vídeo y audio: primera alfa

El mínimo del manifiesto es Tizen 4.0 y no se fija un máximo. Esto permite
intentar instalar el mismo WGT en 4–9+, pero no acredita todos los modelos.
La TV debe ser Tizen: no se soporta Orsay. El QN70F sigue pendiente de prueba.

| Elemento | Ruta implementada | Límite |
|---|---|---|
| HLS con Content-Auth/Content-License | HLS.js + MSE/fMP4 | Requiere CORS/red y MSE compatibles |
| HLS público | AVPlay si existe, alternativa HLS.js | AVPlay todavía sólo probado con API simulada |
| MP4/TS accesible por URL | AVPlay/HTML5 según soporte | Contenedor, perfil, nivel y audio dependen del TV |
| MP4/TS progresivo con headers arbitrarios | No implementado | No se ignoran esos headers para simular compatibilidad |
| H.264 + AAC | Probado con clip sintético HLS AES-128 | Falta el mismo ensayo en hardware Samsung |
| HEVC/H.265 | Detección de soporte del navegador | No se ha validado perfil, nivel o profundidad de color en TV |
| AC-3/E-AC-3/DTS | Detección de soporte disponible | HLS.js no añade decodificadores; puede faltar sonido |
| Cambio de audio | HLS.js audioTrack / AVPlay setSelectTrack | Depende de pistas realmente expuestas por la señal |
| ABR | HLS.js automático, limitado al tamaño del reproductor | Sólo puede escoger variantes que existan en la lista |
| Buffer y recuperación | Límites de memoria/tiempo y un intento multimedia | No garantiza estabilidad de una fuente defectuosa |

Se recomienda empezar las pruebas físicas con un canal H.264/AAC y después
ensayar otros formatos que el proveedor ofrezca. Un resultado canPlayType o
isTypeSupported es indicativo y no sustituye a decodificar una muestra real.
No se afirma que una biblioteca JavaScript pueda corregir un códec ausente.

Se evita SET_MODE_4K, propiedad deprecada en modelos modernos. No se fuerza
una resolución o decodificador que el firmware no haya anunciado. El widget
usa AVPlay mediante detección de funciones y conserva valores por defecto si
un ajuste de buffering no está disponible.
