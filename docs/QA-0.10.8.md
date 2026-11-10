# Búfer y Seguir viendo 0.10.8

## Reserva de vídeo

MP4 pasa de un objetivo máximo de 25 a 40 segundos; retoma lectura a 20 s o antes según bitrate. El presupuesto de datos comprimidos sigue siendo 16 MiB hacia delante, 8 MiB hacia atrás y 8 MiB de cola. Es una estimación por bitrate medio y conserva el mínimo de 3 s; no es un límite de RAM del proceso o decodificador.

MPEG-TS conserva 25 s si no conoce duración/bitrate. Cuando hay duración del portal o una estimación PCR válida, utiliza hasta 35 s y el mismo objetivo de bytes hacia delante, con pausa/reanudación de lectura. Se mantiene la limpieza de búferes anteriores. El reproductor nativo VOD conserva 3 s de arranque y cambia la reserva de reanudación de 6 a 8 s; TV sigue 3/6.

Las pruebas VOD verifican MP4 faststart/tail, TS, FHD, audio/vídeo avanzando, pausa, avance fuera del búfer, reanudación a 95 s y renovación de autorización. El destino de la prueba fuera del búfer se calcula según el extremo realmente cargado, ya que 39.8 s puede ahora estar disponible.

## Interacción

La pulsación corta de OK se activa al soltar. Mantenerlo durante 650 ms abre acciones; repetición de keydown y el keyup posterior no inician reproducción ni eliminan automáticamente. El borrado requiere elegir Eliminar; Cancelar/Volver conserva el registro. Cambiar de sección, ocultar la página o perder foco cancela una pulsación pendiente.

Eliminar usa la misma operación persistida de historial y no altera favoritos. Se comprueba borrar primero, último y único elemento, conservar un foco accesible y respetar la eliminación después de recargar. Para ratón se ofrece menú contextual sobre la tarjeta.

La barra roja expresa posición/duración cuando hay duración conocida. Sin duración informada se usa un indicador fijo sin porcentaje ARIA; no se inventa un avance relativo. No hay animación continua ni peticiones de red adicionales por las barras.

Las acciones de categoría están junto a su título, centradas verticalmente. Se revisa acceso por D-Pad, todas las tarjetas de las filas y regreso hacia arriba. Capturas y resultados usan datos locales de prueba, no una sesión del TV.
