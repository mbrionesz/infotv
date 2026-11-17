# XuperWindows 0.1.14 beta

Seguir viendo utiliza tarjetas verticales con portada sin deformar, título/episodio/tiempo restante alineados, progreso rojo y sombreado. Windows prioriza el póster sobre la imagen horizontal; Tizen conserva su presentación publicada.

La apertura Windows reutiliza la consulta de metadatos recién obtenida (TTL de 60 s del protocolo) en vez de invalidarla siempre. Las renovaciones y reintentos explícitos siguen forzando una licencia nueva. Se registra el tiempo de resolución. Si el modo compatible produjo imagen, se reutiliza durante esa sesión para evitar repetir la espera de la ruta automática en cada título; no se persiste ese diagnóstico entre arranques.

El comando de avance deja de confirmar de forma optimista: espera al reloj nativo. Si la búsqueda por tiempo no se confirma, prueba una vez por posición y vuelve a comprobar; si falla, se informa sin inventar un reloj nuevo ni marcar progreso visto. Una fuente que anuncia que no permite buscar se informa como tal. Se ofrece entrada de minuto/HH:MM:SS, estado visible y Copiar estado en la barra, sin necesitar un error para obtener el diagnóstico.

La información de descarga y límites de caché está en la barra inferior, visible al mover el cursor, en vez del recuadro de pausa que podía quedar tapado por la superficie HWND. No se inventan minutos de reserva. La lectura anticipada mantiene 32 MiB x64/16 MiB x86 y preparación 2 s. Se emiten eventos de pausa/reproducción para mantener la UI y el historial sincronizados.

La prueba Windows añade MPEG-TS HEVC sintético de dos horas, mayor que la caché x64, y saltos a 40, 110 y 60 minutos por el proxy autorizado con rangos HTTP. Prueba la ruta y la línea temporal; no demuestra que todos los CDN del portal admitan seek ni reproduce su bitrate.

Se conserva el WGT Tizen 0.10.21 idéntico en una publicación conjunta limpia. No se modificó magis.js.

La prueba estricta detectó un fallo de lectura de prefetch al buscar con la entrada pausada. Se reanuda temporalmente la entrada, silenciando el audio si el usuario estaba en pausa; se espera actividad del decodificador y tiempo estable antes de restaurar pausa y silencio anteriores. No se confirma solo porque libVLC haya actualizado su variable de tiempo al recibir el comando.

El lector MPEG-TS habitual de VLC requiere `STREAM_CAN_FASTSEEK` para su búsqueda por tiempo (`SeekToTime`), mientras el acceso HTTP declara esa capacidad como falsa. La ruta Windows TS usa ahora el demultiplexor avformat (FFmpeg) incluido en VLC, que utiliza rangos sin exigir esa capacidad. La prueba confirma la selección efectiva de avformat, no solo la opción solicitada.
