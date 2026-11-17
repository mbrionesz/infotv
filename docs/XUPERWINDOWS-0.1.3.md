# XuperWindows 0.1.3 beta

La versión de PC pasa a llamarse XuperWindows. El icono original se conserva. El instalador, ejecutable, ventana, encabezado, bienvenida y textos identifican Windows. XuperTizen sigue siendo el nombre de la versión Samsung.

## Corrección HEVC

El error `addSourceBuffer ... hvc1 ... unsupported` es una ausencia del decodificador HEVC en MediaSource/Chromium. Cambiar DNS, servidor o aumentar el búfer no añade ese decodificador.

XuperWindows incluye motores nativos de respaldo: mpv en x64 y VLC oficial de VideoLAN en x86, fijados y verificados por SHA-256. Se usa para VOD HEVC cuando Chromium no admite el códec, o cuando el decodificador del navegador rechaza el formato. H264 y TV que funcionan en el motor actual conservan su camino.

El motor de respaldo abre su propia ventana de vídeo con título XuperWindows. No es un reproductor incrustado en la superficie HTML. Usa aceleración segura cuando está disponible y decodificación por software en caso contrario; no recodifica ni reduce artificialmente resolución/FPS. La fluidez depende de CPU/GPU y del flujo. En x64, el búfer de mpv se limita a 32 MiB hacia delante y 8 MiB hacia atrás; VLC x86 usa su caché de red propia.

- Espacio: pausa; flechas: avance/retroceso; `f`: pantalla completa; cerrar la ventana: regresar a la app (`q` en mpv; `Ctrl+Q` en VLC).
- El reproductor nativo ofrece sus controles de audio/subtítulos. La selección que realiza la app y sus subtítulos externos se envían también al motor.
- El reloj y la duración se transmiten a la app para seguir guardando el progreso. Al terminar vuelve a la app; sus controles HTML no se superponen a la ventana nativa.

## Red y seguridad

mpv recibe una URL de capacidad aleatoria, únicamente de loopback. Un proxy de Node conecta al CDN usando el mismo resolutor DoH que la app, conserva Host/SNI, valida TLS y añade las cabeceras de la sesión. No se entregan credenciales al argumento de proceso. El proxy admite rangos, usa streaming con contrapresión, limita concurrencia y se destruye al detener/cerrar.

El control del proceso se limita a comandos permitidos por IPC local. No se cargan configuraciones ni scripts del usuario, ni se usa shell para lanzarlo. Se incluyen hashes y avisos de los componentes libres; fuentes correspondientes: [recetas](https://github.com/shinchiro/mpv-winbuild-cmake/tree/20261003), [mpv](https://github.com/mpv-player/mpv/tree/3186d369f9), [FFmpeg](https://github.com/FFmpeg/FFmpeg/tree/98e92563a).

## Datos y actualización

Se mantiene el GUID de actualización de los instaladores anteriores. El perfil nuevo se llama XuperWindows. Cierra la versión anterior antes de instalar. En el primer arranque copia la biblioteca del perfil anterior, conservando el original y excluyendo cachés temporales. No sobrescribe un perfil XuperWindows existente.

Los nombres antiguos se conservan únicamente donde son necesarios para migración, avisos de terceros o compatibilidad del protocolo. No se alteran APK, sesiones ni constantes del proveedor para renombrar la interfaz. La versión Samsung publicada no cambia.

## Validación

Pruebas unitarias: códec HEVC, proxy/rangos/cabeceras/DNS, migración sin pérdida y reloj/limpieza del motor. En Windows se ejecuta decodificación real del fixture HEVC/AAC de diez segundos con ambos ejecutables, más una prueba de control nativo a través del proxy (pausa, seek, reanudación y EOF). El fixture es generado con patrones y tono de FFmpeg, sin contenido de terceros.

Estas pruebas no garantizan todas las señales del proveedor. La comprobación de sesiones largas y rendimiento del equipo del usuario sigue siendo necesaria.

Validación completada: GitHub Actions 44002833770. HEVC/AAC real, pausa, seek, reanudación y EOF en ambos motores; reproducción a través del puente real de Electron; ambos instaladores y hashes publicados. Las pruebas x86 se ejecutaron bajo WOW64; no sustituyen una sesión prolongada en Windows 10 de 32 bits físico.

TMDB retirado de Windows por petición del usuario: sin configuración de clave, panel, cliente API ni enriquecimiento de imágenes. Se borra la clave heredada del perfil y se muestran imágenes del portal. La compilación Windows no recibe la configuración TMDB de Tizen.

Windows x86 incluye VLC 3.0.24 oficial de VideoLAN, tras fallar la inicialización del otro binario x86. Se conservan sus licencias dentro del directorio del motor. Fuente correspondiente y recetas contrib: https://download.videolan.org/pub/videolan/vlc/3.0.24/vlc-3.0.24.tar.xz . Windows x64 usa mpv. Ambos se conectan mediante el proxy con DNS seguro.
