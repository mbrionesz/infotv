# XuperWindows 0.1.7 beta

Corrección del arranque VOD: el control local de VLC y la primera imagen ya no comparten el mismo timeout ni el mensaje erróneo «motor x86». La app recibe la sesión cuando el controlador responde, conserva los comandos y puede renovar una autorización caducada antes de que se decodifique el vídeo.

Si recibe datos sin imagen, reintenta una sola vez con decodificación por software, desde la posición solicitada. Se fijan rutas de plugins/Lua/HTTP del motor incluido y su directorio de trabajo; no utiliza la configuración de otra instalación de VLC. Los fallos de red, HTTP, proceso y decodificación se distinguen. No cambia el resolutor DNS ni desactiva TLS.

La prueba de Windows también verifica los motores en los recursos empaquetados, desde un directorio ajeno a la instalación. Las pruebas no sustituyen una sesión con el portal en el Windows 10 del usuario.

F12 abre/cierra herramientas de desarrollo. Diagnóstico seguro, sin cabeceras, tokens ni URL de medios:

```js
XuperDesktop.mediaDiagnostics().then(function(r){console.log(JSON.stringify(r,null,2))})
```

Favoritos, biblioteca y progreso se conservan. El WGT publicado de Tizen no cambia.

Validación aprobada: https://github.com/mbrionesz/infotv/actions/runs/44124036474 . Fuente de instaladores `v0.1.7-beta.1`. Pasaron 345 pruebas del núcleo, 20 de escritorio, scroll y paginación con touchpad, vídeo HEVC/AAC incrustado x64/x86 y decodificación/controles/EOF con recursos empaquetados desde un directorio ajeno. El proceso x86 se probó bajo WOW64; no se ha reproducido el fallo original en el PC Windows 10 del usuario.
