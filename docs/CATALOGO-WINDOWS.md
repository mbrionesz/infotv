# Consultar los contadores desde Windows

El portal requiere sesión y cuerpos cifrados. Un `curl` anónimo a una URL no devuelve el catálogo. La referencia Samsung usa las mismas rutas principales:

- `v3/getColumnContents`: colecciones disponibles.
- `v3/getShelveData`: títulos de una colección; contador `assetListTotalSize`.
- `v3/filterByContent`: catálogo general o filtros; contador `totalSize`.

La etiqueta «Netflix: Lo más visto» de la referencia corresponde a una colección, no a una fuente adicional comprobada. No se deben sumar colecciones solapadas. El número declarado tampoco prueba que todas las páginas o títulos sean accesibles.

## Desde Apps2Samsung

Con XuperTizen 0.9.3 o posterior abierto en Debug:

```js
XuperStandalone.compareCatalogTotals('series').then(function(r){console.log(JSON.stringify(r,null,2))},console.error)
```

Cambia `series` por `movies` para películas. Compara el total general con hasta cuatro colecciones, priorizando Netflix. La muestra de cada ruta sirve para detectar solapamientos; no es un recuento exhaustivo de títulos únicos. En la app, Películas/Series → Catálogo completo permite recorrer las páginas del portal; Colecciones permite consultar cada categoría.

## Desde PowerShell con Node.js 22+

Mantén abierto el Debug de Apps2Samsung y la app en tu TV. El inspector de este ejemplo está en `127.0.0.1:9222`.

```powershell
curl.exe --fail http://127.0.0.1:9222/json/list
curl.exe --fail -L https://raw.githubusercontent.com/mbrionesz/infotv/main/tools/tv-catalog-totals.mjs -o tv-catalog-totals.mjs
node .\tv-catalog-totals.mjs --root series
node .\tv-catalog-totals.mjs --root movies
```

El primer `curl` solo comprueba que el inspector local esté disponible; los comandos Node consultan los números mediante la sesión que ya utiliza el TV. No cambian las preferencias ni resuelven vídeos. Si Apps2Samsung usa otro puerto, añade `--port PUERTO` al comando Node. La app debe seguir abierta mientras se consulta. Para guardar el resultado, añade `| Out-File -Encoding utf8 series.json`.

El script solo admite un inspector local y no imprime sesiones ni cabeceras. No publiques la salida completa de otras herramientas del inspector: podría contener datos del dispositivo. Los errores de región o conexión del portal no se convierten en un contador cero.
