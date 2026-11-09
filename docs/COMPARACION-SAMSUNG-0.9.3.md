# Catálogo, portadas y reproducción: comparación de código

Referencia: [juliochemoreno/TizenXuperTV](https://github.com/juliochemoreno/TizenXuperTV), v1.12.4, commit `6aa51f5`, inspeccionado el 9 de noviembre de 2026. Se leyó su código; no se ejecutó la app de terceros.

## Los 21.804 títulos de la captura

Ambas apps conocen las mismas raíces principales del portal: películas 76177, series 76178, infantil 76783 y anime 76180. La referencia obtiene colecciones con `v3/getColumnContents`; consulta una colección con `v3/getShelveData` y muestra `assetListTotalSize`. El catálogo filtrable usa `v3/filterByContent` y `totalSize`, igual que nuestra vista general. Su fila editorial «Netflix: Lo más visto» puede apuntar a la colección Netflix Series o Netflix Movie; no demuestra una fuente externa adicional.

No se encontró un límite local de 10.000 títulos en nuestra paginación VOD. Los totales de distintas rutas pueden diferir, y varias colecciones pueden incluir los mismos títulos. No es correcto sumar sus contadores ni sustituir uno por 21.804 sin consultar el portal. La prueba desde este entorno recibió `portal100024` (restricción regional), por lo que no se verificó el total actual ni la disponibilidad real de cada colección.

Se añadió acceso directo a colecciones y una comparación acotada (primera página, catálogo general y hasta cuatro colecciones, priorizando Netflix):

```js
XuperStandalone.compareCatalogTotals('series').then(function(r){console.log('XT_TOTALS '+JSON.stringify(r,null,2))},console.error)
```

También acepta `movies`. Informa ruta, campo del contador, total declarado y solapamiento de las muestras. No enumera todo el catálogo ni imprime URLs de reproducción, cabeceras o sesiones.

## Portadas

La referencia usa tarjetas verticales con alternativas de imagen. Adaptamos la idea a nuestro DOM sin incorporar su framework: marcos 2:3, imagen completa con `object-fit:contain`, dos líneas de título y alternativas deduplicadas del mismo registro del portal. Se conserva la carga diferida y el caché existente; no se precarga el catálogo completo. Si todas las imágenes fallan, queda una tarjeta identificable por su título.

## Motores de vídeo

La referencia usa AVPlay en Samsung (`VodPlayerFullscreen.tsx` y `public/js/tizen-bridge.js`), aplica `USER_AGENT` y empaqueta otras cabeceras con `CUSTOM_MESSAGE`. Configura búfer VOD de 3 segundos y reanudación de 5 segundos. Su reproducción TS en navegador no equivale a la del TV.

Nuestra selección de motor considera si AVPlay puede representar las cabeceras requeridas. Cuando no puede, usa transporte propio HTTP/DoH y MPEG-TS/MSE o MP4/MSE; HLS dispone de HLS.js. Esto permite conservar autenticación y DNS integrado, pero exige transmultiplexado y más coordinación. Que la referencia configure `CUSTOM_MESSAGE` no prueba que nuestro modelo envíe correctamente `Content-Auth`/licencia con ese mecanismo. No se cambia esa política ni la reproducción en vivo en esta versión.

La referencia contiene un módulo `.idxg` con parser, agrupación de segmentos y recuperación del tamaño del vídeo. En la revisión inspeccionada sus funciones aparecen consumidas en pruebas, no importadas por el reproductor de producción; exponer una URL de índice tampoco demuestra que exista para cada título. Es una idea útil para investigar búsqueda temporal y duración de TS, pero requiere verificar índices reales, tiempos, offsets y renovación de autorización antes de integrarla. No se presenta como una mejora de reproducción ya instalada.

## Validación

Pruebas unitarias de selección segura de imágenes, contadores separados y fin de paginación; Chromium con imágenes fallidas y alternativa válida, filtros, navegación, fichas, vídeo de prueba y escalas 720p/1080p/4K. No sustituyen una prueba de reproducción con el proveedor en Samsung.
