# XuperWindows 0.1.15 beta y tester libmpv 0.1.15 revisión 1

Corrige la propagación de cancelaciones al reemplazar solicitudes de audio: Electron pierde el nombre original de errores IPC y una cancelación legítima podía aparecer como fallo de reproducción. El adaptador ahora conserva AbortError, cancela inmediatamente solicitudes anteriores al reiniciar el transporte y evita que afecten al reemplazo. Los tiempos de espera reales se identifican por separado.

La interfaz, los motores VLC/libmpv y los perfiles independientes se mantienen. No cambia el archivo original magis.js ni el paquete publicado de Tizen.

Validación: pruebas de cancelación IPC, reinicio con solicitudes pendientes, errores de red y timeout activo; suite Windows y compilación. Los workflows verifican decodificación real, pistas de audio, subtítulos, saltos y recursos empaquetados antes de publicar. La confirmación con el título del usuario requiere prueba en su equipo.
