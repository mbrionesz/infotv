# XuperTizen 0.6.5 alpha

Correcciones de navegación y arranque de TV en vivo, más las mejoras de películas/series verificadas desde 0.6.4.

- **Arranque estable:** 3 segundos de reserva inicial y 6 después de una interrupción real, en lugar de 1 segundo al arrancar. Se mantiene una salida acotada para ventanas HLS demasiado cortas.
- **Menor retraso opcional:** el perfil estable es el predeterminado. El modo 720p experimental usa dos segmentos en vez de uno (aproximadamente 10 s con segmentos de 5 s), priorizando continuidad, y requiere activación explícita; una preferencia `on` ya guardada se conserva. Espera a que arranque el vídeo antes de ajustar el directo y no oscila al recibir otro evento `playing`.
- **Mando:** derecha desde la barra lateral lleva el foco al contenido principal; solo OK abre una categoría. Arriba/abajo omiten opciones ocultas.
- **VOD:** se corrigen fichas incompletas, pérdida del origen remoto, mezcla de episodio/modo anterior y selección de capítulos desde la ficha. Esta última podía detener el vídeo sin abrir el episodio seleccionado.
- **Catálogo:** navegación por filas, foco visible, Reintentar tras fallos y protección contra saltar páginas mientras cargan.
- **UX:** tipografía secundaria mayor y con más contraste, sin fuentes remotas ni efectos pesados. Se retira Notificaciones, que solo cambiaba de icono, y la etiqueta HD no confirmada.

## Limitación importante de películas y series

**MP4 o MPEG-TS que requieren cabeceras HTTP de autorización siguen sin estar soportados en la app autónoma.** El portal VOD entrega también esas rutas; HLS.js no transforma automáticamente esos archivos en HLS y AVPlay no acepta nuestras cabeceras personalizadas. Ahora el mensaje y el diagnóstico distinguen esta limitación de un fallo HLS.

HLS con autorización está soportado y se comprueba con vídeo de prueba. Esta release no promete que todo el VOD del proveedor funcione. La comprobación anónima del proveedor desde el entorno devuelve `portal100024` (restricción regional).

## Validación

80 pruebas unitarias. Navegador: seis destinos y seis portadas principales; 36 tarjetas de películas y 36 de series; detalle, decodificación HLS, episodio 2, pantalla completa y Volver; regreso de serie a película; recuperación de catálogo. Pruebas explícitas de diagnóstico para MP4/TS autorizados.

HLS en vivo de prueba durante 60 segundos con lista móvil, worker, 404/503 e interrupción de cuatro segundos: arranque con 3 s y recuperación con 6 s, sin reinicio de CDN ni falso aviso de OK. Prueba adicional del modo 720p experimental, pausa y reanudación. Estas pruebas son sintéticas, no sustituyen la validación en Samsung físico.

WGT sin firma para Tizen 4.0+, instalable/firmable con Apps2Samsung. Se conserva Infotv2026.InfoTV. HLS.js y worker siguen en 1.7.4.
