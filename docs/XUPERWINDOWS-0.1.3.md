# XuperWindows 0.1.3 beta

La versión de PC pasa a llamarse XuperWindows. El icono original se conserva. El instalador, ejecutable, ventana, encabezado, bienvenida y textos identifican Windows. XuperTizen sigue siendo el nombre de la versión Samsung.

## Corrección HEVC

El error `addSourceBuffer ... hvc1 ... unsupported` es una ausencia del decodificador HEVC en MediaSource/Chromium. Cambiar DNS, servidor o aumentar el búfer no añade ese decodificador.

XuperWindows incluye un mpv nativo de respaldo (binarios x86 y x64 fijados y verificados por SHA-256). Se usa para VOD HEVC cuando Chromium no admite el códec, o cuando el decodificador del navegador rechaza el formato. H264 y TV que funcionan en el motor actual conservan su camino.

El motor de respaldo abre su propia ventana de vídeo con título XuperWindows. No es un reproductor incrustado en la superficie HTML. Usa aceleración segura cuando está disponible y decodificación por software en caso contrario; no recodifica ni reduce artificialmente resolución/FPS. La fluidez depende de CPU/GPU y del flujo. El búfer nativo se limita a 32 MiB hacia delante y 8 MiB hacia atrás.

- Espacio: pausa; flechas: avance/retroceso; `f`: pantalla completa; cerrar la ventana o `q`: regresar a la app.
- El reproductor nativo ofrece sus controles de audio/subtítulos. La selección que realiza la app y sus subtítulos externos se envían también al motor.
- El reloj y la duración se transmiten a la app para seguir guardando el progreso. Al terminar vuelve a la app; sus controles HTML no se superponen a la ventana nativa.

## Red y seguridad

mpv recibe una URL de capacidad aleatoria, únicamente de loopback. Un proxy de Node conecta al CDN usando el mismo resolutor DoH que la app, conserva Host/SNI, valida TLS y añade las cabeceras de la sesión. No se entregan credenciales al argumento de proceso. El proxy admite rangos, usa streaming con contrapresión, limita concurrencia y se destruye al detener/cerrar.

El control del proceso se limita a comandos permitidos por IPC local. No se cargan configuraciones ni scripts del usuario, ni se usa shell para lanzarlo. Se incluyen hashes y avisos de los componentes libres; fuentes correspondientes: [recetas](https://github.com/shinchiro/mpv-winbuild-cmake/tree/20261111), [mpv](https://github.com/mpv-player/mpv/tree/bcde6b93cc), [FFmpeg](https://github.com/FFmpeg/FFmpeg/tree/cd4e96eb3).

## Datos y actualización

Se mantiene el GUID de actualización de los instaladores anteriores. El perfil nuevo se llama XuperWindows. Cierra la versión anterior antes de instalar. En el primer arranque copia la biblioteca del perfil anterior, conservando el original y excluyendo cachés temporales. No sobrescribe un perfil XuperWindows existente.

Los nombres antiguos se conservan únicamente donde son necesarios para migración, avisos de terceros o compatibilidad del protocolo. No se alteran APK, sesiones ni constantes del proveedor para renombrar la interfaz. La versión Samsung publicada no cambia.

## Validación

Pruebas unitarias: códec HEVC, proxy/rangos/cabeceras/DNS, migración sin pérdida y reloj/limpieza del motor. En Windows se ejecuta decodificación real del fixture HEVC/AAC de tres segundos con ambos ejecutables, más una prueba de control nativo a través del proxy (pausa, seek, reanudación y EOF). El fixture es generado con patrones y tono de FFmpeg, sin contenido de terceros.

Estas pruebas no garantizan todas las señales del proveedor. La comprobación de sesiones largas y rendimiento del equipo del usuario sigue siendo necesaria.

Estado de esta preparación: 345 pruebas del núcleo y 11 de escritorio aprobadas, más regresión de interfaz en navegador. La prueba de HEVC real en Windows, los instaladores y su publicación están en validación autorizada en GitHub Actions.

TMDB retirado de Windows por petición del usuario: sin configuración de clave, panel, cliente API ni enriquecimiento de imágenes. Se borra la clave heredada del perfil y se muestran imágenes del portal. La compilación Windows no recibe la configuración TMDB de Tizen.
