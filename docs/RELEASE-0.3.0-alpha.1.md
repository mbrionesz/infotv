# XuperTizen 0.3.0 alpha.1

Actualización para los menús lentos y el arranque de canales que agotaba 20 s
en el QN55QN70FAGXZS (Tizen 9, firmware T-PTMFUABC-0090-1301.0).

- Navegación acotada: guía de tres columnas, 12 filas visibles y catálogo de 36
  tarjetas por página. Teclado QWERTY con historial y favoritos.
- TripleDES, red e índice del catálogo en un Web Worker; caché IndexedDB limitada
  para metadatos y miniaturas. Filtros según género/año/país/resolución recibidos.
- AVPlay para fuentes compatibles con su autorización; HLS.js conserva los
  headers del proveedor en manifiestos, segmentos y claves. Rectángulo AVPlay
  normalizado a 1920×1080 incluso en pantallas 4K.
- Diagnóstico por etapa y estado HTTP, comprobación temprana de manifiesto,
  alternativa HTTPS en el mismo CDN y limpieza al cambiar de canal. En Samsung
  se evita el worker blob de HLS.js; el worker del protocolo sigue activo.

14 pruebas unitarias y reproducción real de un HLS H.264/AAC AES-128 sintético
con autorización aprobadas en Chromium, incluida vista previa → pantalla completa.
Benchmark local con 2.000 canales simulados y CPU ×6: P95 de manejo de flechas
97,3 → 10,4 ms. No representa FPS ni reproducción en un Samsung físico.

**Falta instalar esta actualización en la TV y comprobar un canal real.** La
0.2 sí cargaba la lista en esa TV, pero no reproducía. No se garantiza que la 0.3
resuelva el acceso al proveedor, todos los códecs, 60 FPS ni 21.000 títulos reales.
No se incluye DoH por IP con Host/SNI personalizados: continúa el DNS del TV.

WGT autónomo, sin PC durante el uso, mínimo declarado Tizen 4.0 y objetivo 4–9+.
Se distribuye sin firma para importar/firmar con Apps2Samsung. La publicación en
GitHub no constituye certificación Samsung ni inclusión automática en su catálogo.

En la guía: OK reproduce, Azul pasa a pantalla completa, Verde abre búsqueda,
Rojo guarda favorito, Amarillo actualiza y Return vuelve. Para diagnosticar la
vista previa, columna derecha → Diagnóstico; en pantalla completa, botón Azul.
Si falla, enviar foto del diagnóstico y nombre del canal, sin tokens o certificados.
