Primera alfa autónoma de XuperTizen. El WGT ejecuta la interfaz y el protocolo
del catálogo en la TV; ya no necesita el servicio de Windows/Node/FFmpeg.
Apps2Samsung puede importar el archivo WGT y gestionar su firma e instalación.

- Mínimo declarado: Tizen 4.0. Objetivo: 4–9+. Sin validación física por versión.
- HLS.js 1.6.15 para señales HLS con cabeceras de autorización; ruta AVPlay para
  fuentes que admita su API. Buffers acotados y limpieza al cambiar de canal.
- Frontend oscuro/menta, navegación con mando, «By MatiasB» en el menú y
  «XuperTizen by Matias» en el panel de canales.

Validación: HLS.js reprodujo un clip sintético H.264/AAC cifrado AES-128,
con autorización en listas, segmentos y clave, pausa/reanudación y cambio de
canal. AVPlay se verificó con una API simulada. No se probó un Samsung real.

**Límites conocidos:** el portal rechazó el preflight con HTTP 403/CORS y una
activación anónima desde el entorno de desarrollo con `portal100024` (región).
No está confirmada la reproducción de sus canales desde el widget instalado.
HLS.js no incorpora códecs ausentes del hardware. El MP4/TS progresivo con
cabeceras arbitrarias no está resuelto por esta alfa.

El WGT adjunto está **sin firma**. No es una garantía de compatibilidad con el
QN70F ni con todos los televisores Tizen 4–9+. Para comenzar, importa el WGT
en Apps2Samsung y sigue el proceso de firma de esa herramienta.

El archivo `SHA256SUMS.json` contiene las huellas del WGT y del ZIP de fuentes.
`release-info.json` identifica explícitamente el estado alfa y las validaciones
pendientes. Esta release no implica inclusión automática en el catálogo general
de Apps2Samsung; el repositorio puede agregarse como fuente propia.
