# Tester 0.1.14 Test libmpv · revisión 3

[Descargar Windows x64](https://github.com/mbrionesz/infotv/releases/download/v0.10.21-beta.6/XuperWindows-Tester-0.1.14-Test-libmpv-r3-x64-Setup.exe).

Versión del diagnóstico: `0.1.14-test-libmpv.3`. Cierra el tester e instala encima para conservar su perfil. La identidad del instalador y el directorio `XuperWindows Tester` son independientes de la versión normal. El tester utiliza la misma interfaz y un controlador propio que enlaza la API C de libmpv, sin abrir una aplicación de reproducción externa. TV mantiene su ruta de reproducción actual.

## Compatibilidad del portal

La revisión 3 actualiza el perfil efectivo y el manejo de hosts. El archivo histórico `companion/lib/magis.js` permanece intacto; el adaptador se aplica al compilar. Se mantienen APK `49902` y cabecera `43404`, con sistema/paquete `2025-08-07 05:40:11_36_16_` y SDK `36`, observados en Samsung 1.19.4 y probados con solicitudes propias.

Un host que rechaza la versión ya no cancela las respuestas de otros hosts ni se convierte en preferido. Si todos fallan, el error de versión se conserva y se muestra en español; una ruta alternativa no lo oculta con un 404. [Evidencia y límites de la comprobación](PORTAL-COMPATIBILIDAD-R3.md).

## Motor y caché

El controlador informa la reserva medida por el demuxer. Objetivo: 180 segundos de lectura anticipada, con límite de 64 MiB y 8 MiB hacia atrás. Son objetivos y límites, no una garantía de tres minutos a cualquier bitrate. La reproducción empieza sin esperar a llenar toda la reserva. Autorización, rangos HTTP, DNS seguro, Host/SNI y TLS verificado siguen gestionados por el proxy de la app.

Se conservan pausa, avance por barra/minuto, idiomas, subtítulos y fuente/tamaño/color. El diagnóstico identifica `engine: libmpv`, pistas seleccionadas, reserva, FPS y saltos confirmados.

La revisión 2 corrigió una dependencia omitida: `vulkan-1.dll`. El paquete incluye el cargador oficial Khronos compilado desde una revisión fija con runtime C estático. El controlador verifica la carga local e informa errores Win32. No instala controladores ni runtimes de GPU en el sistema. El vídeo usa Direct3D 11.

La ventana nativa se mantiene sobre la superficie interna `Intermediate D3D Window` de Electron, se recorta para dejar visibles los controles HTML y se oculta para los menús. Esto corrigió la pantalla negra aunque el reloj avanzara.

## Validación

Fuente del instalador: `v0.1.14-test-libmpv.13`. [Compilación y pruebas](https://github.com/mbrionesz/infotv/actions/runs/44233282178). Los controles nativos prueban HEVC/AAC, español/inglés, SRT, estilos, caché, pausa, reanudación, EOF y saltos a los minutos 40/110/60 en una fuente sintética de dos horas, también desde recursos empaquetados. Una captura exige vídeo visible en la ventana; un reloj que avanza no basta. Se prueban dependencias locales ausentes y se verifica la procedencia del cargador Vulkan.

El ejecutor de Windows no tiene salida física de audio ni GPU de vídeo: usa explícitamente software y audio nulo. La instalación del usuario conserva hardware automático y audio real. La prueba directa del portal llegó al bloqueo regional `portal100024` desde este entorno, por lo que no demuestra reproducción completa desde la conexión del usuario.

Solo x64: la biblioteca i686 no superó la validación inicial y no se distribuye un tester de 32 bits. El instalador normal x86 permanece disponible. Procedencia, licencias y fuentes: `desktop/libmpv-dependencies.json`, `desktop/LIBMPV-TESTER-NOTICES.md` y el archivo fuente de esta revisión.

Instalador descargado y verificado contra el checksum de compilación y el digest publicado: `c3cfc93f716d51da00616566696733e115cca580d9ee5747a7eb7352e628f298`. Los assets de producción Windows/Tizen conservan sus identificadores y SHA256.
