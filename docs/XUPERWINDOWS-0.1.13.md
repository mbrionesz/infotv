# XuperWindows 0.1.13 beta

Se elimina el panel de idiomas/subtítulos de TV en vivo en Windows. Su manejador interceptaba ↓ para abrir el panel y, una vez abierto, consumía ↑/↓. Ahora devuelve esas teclas al cambio de canal de la app. Se mantiene la selección automática de español latino y subtítulos desactivados por canal. Tizen conserva el panel y los menús VOD mantienen audio/subtítulos.

La prueba nativa VOD solicita el segundo 5 de la fuente de 10 segundos, espera que el reloj alcance esa posición y verifica que conserve la pausa antes de continuar hasta EOF. El salto en fuentes reales sigue dependiendo de duración/índice y rangos del servidor. La caché no cambia: preparación 2 s y límite de lectura anticipada 32 MiB x64 / 16 MiB x86.

Publicación conjunta limpia con el mismo WGT Tizen 0.10.21.

Validación completada: 346 pruebas generales, 28 de escritorio y prueba nativa de salto al 50 % en x64/x86, pausa, reanudación y EOF, también en motores empaquetados. [Ejecución Windows](https://github.com/mbrionesz/infotv/actions/runs/44180277005), fuente inmutable `v0.1.13-beta.1`.

SHA256 descargados coincidentes con los archivos públicos:

- x64: `6d34f23adaf02cb9c413ad6eaa46e31ab5ceb8e0f7e4203489e99f48ee8d2052`
- x86: `74f9c159fd0c193fd79952725b26e89969d1a953485782fe94b2dc957cbf7e47`

Publicación limpia: https://github.com/mbrionesz/infotv/releases/tag/v0.10.21-beta.4 . Tizen se conserva idéntico; la publicación anterior se retiró después de verificar los archivos. Falta confirmar el cambio de canal en el PC del usuario y el seek en sus fuentes concretas.
