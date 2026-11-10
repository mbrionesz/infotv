# Comparativa del portal y de la app Samsung

Fecha: 10 de noviembre de 2026. Nuestra base: 0.10.12 beta, con correcciones locales descritas al final. Referencia: [juliochemoreno/TizenXuperTV](https://github.com/juliochemoreno/TizenXuperTV), package 1.12.7, commit `9518b12e05acc1db88af544b0ee25650f84c58e1`. Se descargó su código sin ejecutar sus scripts. Se revisaron `public/js/magis-client.js`, `src/views/VodPlayerFullscreen.tsx` y el puente nativo. No se afirma haber probado su app en un televisor.

## Qué se pudo confirmar

- 22 rutas distintas identificadas en su cliente, 22 registradas en el nuestro: conjuntos iguales. La extracción incluye llamadas literales y las rutas dinámicas de las alternativas de TV. El JSON adjunto permite repetir y revisar el inventario.
- Esto NO significa que el portal tenga solo 22 rutas. No hay un índice público completo ni una respuesta de descubrimiento de todas sus APIs. No se probaron nombres o versiones inventados.
- La consulta actual con sesión invitada propia volvió a fallar en `v8/active` con `portal100024` (región bloqueada). El resto de las rutas no se pudo validar con esa sesión. Tener una función implementada no prueba que la cuenta/región la tenga habilitada.
- El rechazo anterior `portal100023` de `getHome` se mantiene como evidencia histórica del TV; no demuestra que esa ruta falle en todas las sesiones. Nuestra llamada actual y la referencia envían `homePageCode:'home'`.
- Las listas de categorías, países y plataformas no son rutas nuevas: son identificadores y parámetros de las mismas APIs. Los contadores de colecciones pueden solaparse.

## Inventario completo de rutas observadas

Todas aparecen en ambos códigos. Estado actual del proveedor desde este entorno: sesión rechazada; las demás no verificadas en vivo.

| Ruta | Función | Uso nuestro |
|---|---|---|
| `v3/snToken` | Token del dispositivo | Arranque de sesión |
| `v8/active` | Activación | Arranque; rechazada por región |
| `getNextColumns` | Recomendaciones/árbol editorial | Descubrimiento y alternativa de catálogo |
| `v3/getColumnContents` | Categorías y colecciones | Catálogo |
| `v3/getShelveData` | Títulos por colección o estantería | Catálogo, paginación |
| `v3/filterByContent` | Catálogo filtrado | Género, año, país según IDs anunciados |
| `v3/filterGenre` | Opciones de filtro | Búsqueda y categorías |
| `v3/searchByName` | Búsqueda por nombre | Búsqueda; combinaciones no soportadas remotamente se aplican sobre la página recibida |
| `v4/getItemData` | Ficha y episodios | Fichas, temporadas |
| `v10/startPlayVOD` | Versiones, idioma, licencia, subtítulos | Metadatos y apertura VOD |
| `v15/getSlbInfo` | Distribución CDN | VOD y datos de distribución |
| `v14/getSlbInfo` | Alternativa de distribución | Respaldo |
| `v6/getLiveData` | Canales | Ruta principal nuestra |
| `v7/getLiveData` | Canales | Alternativa; la referencia la intenta primero |
| `v4/startPlayLive` | Apertura de canal | Principal nuestra, con variantes de parámetros |
| `v5/startPlayLive` | Apertura de canal | Alternativa; la referencia la intenta primero |
| `getHome` | Portada del proveedor | API disponible; no dirige el nuevo hub de categorías |
| `getShortVideo` | Cortos | API bajo demanda, sin sección propia |
| `getPerson` | Reparto/personas | Ficha/Reparto |
| `getItemByPerson` | Títulos de una persona | Catálogo por persona |
| `getAllbackProgram` | Programas anteriores | API bajo demanda; no guía de recuperación completa |
| `v6/startPlayBTV` | Abrir programa anterior | API bajo demanda; disponibilidad no verificada |

No se cambia el orden de las rutas de TV que ya funcionan en el televisor del usuario solo para igualar el orden de la otra app.

## Comparativa de funciones públicas

Nuestro módulo exporta 27 funciones y el cliente de referencia 23 (no se cuentan sus objetos `hosts`/`rootIds` ni nuestros objetos de constantes/sesión). Es un recuento de envoltorios de programación, no de capacidades ni endpoints. `call` puede invocar una ruta sin que exista una pantalla para ella.

| Referencia | Nuestra equivalencia | Evaluación |
|---|---|---|
| `ensureSession` | `ensureSession` | Sesión propia, ambas |
| `call` | `call`, `post` | Protocolo; más funciones no equivalen a más rutas |
| `home` | `home` | Portada/catálogos iniciales |
| `columns` | `catalogColumns` | Árbol de colecciones |
| `columnPage` | `catalogBrowse` | Página de colección |
| `browse` | `catalogBrowse` | Catálogo filtrado |
| `browseFilters` | `catalogFilters` | Filtros del portal |
| `search` | `search`, `catalogSearchPage` | Búsqueda y paginación |
| `detail` | `detail` | Ficha; diferencia de recuperación corregida abajo |
| `mediaInfo` | `mediaInfo` | Información de reproducción |
| `mediaOptions` | `mediaInfo` + `titleBadges` en interfaz | Tenemos pistas y subtítulos; no un método público con ese nombre. Su método combina además calidades declaradas en la ficha, que no prueban una versión reproducible |
| `resolve` | `resolve` | Archivo/licencia/CDN, ambas; selección automática diferente |
| `getLiveCategories` | `getLiveCategories` | TV |
| `getLiveChannels` | `getLiveChannels` | TV |
| `resolveLive` | `resolveLive` | TV |
| `getHome` | `portalHome` | Implementada; no equivale a portada verificada |
| `getShelveData` | `portalShelve` y catálogo por colección | Nuestra API de estantería exige ID anunciado; no enumera IDs arbitrarios |
| `getShortVideo` | `portalShortVideos` | Backend bajo demanda |
| `getPerson` | `portalPersons` | Reparto |
| `getItemByPerson` | `portalPersonItems` | Página por persona |
| `getAllbackProgram` | `portalCatchup` | Backend bajo demanda |
| `startPlayBTV` | `portalResolveCatchup` | Backend bajo demanda |
| `diag` | Diagnóstico de worker/transporte y `probeCdns` | Diferente forma de exponer resultados, no una ruta adicional |

Funciones adicionales propias del módulo: `durationSeconds`, `portalRoutes`, `parseM3u`, `fetchM3u`, `seedStatus`, más el envoltorio `post` y la separación entre búsqueda/página. Las funciones de pistas `trackHeight`, `trackFrameRate`, `trackSummary` son normalizadores locales; no consultas adicionales al servidor.

## Calidad, FPS, audio y subtítulos

| Aspecto | Referencia 1.12.7 | Nuestra 0.10.12 / borrador |
|---|---|---|
| Procedencia de versiones | `startPlayVOD → episodeList[0] → totalMovieList[].movieList[]` | Mismo árbol; conservamos también calidad del grupo |
| Calidades de ficha | Agrega `simpleProgramList[].quality` a `item.qualities` | Conservamos calidad de ficha y episodio; las versiones seleccionables salen de `startPlayVOD` |
| Auto | Mayor resolución en el idioma preferido; contempla 4K | Compatibilidad/códec/contenedor primero. 0.10.13 prioriza máxima resolución dentro del idioma preferido, incluida 4K cuando se ofrece |
| Manual | Índice de variante desde el menú de audio | Selector de versión en ficha; borrador elimina el recorte visual a las primeras 12 |
| Audio de otra versión del portal | Menú permite resolver otra variante | Carencia pendiente en el menú durante reproducción: expone pistas del archivo abierto; para otra variante se vuelve a la ficha |
| Pistas dentro del archivo | AVPlay o pistas detectadas | AVPlay, HLS y MP4/TS según motor; probadas con señales de audio distintas |
| Español/latino | Normaliza idiomas; usa etiquetas/idioma de cada pista | Prioriza latino cuando hay etiqueta explícita. Borrador conserva además `languageName`/`audioName` y alias de idioma |
| Subtítulos externos | Primer archivo de cada entrada, hasta 30 | Igual límite; conservamos nombre y marca `forced` explícita |
| Varios archivos por entrada de subtítulo | Solo `file[0]` | Igual limitación pendiente; no se sabe si los restantes son formatos alternativos o pistas distintas sin una muestra real |
| Distinguir latino de España | Requiere metadatos | Igual: `es` sin más información no permite saber el acento |
| FPS | No se encontró endpoint de FPS separado | Normaliza `frameRate`, `fps`, `videoFps`, incluidos fraccionales, y usa medición cuando el TV la ofrece |
| Resolución real | Motor de reproducción | Dimensiones observadas y proporción del fotograma; prioridad sobre calidad declarada |
| HDR/5.1/intros | Sin ruta independiente confirmada en este cliente | No se inventan etiquetas ni puntos de intro/créditos |
| Motor Samsung | AVPlay, puente de cabeceras; fallback web | AVPlay cuando puede representar autenticación; transporte nativo/DoH y MSE para cabeceras y TS/MP4. No se sustituye a ciegas |
| Índice `.idxg` | La resolución publica URL de índice | Nuestra recuperación TS usa índice local observado; no se añade un índice remoto sin validar archivo y autorizaciones |

Mostrar `1080p` en la ficha no garantiza que se esté reproduciendo 1080p. La comprobación fiable combina versión resuelta y dimensiones observadas durante reproducción. Más CDN no crean un doblaje ni una resolución ausente de `startPlayVOD`.

## Fallos encontrados y cambios locales

1. **Auto podía quedarse en 720p por orden de respuesta entre versiones de igual compatibilidad.** En 0.10.13 se ordena por resolución antes de compatibilidad; el idioma elegido se conserva y una preferencia explícita de español latino se respeta. Las penalizaciones de compatibilidad solo desempatan variantes de igual resolución. Conserva todas las versiones. No convierte fuentes 720p en 1080p.
2. **Metadatos de idioma incompletos.** Se aceptan `language`, `audioLanguage`, `languageName` si falta `audioInfo`, y se preserva el nombre de idioma para selección y presentación. No se deduce latino a partir de `es` solo.
3. **Solo se podían elegir las primeras 12 versiones desde la ficha.** Se elimina ese recorte; permanecen dentro de la navegación y desplazamiento de ficha.
4. **Ficha vacía en errores del portal.** La función devolvía éxito con una ficha parcial/inventada ante códigos de error, ocultando el fallo. Ahora `portal100006` prueba una vez el tipo alternativo documentado `1`; los errores regionales y demás errores del portal se propagan, sin aparentar éxito ni borrar la causa.

Correcciones incluidas en la preparación de 0.10.13 beta. No se modifica TV en vivo, hosts ni DNS en este borrador.

## Qué sigue pendiente y cómo comprobarlo

- Integrar las variantes del portal en el menú de audio durante reproducción, con recuperación temporal segura al cambiar de archivo. No copiar el cambio directo sin validar seek/índice TS, preferencias y autorizaciones.
- Auditar un mismo episodio/película en ambas apps y comparar todas las versiones recibidas. Los listados por sí solos no prueban calidades disponibles actualmente.
- Confirmar el significado de múltiples archivos en `subtitleList[].file` antes de presentarlos como idiomas adicionales.
- Cortos/BTV están implementados como APIs, sin una experiencia completa de pantalla. `getHome` y esas rutas siguen pendientes de validación real.
- `v3/getRecommends` se vio en la referencia LG XuperMH 2.32.0, no en este cliente Samsung. Se mantiene como candidato no validado; no se suma como ruta funcional ni se conecta a la portada sin respuesta comprobable.

En el TV, mientras se reproduce el título a comparar, el comando existente devuelve metadatos normalizados sin URLs firmadas, licencias ni cabeceras:

```js
XuperStandalone.auditVodMetadata().then(function(r){console.log(JSON.stringify(r,null,2))},console.error)
```

Para las 22 rutas implementadas (inventario, no prueba de disponibilidad):

```js
XuperStandalone.portal('portalRoutes').then(function(r){console.log(JSON.stringify(r,null,2))},console.error)
```

## Evidencia reproducible

- `node tools/compare-portal-reference.mjs /ruta/magis-client.js reporte.json`: inspección estática; no ejecuta código externo ni consulta el portal.
- [Inventario JSON](COMPARATIVA-PORTAL-2026-11-10.json), incluye SHA256 del archivo de referencia.
- Pruebas unitarias con respuestas sintéticas: calidad/idioma, metadatos, tipo alternativo de ficha y propagación de errores.
- Prueba de audio/subtítulos con archivos MP4/TS locales y audios distintos, preferencias persistidas y cambio de pistas. Esta evidencia no sustituye la reproducción de títulos reales del proveedor en Samsung.

### Resultado de las comprobaciones del borrador

- Build aprobado, destino Chrome 56/Tizen 4.
- 289 pruebas unitarias aprobadas, 0 fallos.
- `test:audio`: audio real MP4/MPEG-TS de varias frecuencias, selección de español latino, cambio a portugués, subtítulos y preferencias tras reinicio aprobados.
- `test:vod-recovery`: transición de capítulos, autorización caducada, historial y salida ante fallos aprobados con proveedor simulado.
- `node tools/vod-variants-browser.mjs`: 15 versiones más Auto, etiqueta latino y selección exacta de la última variante (índice 14) aprobadas. No es una prueba de disponibilidad de esas 15 versiones en un título real.
- Respuesta real actual: activación `portal100024`; no se confirmó catálogo ni pistas reales desde el entorno.
