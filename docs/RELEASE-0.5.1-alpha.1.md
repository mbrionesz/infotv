# XuperTizen 0.5.1 alpha.1

Retira los trece presets públicos de IPTV-org de la guía y los cuatro presets
heredados de la interfaz antigua. Esas listas agregaban contenido, no mejoraban
la reproducción de los canales del portal. No se descarga ninguna lista externa
automáticamente. Las referencias de versiones anteriores son historial.

Se mantiene únicamente la importación opcional de una URL M3U propia, sus
favoritos y la corrección que solicita una resolución nueva al portal una vez
tras HTTP 404. Agregar Addons abre el teclado de URL si no hay listas propias.
Las listas introducidas por el usuario no se eliminan al actualizar.

Validación: 40 pruebas unitarias e integración Chromium de importación propia,
reproducción, favoritos, actualización/eliminación y renovación única tras 404.
Esta retirada no cambia el motor de reproducción ni afirma resolver otros
cortes, FPS o desfase audiovisual. Prueba física de esta versión pendiente.
