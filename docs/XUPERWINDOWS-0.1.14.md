# XuperWindows 0.1.14 beta

Seguir viendo utiliza tarjetas verticales con portada sin deformar, título/episodio/tiempo restante alineados, progreso rojo y sombreado. Windows prioriza el póster sobre la imagen horizontal; Tizen conserva su presentación publicada.

La apertura Windows reutiliza la consulta de metadatos recién obtenida (TTL de 60 s del protocolo) en vez de invalidarla siempre. Las renovaciones y reintentos explícitos siguen forzando una licencia nueva. Se registra el tiempo de resolución. Si el modo compatible produjo imagen, se reutiliza durante esa sesión para evitar repetir la espera de la ruta automática en cada título; no se persiste ese diagnóstico entre arranques.

El comando de avance deja de confirmar de forma optimista: espera al reloj nativo. Si la búsqueda por tiempo no se confirma, prueba una vez por posición y vuelve a comprobar; si falla, se informa sin inventar un reloj nuevo ni marcar progreso visto. Una fuente que anuncia que no permite buscar se informa como tal. Se ofrece entrada de minuto/HH:MM:SS, estado visible y Copiar estado en la barra, sin necesitar un error para obtener el diagnóstico.

La información de descarga y límites de caché está en la barra inferior, visible al mover el cursor, en vez del recuadro de pausa que podía quedar tapado por la superficie HWND. No se inventan minutos de reserva. La lectura anticipada mantiene 32 MiB x64/16 MiB x86 y preparación 2 s. Se emiten eventos de pausa/reproducción para mantener la UI y el historial sincronizados.

La prueba Windows añade MPEG-TS HEVC sintético de dos horas, mayor que la caché x64, y saltos a 40, 110 y 60 minutos por el proxy autorizado con rangos HTTP. Prueba la ruta y la línea temporal; no demuestra que todos los CDN del portal admitan seek ni reproduce su bitrate.

Se conserva el WGT Tizen 0.10.21 idéntico en una publicación conjunta limpia. No se modificó magis.js.

La prueba estricta detectó un fallo de lectura de prefetch al buscar con la entrada pausada. Se reanuda temporalmente la entrada, silenciando el audio si el usuario estaba en pausa; se espera actividad del decodificador y tiempo estable antes de restaurar pausa y silencio anteriores. No se confirma solo porque libVLC haya actualizado su variable de tiempo al recibir el comando.

El lector MPEG-TS habitual de VLC requiere `STREAM_CAN_FASTSEEK` para su búsqueda por tiempo (`SeekToTime`), mientras el acceso HTTP declara esa capacidad como falsa. La ruta Windows TS usa ahora el demultiplexor avformat (FFmpeg) incluido en VLC, que utiliza rangos sin exigir esa capacidad. La prueba confirma la selección efectiva de avformat, no solo la opción solicitada.

La distribución oficial VLC Windows se compila con `--enable-merge-ffmpeg`; el módulo que implementa avformat puede identificarse como `avcodec` en el registro. La validación acepta esos dos nombres de implementación, pero no el lector TS anterior. El registro de diagnóstico de las pruebas conserva los bloques completos; la ejecución normal mantiene el límite anterior.

Validación final: 347 pruebas generales, 33 de escritorio, prueba local Chromium de tarjetas/entrada de tiempo/copia de estado y prueba Windows con fuente HEVC TS sintética de dos horas. Los saltos a 2400, 6600 y 3600 segundos se confirmaron con procesamiento de vídeo y rangos HTTP, tanto en x64 como x86 y en motores empaquetados. [Ejecución final](https://github.com/mbrionesz/infotv/actions/runs/44189361975), fuente inmutable `v0.1.14-beta.6`.

Tiempos del entorno CI para los saltos empaquetados: 629–635 ms. Arranque de la fuente corta empaquetada: 693 ms x64 / 933 ms x86. Son mediciones de una fuente sintética en red local, no una predicción para el portal ni un ensayo de alto bitrate. Falta confirmar los títulos del usuario.

SHA256 descargados coincidentes con los activos públicos:

- x64: `4c571d35126c6bc519dc8f8cf2da80775704738974cc99b80d8e2906357fc28d`
- x86: `f5b1eca3ca1df00f82186e85708a6707b7071e898df4c7aab0fcc79d5723e777`

Publicación conjunta limpia: https://github.com/mbrionesz/infotv/releases/tag/v0.10.21-beta.6 . La publicación se asoció a la etiqueta final sin reescribir etiquetas anteriores. Tizen se verificó idéntico y la publicación anterior se retiró tras comprobar los archivos nuevos.
