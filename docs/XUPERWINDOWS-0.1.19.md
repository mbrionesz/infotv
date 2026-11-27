# XuperWindows 0.1.19 · idiomas y controles durante VOD

Ediciones normal (libVLC, x64/x86) y tester `0.1.19-test-libmpv.1` (x64). Android beta 11 y los binarios Tizen 0.10.21 permanecen en sus versiones publicadas.

## Cambios

El selector de audio aceptaba el clic antes de recibir la respuesta del motor, reconstruía los botones con el estado anterior y descartaba errores del comando nativo. Ahora presenta «Cambiando…», espera la pista seleccionada por el motor y guarda la preferencia confirmada. Un sondeo iniciado antes del clic no reemplaza la respuesta del cambio. Se conserva el contrato booleano de selección para los demás reproductores.

Los subtítulos se encargan al motor nativo una sola vez: no se vuelve a descargar y analizar la misma pista en HTML. El cambio espera un identificador de pista distinto al anterior, sin aceptar la pista anterior como confirmación. Activación, cambio y desactivación se confirman; se muestran los errores sin reiniciar el video. Al salir se invalidan las respuestas pendientes; una pista desactivada tampoco se pasa al abrir la siguiente reproducción. Los diagnósticos publican idioma/activación, sin exponer la URL de subtítulos.

El recorte de una ventana nativa opaca dejaba una banda blanca aunque la captura del renderer mostrara el HUD correcto. La superficie de video ahora tiene fondo alfa transparente y aplica su región mediante Win32 en píxeles del área cliente; se reaplica al presentar el video y al cambiar la ventana. Así quedan visibles el fondo oscuro y los controles HTML existentes. Utiliza el mismo renderer y conserva el motor de cada edición. El botón «Audio y subtítulos» de Windows abre directamente el selector. Mover el mouse dentro del diálogo no revela el HUD por detrás. Se elimina el envío duplicado de posición de subtítulos en libmpv.

No cambian los objetivos ni presupuestos del búfer. Cambiar una pista mantiene la sesión, la pausa y el minuto.

## Verificación

- 351 pruebas compartidas y 57 de Windows aprobadas localmente.
- Prueba Chromium de la interfaz Windows con bridge simulado: clics reales, confirmación diferida, fallo conservando la selección, subtítulos desactivados y cierre con respuestas pendientes, aprobada. Decodificación/composición se prueban aparte con los motores reales.
- Prueba Chromium con audio MP4/MPEG-TS real y subtítulos: idioma, preferencias, pausa y estilos aprobados.
- Las pruebas Electron usan el flujo VOD compartido, video HEVC sintético de dos minutos y dos pistas AAC, subtítulos locales, movimiento/clic del mouse mediante Win32 y captura de escritorio que incluye los HWND nativos. Se comparan muestras del texto/botones en el escritorio con la captura de referencia del renderer, tolerando la escala y el antialiasing; se comprueba que el HUD no queda blanco, negro vacío ni cubierto por el video y que una sola pulsación confirma audio/subtítulos sin perder posición/pausa. Se repiten con y sin GPU de Chromium.

La selección nativa se comprueba con sus identificadores/flags reales. Los dos audios sintéticos tienen el mismo tono: no es una prueba de contenido hablado ni de altavoces. El entorno virtual de Windows no sustituye la confirmación en el PC Windows 10 y su placa gráfica donde se observó el fallo. No se usa contenido del portal para comprobar la reproducción ni se exportan sesiones; tampoco se certifica cada CDN.

## Evidencia en Windows

Fuente de los instaladores: `5c7181848b95327b95f9ef02665241fed79c9147`.

- [Normal x64/x86: compilación y comprobaciones](https://github.com/mbrionesz/infotv/actions/runs/46074889230).
- [Tester libmpv x64: compilación y comprobaciones](https://github.com/mbrionesz/infotv/actions/runs/46074892012).
- Capturas del escritorio real, incluyendo el HWND del video: [normal, controles](windows-0.1.19/normal-controles.png), [normal, idiomas](windows-0.1.19/normal-idiomas.png), [tester, controles](windows-0.1.19/tester-controles.png), [tester, idiomas](windows-0.1.19/tester-idiomas.png).
- [Reproducción del fallo durante las pruebas, antes de corregir la transparencia](windows-0.1.19/fallo-reproducido.png). La captura del renderer por sí sola mostraba los controles correctamente y no permitía detectar este fallo; por eso se comprueban los píxeles del escritorio con el video activo.

## Publicación verificada

[Descargar Windows normal x64/x86 y tester libmpv x64](https://github.com/mbrionesz/infotv/releases/tag/v0.10.21-beta.8). Las dos ejecuciones terminaron correctamente, incluidos los decodificadores empaquetados. Los tres EXE se descargaron de la publicación y sus SHA-256 coinciden con los comprobantes de CI: [registro de tamaños, fuente y sumas](windows-0.1.19/verificacion-descargas.json). Los enlaces públicos de los dos instaladores x64 responden HTTP 200 sin autenticación.

La publicación contiene once archivos: los tres instaladores actuales, sus dos manifiestos de sumas y dos archivos de fuentes, y los cuatro archivos Tizen 0.10.21 conservados. El WGT descargado mantiene SHA-256 `a9041cc7ba17dffdd34d933f005da81927a23093caffaa26ebc45e418c7c2727`.
