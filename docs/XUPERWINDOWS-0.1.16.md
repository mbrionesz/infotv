# XuperWindows 0.1.16 beta · recuperación de descarga

Disponible en edición VLC (x64/x86) y tester libmpv (x64, revisión 1), con perfiles independientes.

## Evidencia y límites

El diagnóstico reportado en 0.1.15 mostraba libmpv cargado y listo para recibir medios, pero cero bytes y la fase DNS sin terminar. El código esperaba primero a todos los DNS seguros y luego a una consulta de Windows sin plazo propio. Un fallo de un dominio además desactivaba el DNS seguro globalmente durante cinco minutos. Los enlaces alternativos del portal no llegaban al proxy nativo.

Con el dominio público reportado, la consulta local pasó de aproximadamente 5,2 s a 0,38 s al usar la alternativa de Windows. Esto valida la resolución en el entorno de desarrollo; no prueba la descarga del contenido autenticado ni la conectividad del equipo del usuario.

## Cambios

- DNS seguro con un plazo de cuatro segundos; alternativa de Windows iniciada tras 350 ms con un plazo propio de tres segundos. La primera respuesta pública válida gana. Se mantienen Host/SNI y validación TLS.
- Un fallo de un dominio no desactiva las consultas seguras de otros. Se conservan caché limitada y consultas simultáneas compartidas.
- El reproductor nativo recibe los enlaces alternativos que entregó el portal. Ante DNS, conexión o HTTP 5xx intenta hasta tres fuentes, antes de entregar datos al decodificador, manteniendo el Range solicitado y las credenciales de cada origen.
- HTTP 401/403/404/410 sigue solicitando renovación de autorización; no se transforma en una búsqueda de otro origen para evitar ese rechazo.
- Renovar/cerrar una sesión invalida la petición anterior; los diagnósticos añaden modo y tiempo DNS, fase de conexión y número de fuente.

No aumenta la memoria de vídeo: se mantiene el objetivo libmpv de 180 segundos sujeto al límite de 64 MiB. No cambia el paquete de Tizen publicado ni el magis.js original. Si ningún servidor suministrado por el portal responde, se informa del fallo; no se garantiza que un portal caído reproduzca.

## Validación

49 pruebas Windows, incluidas DNS bloqueado, respuesta privada rechazada, cambio a fuente autorizada tras error DNS/conexión/HTTP 5xx, conservación de rangos y credenciales, renovación por 403 y cierre durante DNS. Las 351 pruebas compartidas y la compilación también pasan. CI comprueba reproducción real, audio, subtítulos, saltos, interfaz integrada y recursos nativos empaquetados antes de publicar.
