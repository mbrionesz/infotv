# Contador de catálogo: auditoría posterior a 0.10.15

Borrador, sin publicar.

- El encabezado conserva el valor recibido antes de crear su DOM: el último conteo guardado aparece al iniciar.
- Controlador con una sola consulta de UI pendiente y un temporizador de planificación. Espera inicial de 3,5 s; éxito cada 30 min y fallo cada minuto.
- No inicia consultas fuera de Inicio (incluidas sus secciones Películas/Series/TV), durante reproducción o con el documento oculto. Al volver comprueba si corresponde actualizar sin duplicar solicitudes.
- Timeout de UI de 15 s, ignora respuestas tardías y permite reintentar. Esto no aborta solicitudes del portal ya iniciadas; el worker comparte solicitudes idénticas mientras siguen pendientes.
- Al cerrar o limpiar y reiniciar, elimina temporizadores e ignora callbacks pendientes para no recrear el conteo borrado.
- Solo persiste total y fecha, sin títulos. Un fallo o total parcial conserva el valor anterior. No se sustituye por 50.000 ni se suman categorías solapadas.
- Worker: reintenta conteos incompletos después de un minuto, rechaza sumas fuera de enteros seguros y no prolonga su caché si retrocede el reloj.

Pruebas: controlador con reloj y respuestas controlados (inicio/reinicio, navegación, ocultación, timeout, callbacks tardíos, cierre, almacenamiento inválido/denegado); prueba real de interfaz `node tools/catalog-counter-browser.mjs` con proveedor simulado; limpieza real desde Ajustes en 720p/4K. No es una medición de CPU o RAM en Samsung, ni valida el total ofrecido por el proveedor en la red del usuario.
