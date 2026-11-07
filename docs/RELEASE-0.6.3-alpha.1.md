# XuperTizen 0.6.3 alpha.1

Revisión centrada en carreras de navegación, ciclo de vida del servicio de datos y
operaciones de diagnóstico. Se corrigieron fallos reproducibles; no es una garantía
de ausencia de otros bugs ni una corrección de listas defectuosas del proveedor.

## Fallos y correcciones

1. Una resolución de canal tardía podía solicitar vídeo después de salir al inicio.
   Cambiar de pantalla invalida la selección y cancela el debounce pendiente; la
   respuesta solo se aplica si siguen activos el reproductor y el modo de TV en vivo.
2. Seleccionar otro canal durante los 120 ms de debounce dejaba válida la respuesta
   anterior hasta que empezara la nueva petición. Ahora se invalida al seleccionar,
   antes de esperar. No se incrementa el token al empezar Gr/zr, que forma parte de
   una apertura válida. Prueba de navegador reproduce ambos casos con callbacks retenidos.
3. Si postMessage del cliente de datos lanzaba una excepción, quedaba una entrada
   pendiente que podía completar el callback otra vez por respuesta o timeout.
   Se elimina la entrada y su temporizador antes de notificar el error.
4. Una respuesta HTTP nativa tardía del servicio de datos cerrado podía enviarse a
   su trabajador de reemplazo, cuyos identificadores se reinician. Los callbacks
   capturan y verifican la identidad de su trabajador. Respuestas y errores antiguos
   se descartan. Cerrar el cliente completa sus esperas una sola vez con AbortError.
5. Los callbacks de error del trabajador se notificaban antes de cerrar su instancia
   y vaciar pendientes. Un reintento desde el callback podía enviarse al trabajador
   averiado. Se cierra y vacía primero; los reintentos reciben el fallo coherente.
6. Las pruebas HTTP de CDN seguían ejecutándose al cerrar Diagnóstico. Ahora se
   cancela la petición activa y no se consultan los destinos restantes; funciona
   tanto con transporte Samsung como con XHR. Abrir otro panel cancela la prueba
   anterior. La cancelación no se presenta como DNS alterado o fallo del canal.
7. Una redirección HTTP podía introducir usuario/contraseña en URL aunque se rechazan
   en las peticiones iniciales. Se aplica la misma restricción a cada destino de
   redirección, conservando las restricciones de protocolo y TLS existentes.

8. Cuando el informe de CDN excedía el área visible, el mando solo desplazaba el
   JSON técnico y no permitía consultar los destinos inferiores. Arriba/abajo
   desplaza ahora también la lista de resultados. La prueba de navegador verifica
   el desplazamiento y que Return cancela la medición del panel.

## Validación

Pasaron 77 pruebas unitarias y las pruebas de navegador: carreras con respuestas
retenidas, desplazamiento de resultados CDN, cancelación al cerrar con Return,
reproducción cifrada AES-128, controles y preferencias. Pasaron también continuidad
de 60 s con errores 404/503 y listas inconsistentes, y la prueba de latencia 720p
con fotogramas decodificados y Pausa/reanudación.

[Continuidad](benchmarks/live-continuity-v063.json) ·
[Latencia](benchmarks/live-latency-v063.json). Metadatos simulados, Chromium y
adaptador HTTP local; no servidor del proveedor ni hardware Samsung.

No se cambian el perfil de latencia 720p,
reserva inicial de 1 s, recuperación por falta real de reserva de 6 s, HLS.js/worker
1.7.4 ni el diseño. Prueba física de esta versión en Samsung pendiente.
WGT sin firma para Apps2Samsung.
