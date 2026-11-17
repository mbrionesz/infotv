# XuperWindows 0.1.13 beta

Se elimina el panel de idiomas/subtítulos de TV en vivo en Windows. Su manejador interceptaba ↓ para abrir el panel y, una vez abierto, consumía ↑/↓. Ahora devuelve esas teclas al cambio de canal de la app. Se mantiene la selección automática de español latino y subtítulos desactivados por canal. Tizen conserva el panel y los menús VOD mantienen audio/subtítulos.

La prueba nativa VOD solicita el segundo 5 de la fuente de 10 segundos, espera que el reloj alcance esa posición y verifica que conserve la pausa antes de continuar hasta EOF. El salto en fuentes reales sigue dependiendo de duración/índice y rangos del servidor. La caché no cambia: preparación 2 s y límite de lectura anticipada 32 MiB x64 / 16 MiB x86.

Publicación conjunta limpia con el mismo WGT Tizen 0.10.21.
