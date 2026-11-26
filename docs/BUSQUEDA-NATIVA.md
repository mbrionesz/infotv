# Búsqueda nativa y reproducción Android · revisión de noviembre de 2026

Cambios para Android beta 11 y Windows 0.1.18 (normal/tester). La interfaz sigue compartiendo TV/Películas/Series/lupa; la entrada de texto depende del dispositivo.

| Plataforma | Entrada al seleccionar la lupa |
|---|---|
| Android celular/tablet | Campo Compose enfocado y solicitud del IME del sistema; Buscar lo oculta; el diseño respeta sus insets. |
| Android TV | El campo se edita con el control/IME de TV; no se abre automáticamente al entrar en búsqueda. |
| Windows | Campo HTML de búsqueda nativo con foco: edición, pegado, selección, Unicode/IME, Enter y Esc. |
| Tizen | Teclado visual con navegación por control, conservado. |

Abrir una categoría en Android no solicita foco de texto ni abre el IME. La solicitud de foco de la lupa se consume una vez y espera a que la ventana tenga foco; las respuestas de búsqueda no vuelven a abrir el teclado. En Windows los filtros se conservan, las respuestas de facetas no roban foco y Tab queda dentro del diálogo. Las consultas no se guardan como historial.

Se detectó un fallo real en Electron: el bridge de plataforma ejecutaba el manejador de control durante captura, antes de las escuchas del campo de texto. Por eso las flechas no movían el cursor y Enter se interceptaba. Se exceptúan los controles nativos de Windows antes de ese manejador; la prueba Chromium incluye ahora ese bridge y la de Electron usa clic real y teclado.

## VOD Android

| Política | Equipos sin memoria reducida | Memoria reducida |
|---|---|---|
| Objetivo máximo de VOD | 90 s | 30 s |
| Umbral de reposición VOD | 30 s | 15 s |
| Presupuesto objetivo de datos de vídeo | 32 MiB | 12 MiB |

El ahorro de datos conserva su presupuesto menor. El comienzo sigue con un umbral de 1,5 s y el rebuffer con 3 s; no se espera llenar todo el objetivo para empezar. En vivo conserva su política anterior. Son parámetros de carga, no una medición de reserva alcanzada ni límites de RAM del proceso; dependen del bitrate/red y no certifican fluidez física.

Audio predeterminado es-419; las variantes latinoamericanas identificadas ganan a español genérico y castellano. Subtítulos automáticos: si el audio no es español, se elige español latino/español anunciado; no se activa inglés u otro idioma por ausencia de español. Selecciones manuales prevalecen y TV empieza con subtítulos desactivados. Ajustar respeta la proporción original y muestra el fotograma completo; no analiza bandas negras embebidas ni aumenta el detalle de una fuente de menor resolución. Los saltos por tiempo se habilitan al anunciarlos Media3; el servidor/formato determina si pueden efectuarse y su rapidez.

## Validación

- Android: 46 pruebas unitarias (10 modelo, 36 datos) y 21 instrumentadas (18 funcionales, 1 IME, 1 PiP y 1 capturas), cero fallos/errores/omisiones: https://github.com/mbrionesz/infotv/actions/runs/45764310060 . Fuente validada `295ebdc6f2dc97c529b2a64c7ffb4d75171e7df6`. Cada suite nativa IME/PiP dispone de su emulador; los tests de entrada esperan el foco real de la ventana. La expansión PiP utiliza la acción nativa de accesibilidad del sistema, con comprobación de reproducción y regreso a Activity reanudada. No se invoca la Activity para simular esa transición ni se eliminan aserciones.
- 20 capturas de emulador Android 15/API 35 de celular normal/estrecho, tablet y disposición TV; se verifica visualmente la búsqueda con Gboard. TV se fuerza en un emulador de teléfono, no en un TCL físico. Fixtures locales, sin consulta al portal ni exportación de sesiones.
- APK release/R8 y lint correctos; firma v2/v3 con el mismo certificado de beta 10, alineación 16 KiB y descarga pública verificadas. 4.768.240 bytes; SHA-256 `091719243a9bad67d131607da8c4e021103c05b7b70a71e8b924c9c91beb2bba`. El APK se compiló desde `bc3290c7fa90b63f24e127abd00e93980dc1d4d5`; las fuentes Android de producción no cambiaron hasta la fuente validada. Publicación: https://github.com/mbrionesz/infotv/actions/runs/45765255162 . Descarga: https://github.com/mbrionesz/infotv/releases/tag/v0.1.1-android-beta.11 . Solo se transfieren APK firmado y comprobantes públicos; clave privada local.
- 53 pruebas Node locales de búsqueda/privacidad/desktop, prueba Chromium de entrada nativa con el bridge real de captura y prueba de búsqueda TV con control/filtros a 720p/1080p/4K aprobadas. Fuente Windows `eba22381f999415345420f70adcfe30358586bd1`.
- Windows normal aprobado: https://github.com/mbrionesz/infotv/actions/runs/45763837214 . HEVC nativo, presentación visible x64/x86, saltos de vídeo largo, IPC, GUI Electron con edición nativa y recursos empaquetados desde otro directorio. Tester libmpv x64 aprobado: https://github.com/mbrionesz/infotv/actions/runs/45763840029 . Incluye DLL/Vulkan locales, vídeo visible, pistas, estilos, caché/saltos y búsqueda nativa tras cerrar vídeo. No certifica altavoces ni rendimiento físico de cada equipo.
- Publicación Windows: https://github.com/mbrionesz/infotv/releases/tag/v0.10.21-beta.7 . Once archivos: solo los instaladores actuales normal x64/x86 y tester x64, sus sumas/fuentes y los cuatro archivos de Tizen 0.10.21 sin cambios. Los tres EXE públicos se descargaron y sus SHA-256 coinciden con los comprobantes de CI.
- SHA-256 normal x64 `fe6e375f761e86a65931d7566c5b54ee3e2b68756b4e82a13fefb21b1db31795`; normal ia32 `de808cdde50f0b506b10a38ad5ac275200138512f008e587d972855d5f30e110`; tester x64 `df87d7a10222e8c92d8e3a9b69f7b20209491cb4b187767742a7efd248bfdcdc`.
- Los objetivos de búfer se verifican como política y con reproducción local, no como reserva alcanzada en una sesión larga de red. Pendientes APK release en dispositivos físicos, teclado instalado del usuario, redes/CDN reales y pruebas prolongadas. No se afirma carga inmediata, una reserva universal de 90 s ni RAM total limitada al presupuesto de vídeo.
