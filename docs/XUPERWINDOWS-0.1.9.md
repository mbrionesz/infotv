# XuperWindows 0.1.9 beta

El diagnóstico 0.1.8 confirmó que la tubería privada responde, pero `open` no termina antes de la primera petición de vídeo. La preparación nativa se ejecuta ahora en un hilo de trabajo y `open` confirma la solicitud sin esperar a la inicialización. Las consultas de estado durante esa preparación no llaman a APIs de vídeo/audio todavía inexistentes.

El informe registra la última fase nativa, su tiempo y la versión de libVLC. Si la creación del reproductor/salida se bloquea, un watchdog independiente de los comandos pendientes reintenta una sola vez con decodificación por software y salida DirectSound/WaveOut. No confunde una espera de DNS/red con un bloqueo nativo. La opción de software se aplica al medio, porque `libvlc_media_player_set_hwnd` restablece las variables de salida/herencia del reproductor.

Se mantiene Copiar diagnóstico, el control privado y el proxy con DNS seguro/Host/SNI/TLS. El proxy informa por separado peticiones locales y respuestas del servidor. La inicialización en frío tiene un límite específico, separado de los tiempos de descarga.

Las pruebas de la interfaz Windows usan la selección normal de audio; las pruebas aisladas de decodificación conservan una salida simulada para verificar AAC en el servidor sin altavoces. No se ha comprobado la salida física del PC del usuario. El WGT Tizen publicado permanece sin cambios.

Validación completada: 345 pruebas generales y 24 de escritorio; compilación x64/x86, HEVC/AAC, vídeo incrustado visible, pausa/avance/EOF, portapapeles y recursos del motor empaquetado. [Ejecución Windows](https://github.com/mbrionesz/infotv/actions/runs/44140647544), fuente inmutable `v0.1.9-beta.1`. SHA256 de instaladores descargados coincidente con los artefactos publicados:

- x64: `4e6dba32acbb440aafcb94b4dff234c1f249888af7e23cccff06d080e3b6f9f3`
- x86: `f739d5b2fde061c4f6f47a90925e92172d6f233abf784f8a8611dfe4623878bf`
