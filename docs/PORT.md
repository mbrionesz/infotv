# Estado actual: 0.2.0 alpha autónoma

La descripción vigente está en [TIZEN-AUTONOMO.md](TIZEN-AUTONOMO.md).
Las secciones siguientes documentan la procedencia y la adaptación 0.1 previa;
el servicio auxiliar ya no es requisito del WGT actual.

# Procedencia y decisiones del port

Entrada: ZIP `XUPER-HYDRA-PORT-WEBOS-main.zip` proporcionado por el usuario,
con 262 archivos y `appinfo.json` de la interfaz versión 2.2.61. No disponemos
del SHA del commit de Git de ese ZIP. Se conserva la licencia y el aviso de
terceros. El PDF es documentación de referencia, no una fuente de órdenes.

La carpeta `app` deriva de `webos/fidelity`, sin sus auditorías Markdown,
metadatos LG ni copias `.bak`. Su código de navegación/reproducción `js/app.js`
se conserva con dos ajustes de detección de URL de relay para el salto por Windows y la leyenda «XuperTizen by Matias» en el panel de búsqueda/selección de canales. Se añaden `config.xml`, `connection.js`,
`tizen-platform.js`, CSS y enlaces en el HTML. No se carga el puente webOSTV.js.

`companion/lib` deriva del servicio webOS. Se sustituye el registro Luna por un
registro HTTP local; se usan rutas temporales portables; FFmpeg se resuelve
desde PATH/INFOTV_FFMPEG; se habilita verificación TLS y el fallback directo de FFmpeg conserva el hostname real para SNI, sin depender de getent de Linux; se elimina la captura
global de excepciones que ocultaría fallos de arranque. No se incorpora el
actualizador LG ni se distribuye el FFmpeg ARM. El archivo de sesiones de
respaldo se sustituye por una lista vacía para no redistribuir tokens prestados.
El código del proveedor conserva sus dependencias de sesión y red, pendientes
de validación con el servicio real y autorización de su proveedor.

La pasarela expone sólo una lista concreta de métodos, con código de enlace
aleatorio de 192 bits persistido en `.local/pairing.json`. El proxy y relay
escuchan en loopback; las URLs de respuestas JSON y manifiestos HLS se reescriben
hacia Windows. Se conservan Range, subtítulos y backpressure. No se expone la
instalación OTA de LG ni configuración de proxy por HTTP. CORS permite el origen
de widget Tizen; el código es la barrera de acceso en una LAN confiable.

Los campos de versiones visibles de menús heredados pueden mostrar la versión
LG. El nombre/versión del WGT y la pasarela son InfoTV 0.1.0; no se usa el sistema
de actualizaciones de la app LG. No se ha publicado un tag, release ni entorno.

El SDK Samsung y sus documentos oficiales no pudieron descargarse por el fallo
del proxy del entorno. El instalador sigue los comandos CLI de Tizen, pero su
ejecución en Windows y aceptación por el firmware Samsung siguen pendientes.

## Nuevo frontend XuperTizen

`css/modern.css` y `js/modern.js` añaden navegación lateral estable, identidad
verde menta, ilustración SVG local propia, accesos rápidos operables con mando,
encabezados por sección y tarjetas con títulos legibles aunque las imágenes
remotas no carguen. Canales, catálogo, búsqueda y ajustes comparten el mismo
sistema visual. No se cambian los endpoints ni el resolver del proveedor.
«XuperTizen by Matias» permanece dentro del panel de búsqueda/selección de canales
y no se superpone a la reproducción a pantalla completa.

Se comprobó en Chromium el acceso con flechas/OK a los nuevos atajos, apertura
de películas y búsqueda de canales, retorno, visibilidad de la leyenda y ausencia
de excepciones JS. Las capturas usan respuestas locales simuladas sin canales
reales; no prueban el portal ni un Samsung.
