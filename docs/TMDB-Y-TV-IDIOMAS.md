# Carrusel, fechas del portal y pistas de TV

## TMDB opcional

En Ajustes → Reproducción → Imágenes del carrusel · TMDB se configura una clave API v3 o Read Access Token propio. El teclado oculta la entrada y no la guarda en el historial de búsquedas. La clave queda en el almacenamiento local del TV y no se incluye en el WGT ni en GitHub. Puede eliminarse desde el mismo panel. Crédito y logotipo oficial en Acerca de.

Solo el destacado de Películas y Series consulta TMDB; las tarjetas del catálogo no lo hacen. El carrusel tiene tres títulos por sección. Las búsquedas se serializan y se espacian 350 ms; los resultados se guardan 90 días. Un 429 impone una espera mínima de un minuto o el Retry-After indicado, con límite de una hora. Las cifras de TMDB son un límite de velocidad aproximado, no una cuota de 40 consultas totales.

Se exige coincidencia única de título y año. En series con sufijo de temporada se busca el nombre base y se omite el año de temporada para no confundirlo con el estreno de la serie; se sigue exigiendo un resultado único. Solo se sustituye el fondo, nunca el título, los episodios o las fuentes de reproducción. Al fallar se conserva la imagen del portal. Las pruebas de red TMDB usan respuestas propias de prueba; no acreditan una cuenta ni disponibilidad real de todas las imágenes.

Logotipo descargado sin modificar desde la [página oficial de atribución](https://www.themoviedb.org/about/logos-attribution). [FAQ](https://developer.themoviedb.org/docs/faq), [límites](https://developer.themoviedb.org/docs/rate-limiting), [condiciones](https://www.themoviedb.org/api-terms-of-use).

## Fechas y semillas

El mapeo conserva los campos de fecha presentes: releaseTime, releaseDate, createTime, createdAt, updateTime, updatedAt, publishTime y onlineTime. Se muestran estrenos por releaseDate o selecciones de Novedades anunciadas por el proveedor. No se afirma que una fecha de modificación sea fecha de incorporación.

Con Películas o Series abierto, Apps2Samsung Debug:

```js
console.log(JSON.stringify(XuperStandalone.auditCarouselDates(),null,2))
```

El comando inspecciona las selecciones ya cargadas y muestra las fechas sin credenciales. Hace falta observar la respuesta real del TV para confirmar qué campos entrega actualmente ese catálogo. No se suman ni inventan fechas ausentes.

El catálogo y la sesión propia siguen actualizándose desde el portal. La descarga de sesiones compartidas (semillas de LG) permanece desactivada; es independiente de las actualizaciones del catálogo y del DNS.

## TV en vivo

Menú o flecha Abajo abre Audio y subtítulos durante reproducción. Español latino es prioritario, luego otro español anunciado. Si no existe, se conserva el audio disponible y se permiten alternativas realmente anunciadas. Los subtítulos empiezan apagados; se pueden habilitar cuando la señal expone pistas compatibles. No se traducen contenidos ni se eliminan subtítulos incrustados en la imagen.

Las elecciones manuales se guardan por canal (hasta 100), por idioma y etiqueta, para tolerar cambios de orden. TV usa HLS.js, AVPlay o pistas de texto nativas según el motor; no todas las fuentes o firmwares permiten las mismas pistas. En películas/series se conserva su política de subtítulos y preferencias independiente.

La barra de título/duración se oculta después de cinco segundos sin acción del control. El diálogo de selección permanece abierto hasta Listo o Volver.
