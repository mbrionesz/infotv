# Revisión de UX, películas y series

Se revisó Inicio, sus seis destinos, la barra lateral, las seis portadas de Inicio y una página de 36 tarjetas de Películas y otra de Series con el mando.

## Cambios

- Navegación por filas: izquierda/derecha no saltan a otra fila del catálogo. Arriba/abajo llegan al pie y manejan la última fila incompleta.
- Al cargar o fallar el catálogo, Buscar/Volver siguen disponibles. Hay Reintentar con foco visible; la página fallida se conserva y pulsaciones repetidas no saltan páginas mientras cargan.
- Fichas con géneros, temporadas o episodios ausentes no rompen el detalle. Al mezclar metadatos se conserva el origen remoto del título.
- Las portadas principales conservan el origen del proveedor al abrir su ficha y resolver vídeo.
- La ficha comienza en modo VOD y limpia el episodio anterior. Se detiene la sesión anterior antes de cambiar su contexto, evitando mezclar reproducción e historial.
- Elegir un episodio desde la ficha inicia ese episodio en pantalla completa. Antes detenía el vídeo y el temporizador no lo reanudaba porque seguía en Detalle.
- Se retira Notificaciones de series: cambiaba el icono pero no enviaba ni guardaba notificaciones.
- Se elimina la etiqueta HD supuesta cuando no hay resolución confirmada.
- Letra secundaria algo mayor para distancia de sofá; metadatos con más contraste. Se mantienen grafito, blanco y foco claro. Fuentes locales de sistema, sin fuentes remotas ni efectos continuos.

## Validación

- 79 pruebas unitarias, incluida navegación de cuadrícula con última fila incompleta.
- Recorrido con D-Pad de las 36 tarjetas de películas y las 36 de series: foco visible y scroll correcto.
- Las seis portadas principales abren detalle y decodifican su fuente local de prueba.
- Película y serie: detalle, decodificación HLS real de vídeo H.264/AAC cifrado AES-128, pantalla completa y Volver mediante el adaptador Samsung.
- Serie: selección explícita del episodio 2 y comprobación del ID solicitado al resolver.
- Después de la serie, una película no hereda el episodio anterior.
- Fallo inyectado de catálogo seguido de recuperación con Reintentar.
- Prueba general de reproducción, guía, teclado, listas y cambio de canal sin regresiones.
- Límites visuales a 1080p, 4K y panel 4K con viewport 1080p.

En las distintas ejecuciones locales, `startupMs` del reproductor VOD estuvo aproximadamente entre 59 y 366 ms. Es tiempo del reproductor con una fuente local y cachés de prueba; no mide resolución remota, velocidad del CDN ni el hardware Samsung.

## Proveedor real

`node tools/probe-provider.mjs` respondió `portal100024` al solicitar sesión anónima desde el entorno: restricción regional del proveedor. No se pudo certificar aquí la reproducción de sus películas y series reales. Las pruebas anteriores usan metadatos simulados y vídeo local generado, con el reproductor real de la app. No se intentó eludir la restricción ni usar sesiones prestadas.

## Capturas

- [Inicio](../screenshots/ux-review/inicio-1080p.png)
- [Películas](../screenshots/ux-review/peliculas-1080p.png)
- [Series](../screenshots/ux-review/series-1080p.png)
- [Inicio 4K](../screenshots/ux-review/inicio-4k.png)

Las capturas usan portadas locales de demostración. Cambios preparados en el workspace; aún no forman parte de una release posterior a 0.6.4.
