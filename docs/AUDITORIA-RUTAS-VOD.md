# Auditoría de rutas y metadatos VOD

Fecha: 2026-11-10. Base local: XuperTizen 0.10.8 y código extraído de XuperMH v2.32.0, cuya procedencia está documentada en ANALISIS-XUPERMH-2.32.0.md. Revisión estática, sin consultar la sesión del televisor ni afirmar disponibilidad actual del proveedor. La revisión inicial fue estática; la versión 0.10.9 aplica las correcciones de metadatos descritas abajo.

## Resultado

Las llamadas literales `call()` de la copia comparada identifican una ruta ausente de nuestro registro: **v3/getRecommends**. Se usa para recomendaciones y banners; no aporta una ruta independiente para FPS, resolución o bitrate. La comparación cubre esta versión concreta, no un inventario privado completo del proveedor ni futuras versiones.

## Flujo de reproducción

1. `v3/snToken` y `v8/active`: establecimiento de sesión.
2. `v4/getItemData`: ficha, temporadas y episodios.
3. `v10/startPlayVOD`: versiones/pistas y autorización de reproducción.
4. `v15/getSlbInfo`, con alternativa `v14/getSlbInfo`: descubrimiento de CDN VOD utilizables.
5. Petición al CDN `/vod/{contentId}_media.ts` o `.mp4`, con las cabeceras de autorización de la sesión. Esta ruta de archivo no es otro endpoint de metadatos.

`startPlayVOD` envía `contentId`, `seriesContentId`, `startTime:0`, `type:"1"`, `columnId:0`, `authType:""`, además de los campos comunes de sesión añadidos por `call`. La otra app comparada utiliza el mismo endpoint y el mismo conjunto de parámetros. No hay evidencia para sustituir su versión ni probar versiones numéricas inventadas. El cero de startTime no demuestra que el portal soporte recuperación remota del minutaje; nuestra recuperación necesita la lógica local y las capacidades del transporte.

## Campos consumidos de startPlayVOD

| Nivel | Campos | Uso |
|---|---|---|
| Respuesta | name, duration, episodeList | Nombre, duración, episodio |
| Episodio | duration, totalMovieList, subtitleList | Versiones y subtítulos |
| Grupo | movieList; quality en la otra app | Agrupar versiones/calidad |
| Pista | contentId, licenseList[].license | Resolver archivo autorizado |
| Pista | audioInfo, encodeFormat, videoFormat, quality | Idioma, códec, contenedor, calidad |
| Pista | videoHeight / height / pixelHeight; resolution / videoResolution | Altura declarada |
| Pista | videoBitrate / videoBitRate / bitrate / bitRate / rate | Bitrate declarado; unidades inferidas |
| Pista | frameRate / fps / videoFps | FPS declarados |
| Pista | duration | Duración declarada |
| Subtítulo | language, file[].url, file[].fileType | Idioma, recurso y formato |

Son campos admitidos por los parsers, no una garantía de que el proveedor los devuelva. El código actualmente elige `episodeList[0]` y el primer archivo de cada subtítulo; falta una muestra saneada para determinar si hay respuestas con varios episodios o archivos relevantes que se estén descartando. No deben volcarse licencias, tokens, cabeceras o URLs firmadas al diagnóstico público.

## Diferencias reales respecto de XuperMH

- XuperMH copia `totalMovieList[].quality` a `groupQuality` de las pistas cuando falta. Nosotros no conservamos ese dato. Puede perderse una etiqueta 1080p/720p aunque la versión exista.
- Su parser reconoce sufijos p/i en 480/720/1080/1440/2160. Nuestro uso de límites de palabra puede devolver altura cero para `720p`, aunque quality conserve el texto.
- Ambos usan una extracción numérica simple para FPS: `24000/1001` no se interpreta como 23.976. Es una limitación compartida, no una mejora disponible al copiar sin revisión.
- `xTier` y `xQScore` son clasificación local según preferencia de calidad/HEVC/UHD. No descubren rutas ni crean nuevas calidades.
- Nuestro resumen conserva audio por pista; nuestra resolución ofrece alternativas de CDN y renovación forzada. La otra copia resuelve un único destino en esta función. Copiarla íntegra perdería funciones actuales.
- `mediaInfo` y `resolve` comparten una caché de reproducción de 60 s en nuestra app. Su equivalente comparado vuelve a solicitar loadPlay. Debe distinguirse la vigencia de una autorización de los metadatos estáticos.

## Inventario actual: 22 rutas registradas

| Grupo | Rutas |
|---|---|
| Sesión | v3/snToken; v8/active |
| Catálogo y filtros | getNextColumns; v3/getColumnContents; v3/getShelveData; v3/filterByContent; v3/filterGenre; v3/searchByName |
| Ficha y reproducción VOD | v4/getItemData; v10/startPlayVOD; v15/getSlbInfo; v14/getSlbInfo |
| Portada y personas | getHome; getShortVideo; getPerson; getItemByPerson |
| TV y recuperación | v6/getLiveData; v7/getLiveData; v4/startPlayLive; v5/startPlayLive; getAllbackProgram; v6/startPlayBTV |

El registro declara `implemented-not-provider-verified`: estar listado no prueba funcionamiento. `getHome` ya devolvió portal100023 en logs del usuario; no debe presentarse como verificado. Las rutas de personas, cortos o recuperación tampoco se convierten por ello en rutas de calidad VOD.

## Ruta que falta evaluar: v3/getRecommends

En la otra app: parámetros `portalCode:"masnew"`, `recommendCodeArr:["masnew_featured01", ..., "masnew_featured05"]`. Procesa `recommendList[].contentList[]`, usa imágenes banner y alterna contenidos de los grupos; caché de 10 minutos. Los códigos son los observados en ese código, no códigos universales garantizados. Antes de incorporarla: comprobar respuesta en la sesión actual, normalizar con el modelo de títulos existente, filtrar restricciones, deduplicar, limitar imágenes y mantener el carrusel actual como alternativa. No sustituir los filtros ni el catálogo completo por banners.

## Próximos cambios recomendados

1. Preservar calidad del grupo y corregir interpretación de resolución y FPS fraccionales, con pruebas de respuestas sintéticas y saneadas.
2. Mostrar FPS/bitrate solo cuando existan, indicando si son declarados o medidos. La resolución observada durante reproducción tiene prioridad para describir lo que realmente se ve.
3. Auditar una película y un episodio con `XuperStandalone.auditVodMetadata()`. Este comando muestra datos normalizados y omite secretos; no demuestra todos los campos crudos del proveedor.
4. Validar getRecommends antes de añadir una ruta 23 al registro o conectarla al carrusel. No inventar rutas ni multiplicar startPlayVOD por cada tarjeta del catálogo: es una llamada de reproducción con sesión/autorización, no una búsqueda general.

No se encontró en la versión comparada un endpoint independiente de FPS, bitrate, HDR, canales de audio, intros o calidades adicionales. Su ausencia en esta comparación no demuestra que el proveedor no tenga ninguna otra API.

## Correcciones aplicadas en 0.10.9

Se conserva groupQuality sin mutar la respuesta original, se reconocen sufijos p/i y FPS fraccionales/decimales. Los botones de versión muestran FPS y bitrate por pista; el resumen de varias calidades no atribuye el FPS de una a las demás. La consulta real desde este entorno fue rechazada por v8/active con portal100024 (región bloqueada), así que no se certifica el contenido actual de las respuestas ni se agregó getRecommends sin validar.
