# Rutas del portal

XuperTizen 0.9.5 implementa las 22 rutas encontradas en TizenXuperTV v1.12.4 (`6aa51f5`). Todas utilizan el transporte existente, sesión y DNS integrado. El registro describe código disponible; no certifica que el proveedor habilite cada servicio en una cuenta o región.

| Ruta | Integración |
|---|---|
| `v3/snToken` | Token de dispositivo |
| `v8/active` | Sesión |
| `getNextColumns` | Filas editoriales y categorías |
| `v3/getColumnContents` | Colecciones, incluidas las nuevas que anuncie el portal |
| `v3/getShelveData` | Colecciones por `columnId` y estanterías anunciadas por `shelveId` |
| `v3/filterByContent` | Catálogo filtrado |
| `v3/filterGenre` | Metadatos de filtros |
| `v3/searchByName` | Búsqueda |
| `v4/getItemData` | Ficha, temporadas y episodios |
| `v10/startPlayVOD` | Apertura VOD |
| `v15/getSlbInfo` | Distribución CDN |
| `v14/getSlbInfo` | Respaldo de distribución |
| `v6/getLiveData` | Listado de canales, conserva la ruta habitual |
| `v4/startPlayLive` | Apertura de canal, conserva las variantes habituales |
| `getHome` | Descubrimiento adicional en Películas/Series |
| `getShortVideo` | API de vídeos cortos, bajo demanda |
| `getPerson` | Botón Reparto en fichas del portal |
| `getItemByPerson` | Catálogo paginado de la persona seleccionada |
| `getAllbackProgram` | API de programas anteriores, bajo demanda |
| `v6/startPlayBTV` | API de resolución de programas anteriores, bajo demanda |
| `v7/getLiveData` | Respaldo si falla v6 |
| `v5/startPlayLive` | Respaldo si fallan las variantes v4 |

## Descubrimiento

`getHome` aporta títulos y estanterías a la portada. Se siguen también las estanterías anidadas anunciadas en `shelveList`/`blockBeanList`, con un máximo de 100 bloques procesados. No se consultan identificadores de estantería arbitrarios. Las colecciones por `getColumnContents` conservan su recorrido y filtros actuales. Los bloques y registros marcados restringidos se excluyen de esta ampliación.

Los títulos de `getHome` que no estaban en la selección editorial aparecen en «Más del portal»; las estanterías, en «Selecciones del portal». No se suman contadores de colecciones. Una estantería puede mezclar tipos: el filtro de película/serie se aplica a la página recibida y se indica como filtro local. Una página vacía o repetida detiene la paginación.

La referencia implementa vídeos cortos y recuperación BTV, pero esto no prueba su disponibilidad para cada sesión. En esta versión se exponen sus APIs en el worker; no se añade una nueva pantalla de cortos ni una guía de programas anteriores. No se dispara reproducción para comprobar su existencia durante el arranque.

## Consultas de diagnóstico

En Apps2Samsung, con la versión actual abierta:

```js
XuperStandalone.portal('portalRoutes').then(function(r){console.log(JSON.stringify(r,null,2))},console.error)
```

Para inspeccionar las selecciones anunciadas sin imprimir sesiones ni URLs de reproducción:

```js
XuperStandalone.portal('portalHome',{root:'series'}).then(function(r){console.log(JSON.stringify({titulosMuestra:r.items.length,selecciones:r.shelves.map(function(s){return {id:s.id,nombre:s.name}})},null,2))},console.error)
```

Otros métodos disponibles: `portalShelve` (`root`, `shelveId`, `pageNum`), `portalPersons` (`contentId`), `portalPersonItems` (`personId`, `pageNum`), `portalShortVideos` (`pageNum`), `portalCatchup` (`channelCode`, `columnId`, `pageNum`) y `portalResolveCatchup` (`channelCode`, `contentId`, `columnId`). Este último devuelve una dirección de reproducción: no publiques ese resultado.

## Alcance de la comprobación

La consulta con sesión propia desde este entorno volvió a recibir `portal100024`, restricción regional. No se confirmó un total mayor ni más endpoints reales. Las pruebas usan respuestas controladas del proveedor y Chromium. Las estanterías nuevas se incorporan automáticamente cuando el TV las recibe; una ruta desconocida necesita revisión de su protocolo antes de integrarse. No se enumeran a ciegas rutas o identificadores del servidor.
