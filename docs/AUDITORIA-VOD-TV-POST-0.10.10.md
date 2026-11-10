# Auditoría adicional VOD y TV posterior a 0.10.10

## VOD

1. Reintento forzado mientras mediaInfo/startPlayVOD sigue pendiente: resolve(force:true) invalidaba la caché pero se unía a la petición antigua. Podía recibir autorización antigua en lugar de solicitar una nueva. Ahora separa la petición forzada; cada solicitud conserva sus propios callbacks y solo la vigente puede escribir la caché. La antigua completa sus propios callbacks sin consumir los nuevos. Prueba con respuestas entregadas en orden inverso.
2. Subtítulos completos y forzados en el mismo idioma: elegir un subtítulo completo sin marca forced podía volver a la primera pista forzada al reevaluar la preferencia. La selección manual conserva si se eligió una pista marcada como forzada; una selección no forzada admite las pistas sin marca. No se deduce que un recurso sea forzado por idioma o URL. No cambia el apagado manual ni la activación automática.

## TV

3. La guía descartaba respuestas de canales mientras estaba suspendida, conservando loading=true. Ahora aplaza la aplicación hasta volver; no enfoca la guía oculta. Se prueban entrada en Ajustes, respuesta durante suspensión y reanudación sin quedar cargando. Se conserva también la respuesta de categorías recibida durante suspensión.
4. Una respuesta de categorías de una apertura anterior podía insertarse en la guía nueva. Se comprueba la identidad del panel. Cerrar descarta respuestas aplazadas y cancela temporizadores de filtro/cambio; la apertura de pantalla completa requiere guía activa.
5. Audio/subtítulos: una selección rechazada temporalmente se marcaba como aplicada y no se intentaba de nuevo con la misma lista de pistas. Ahora se marca solo al aceptar el reproductor; se prueba rechazo inicial, aceptación posterior y ausencia de selecciones repetidas tras éxito.

## Verificación

268 pruebas unitarias aprobadas. Compilación completada. test:tv-network-ux comprueba guía, 100 movimientos de canales, favoritos, cambios repetidos de sección, las respuestas tardías anteriores y controles visibles a 720p/4K. test:vod-recovery comprueba capítulos MP4/TS, reintentos, renovación y vuelta al catálogo; test:audio comprueba preferencias y reinicio. Fuentes y proveedor simulados.

No se atribuyen estos fallos a cortes concretos de una señal sin sus logs. No se modifican servidores, DNS ni perfiles de buffer. No se certifica estabilidad del proveedor o Samsung real. Se conservan las correcciones locales de Ajustes de la tarea anterior; estas correcciones se incluyen en 0.10.11 beta.

Correcciones incluidas en la entrega 0.10.11 beta.
