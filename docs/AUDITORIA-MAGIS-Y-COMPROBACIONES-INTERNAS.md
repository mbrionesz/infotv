# Flujo de datos de magis.js

Revisión estática: 16 de noviembre de 2026. No equivale a una validación de todas las rutas contra el proveedor desde Chile.

## Procedencia

| Dato | Origen real | Función de entrada |
|---|---|---|
| Hosts de acceso al portal | Diez direcciones incluidas en el cliente | `hostOrder`, `post` |
| Versiones enviadas | Constantes `APK_VERSION`, `APK_VER_HEADER`, `SPKG_VER` | `deviceDict`, `post`, `slbBean` |
| Sesión | Respuestas de `v3/snToken` y `v8/active` | `ensureSession` |
| Secciones raíz | Códigos y IDs incluidos en el cliente | `ROOT_CODES`, `CATALOG_ROOTS` |
| Subcategorías | `childColumnList` de `v3/getColumnContents` | `catalogColumns` |
| Géneros, años y países | `tags`, `year`, `originalCountry` de `v3/filterGenre` | `catalogFilters` |
| Catálogo | `assetList` y totales de `v3/getShelveData` o `v3/filterByContent` | `catalogBrowse` |
| Búsqueda | `searchItemList` de `v3/searchByName` | `catalogSearchPage` |
| Ficha, capítulos, temporadas | `assetData`, `simpleProgramList`, `sameSeasonSeriesList` de `v4/getItemData` | `detail` |
| Variantes VOD | `episodeList[0].totalMovieList[].movieList[]` de `v10/startPlayVOD` | `loadPlay`, `collectTracks` |
| Subtítulos VOD | `episodeList[0].subtitleList` de esa misma respuesta | `subtitleList` |
| CDN VOD | `cdn_list`, entradas `vod`, direcciones principal/reserva y autorizaciones de `v15/getSlbInfo`, con alternativa v14 | `getSlb`, `vodCdns` |
| Canales y categorías TV | `v6/getLiveData`, alternativa v7 | `getLiveChannels`, `getLiveCategories` |
| Licencia TV | `v4/startPlayLive`, alternativa v5 | `resolveLive` |
| CDN TV | Respuestas SLB v15/v14, seleccionadas por `liveCdnsOf` | `resolveLive` |
| Imágenes del portal | Campos de imagen y listas de pósteres de cada título | `imageOf`, `itemFromAsset` |
| Imágenes enriquecidas | Capa TMDB separada; no provienen de magis.js | Módulos de carrusel |
| Favoritos y progreso | Perfil local; no se deducen del catálogo | Capa de biblioteca de la app |

## Recorrido de una petición

`UI → core-worker → función de catálogo/reproducción → ensureSession → call → post → /api/portalCore/{ruta}`.

`call` añade sesión y huella del cliente; la cola separa inicios de peticiones por 450 ms. `post` cifra el cuerpo, intenta hosts, recibe JSON y comprueba `returnCode`. Si `data` está cifrado, lo descifra y devuelve el contenido. Las funciones posteriores normalizan únicamente los campos que necesitan.

Antes de esta observación, los campos adicionales del sobre de respuesta se perdían al devolver `data`. Un campo genérico `version` tampoco demuestra una versión de software: puede corresponder al contenido o a otro recurso.

## Lo que no debe confundirse

- Los diez hosts estáticos del portal no son diez CDN de vídeo. Los CDN proceden de SLB y pueden cambiar por sesión/respuesta.
- Las 22 rutas de `PORTAL_ROUTES` son las implementadas; no es una enumeración recibida del servidor ni prueba de que todas funcionen en cada región.
- `apkVersion=49902`, cabecera `apkVer=43404` y `spkgVer` son valores enviados por el cliente. Su diferencia no demuestra una actualización del servidor. Se mantienen sin cambios.
- La huella fija contiene características Android, incluida RAM declarada. No mide la memoria del Samsung.
- `trackHeight`, `trackFrameRate`, `trackBitrateKbps` y `trackSummary` son extractores locales, no rutas adicionales. FPS ausentes se representan como desconocidos; no como 60 FPS.
- `collectTracks` ordena primero por altura declarada y después por compatibilidad. La preferencia de audio puede elegir otra variante de ese idioma. No crea una versión 1080p ausente.
- La resolución declarada por el proveedor y las dimensiones observadas del vídeo son evidencias diferentes; una película panorámica puede tener menos líneas por su relación de aspecto.
- Los totales son declarados por la ruta. No prueban títulos únicos ni eliminan un posible límite del proveedor.
- `releaseDate` es estreno; `createTime`, `updateTime` y otras fechas se conservan si llegan. No son intercambiables con incorporación al catálogo.

## Diferencia entre archivo original y widget

El servicio heredado usa módulos de Node. La compilación Samsung sustituye transporte y entorno con adaptadores del navegador y transporte nativo. La descarga heredada de sesiones/semillas prestadas está deshabilitada en `build-standalone.mjs`; su presencia en el archivo original no demuestra que se ejecute en TV. El DNS seguro continúa en la capa de transporte de la app.

Cachés del módulo: árbol 10 minutos, búsqueda 3 minutos, SLB 5 minutos y resolución VOD 1 minuto. Una sesión lista puede reutilizarse hasta seis horas. Estos tiempos no son el búfer audiovisual.

## Observación interna preparada en este borrador

La compilación inserta un observador de solo lectura en las respuestas ya interpretadas de `post`. El archivo original `companion/lib/magis.js` permanece intacto, con SHA-256 `fa910167e612539f54cad7535f96da1dce7abb5b3525b499a1a1edcc8c4cbf77`.

El observador conserva en RAM como máximo 32 rutas: fecha, estado HTTP, código del portal, nombres/tipos de hasta 48 campos por objeto y valores de una lista acotada de campos de versión con su procedencia (sobre o contenido). No conserva cuerpos, valores de sesión, licencias, URLs de reproducción ni cabeceras. No genera peticiones y desaparece al reiniciar el worker. No modifica autenticación, DNS, selección de CDN ni reproducción.

Comando disponible al instalar una compilación con este cambio:

```js
XuperStandalone.portal('portalEvidence').then(function(r){console.log(JSON.stringify(r,null,2))},console.error)
```

Abrir primero películas/series o un título permite observar las rutas utilizadas; ejecutar este comando solo consulta las observaciones en memoria. No necesita reproducir para comprobar autenticación y catálogo. Un resultado vacío significa que ese worker todavía no observó respuestas interpretables; fallos previos a JSON/descifrado no aparecen como éxito.

La comprobación semanal del borrador sigue consultando el catálogo interno, sin consultar repositorios de otros clientes. Este observador permite investigar si hay metadatos de versión en los campos superiores del sobre o contenido. No inspecciona recursivamente objetos anidados ni descubre rutas desconocidas. Aún hace falta evidencia real del televisor para confirmar qué campos devuelve el portal. No se anunciará una nueva versión del servidor a partir de constantes locales o de un cambio de cantidad de títulos.

Incluido en la preparación de Tizen 0.10.20 beta. La observación del proveedor sigue pendiente de una sesión real del televisor.
