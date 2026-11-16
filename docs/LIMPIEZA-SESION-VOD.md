# Limpieza de sesión VOD: 0.10.18 beta

## Alcance

Salir de cualquier vídeo detiene el motor y libera temporizadores, peticiones y su fuente multimedia. El cierre MP4 ahora vacía explícitamente buffers de entrada, colas, fragmentos pendientes y muestras del parser; también lo hace si `stop` lanza una excepción. El diagnóstico deja de mostrar memoria y política de una sesión ya cerrada.

Si se abandona una película o episodio después del 95 % de una duración conocida y no estimada, se purgan además los enlaces resueltos en memoria y la caché temporal de información multimedia de ese título. El progreso se registra antes y se solicita su persistencia. No se detiene el vídeo al alcanzar el 95 %: la acción ocurre al salir o cambiar de reproducción. No aplica a TV en vivo, duración desconocida ni porcentaje calculado sobre una estimación.

La limpieza de sesión es síncrona antes de abrir el siguiente capítulo; el guardado no lleva una limpieza diferida que pueda borrar recursos de la nueva reproducción. No reinicia el worker de datos, no borra portadas ni catálogo persistente y conserva favoritos, preferencias y estadísticas. Limpiar todo en cada capítulo exigiría nuevas descargas y podría empeorar los tiempos de navegación.

Doble Atrás desde la raíz sigue guardando la biblioteca, vaciando caché temporal de datos/portadas y cerrando conexiones antes de llamar a la salida Samsung. Borrar datos de usuario o desinstalar es una operación diferente.

## Límites y comprobación

Liberar referencias permite al navegador recuperar memoria; JavaScript no fuerza el recolector ni controla cuándo el firmware devuelve RAM física. Los presupuestos de reserva de datos comprimidos no son un límite de RAM total del proceso. No se midió la RAM de la QN70F ni se garantiza ausencia de congelamientos del decodificador o proveedor.

Pruebas unitarias de umbral, duración inválida/estimada, orden frente al siguiente capítulo y cierre MP4 que falla. Pruebas locales de navegador para transición de capítulos, cierre al 96 % con historial conservado, descarga/reserva en pausa y doble Atrás. Las comprobaciones al 96 % simulan el reloj cerca del final de un archivo local; no equivalen a visionar una temporada completa en Samsung.
