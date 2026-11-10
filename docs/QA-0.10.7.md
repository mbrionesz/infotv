# Recuperación y episodios 0.10.7

## Fallos encontrados en código

El cambio de capítulo podía modificar playerItem/playerEpisode antes de guardar y detener el vídeo previo. Ese orden permitía atribuir el punto final del primer episodio al segundo. La parada tampoco invalidaba todos los cambios diferidos de capítulo. El cliente del worker mantenía un error de inicio sin una vía de reinicio, y las conexiones transitorias podían sobrevivir a una espera/suspensión.

No hay un log del TV que confirme que estos sean la única causa del incidente. Apagar la TV puede suspender la misma instancia; no demuestra que el almacenamiento local esté corrupto.

## Corrección

- Parada y checkpoint preceden a la nueva identidad; se invalidan temporizadores y respuestas antiguas.
- Finales confirmados se procesan una sola vez, fuera de la pila del evento multimedia. MP4/native usan ended; TS también comprueba EOF real, búfer final estable y consumo hasta el final, sin saltar por una interrupción de red.
- El siguiente episodio se resuelve de nuevo. Al terminar el último o una película, se libera el reproductor y se regresa al catálogo.
- Error VOD abre un panel con reintento por conexión nueva, regreso y reinicio de app. Volver cierra menús y regresa al catálogo; Exit conserva su salida nativa cuando está disponible.
- Recuperar cancela solicitudes pendientes, reinicia worker/socket sessions y vacía solo metadatos/URLs transitorios. No borra biblioteca ni preferencias, no modifica los resolutores ni los hosts.
- Tras al menos 60 segundos suspendida, la reproducción VOD ofrece conexión nueva para evitar reusar una autorización antigua. Un reinicio de app espera hasta un segundo para guardar IndexedDB; localStorage ya contiene el checkpoint.

## Verificación

`npm run test:vod-recovery`: vídeos locales MP4 y TS de 12 segundos, avance automático, HTTP 401 simulado al abrir episodio 2, reintento con cabeceras nuevas, sesión con reloj adelantado 45 minutos, suspensión simulada de dos minutos, limpieza de diálogos, cambio manual y Exit simulado. El episodio 2 no hereda el minutaje del 1; una película no hereda la identidad del episodio de una serie anterior.

Se conservan las pruebas VOD de MP4 faststart/tail, TS, FHD, reanudación a 95 segundos, temporada/episodio y renovación de autorización. Pruebas unitarias verifican reinicio de worker, cancelación del trabajo nativo, mismos DNS después de reset y distinción entre EOF y cortes de red.

El reloj adelantado no es una prueba de reproducción continua de 45 minutos. Pendiente: verificación de una sesión larga en el QN70F y del error real del proveedor.
