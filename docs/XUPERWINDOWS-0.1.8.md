# XuperWindows 0.1.8 beta

El control del reproductor ya no utiliza la interfaz Lua/HTTP de VLC. Un controlador propio, `XuperMediaHost.exe`, enlaza dinámicamente el libVLC oficial incluido y recibe comandos JSON por las tuberías privadas heredadas del proceso padre. No abre puertos de control ni muestra una interfaz externa. El vídeo se incrusta mediante HWND; el proxy de vídeo local conserva DNS seguro, Host/SNI y TLS validado.

El controlador se compila para x64 y x86 con .NET Framework del sistema (incluido en Windows 10/11). Su fuente `desktop/media-host.cs` se incluye en el repositorio. Una caída del decodificador permanece aislada del proceso de interfaz. Se mantiene el respaldo por software y la renovación de autorizaciones durante el arranque.

El aviso de recuperación incorpora **Copiar diagnóstico**, sin requerir consola ni permitir pegado en DevTools. Solo copia datos de versión, sistema y estado técnico; no cabeceras ni URL de medios. Las imágenes externas de Windows usan el transporte nativo con DNS y caché, sin desactivar CORS ni `webSecurity`.

Favoritos y progreso se conservan. El WGT Tizen publicado no cambia. La disponibilidad de señales y la compatibilidad del PC del usuario requieren su comprobación; no se garantiza ausencia de cortes.
