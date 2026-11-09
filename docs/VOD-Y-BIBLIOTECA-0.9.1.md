# Correcciones VOD y biblioteca

## Causas comprobadas en el código

El acceso a la ficha puede precargar startPlayVOD. Abrir con datos anteriores reutilizaba el caché de reproducción hasta su TTL; ahora resolve de inicio y renovación omiten ese caché y actualizan el SLB. La sesión existente conserva la renovación de errores del portal. No se afirma que el token del proveedor venza exactamente a los treinta minutos.

El lector Range no renovaba 401/403/404/410 y el reproductor solo cambiaba de CDN antes de iniciar. Ahora el lector puede solicitar una fuente fresca, conservar el rango y reintentar con las cabeceras nuevas. Las renovaciones simultáneas se agrupan, máximo dos en cinco minutos y separación mínima de quince segundos. Un lector cancelado no vuelve a descargar después de renovar. Se exige la misma ruta de archivo y tamaño coherente; no se pegan formatos/archivos distintos. MPEG-TS comparte la fuente renovada entre lectores de la sesión.

Un reloj sin progreso durante dieciséis segundos, sin pausa, búsqueda o segundo plano, puede reiniciar el motor desde el punto actual. Máximo dos intentos por apertura; después muestra error. MPEG-TS requiere un anclaje verificado para recuperar fuera del inicio. Errores de red durante reproducción pueden probar hasta dos respaldos conservando posición cuando hay anclaje. Estas medidas no corrigen un archivo roto ni garantizan que el servidor esté disponible. Volver a intentar desde la ficha no reutiliza un reproductor en estado de error.

## Progreso y duración

El componente anterior usaba duración MSE, final de búfer, final de subtítulos y duraciones supuestas para la cronología. Para TS se confía solo en duración declarada o final real; sin ello se muestra --:-- y no un porcentaje falso. La duración del búfer sirve únicamente como límite de desplazamiento disponible. Los registros antiguos sin durationKnown no se consideran terminados por comparar su posición con una duración no verificada. Se marca el final explícito.

Se añade onCheckpoint antes del teardown: captura posición/anclaje con el título, temporada y episodio que realmente estaba reproduciéndose. Evita perder los segundos finales si pagehide de la plataforma vacía el vídeo antes del callback de la aplicación. Guardado periódico cada cinco segundos, además de pausa, ocultación y salida. Un cierre forzado o corte eléctrico puede perder los últimos segundos; no se garantiza un flush del SO.

## Biblioteca

El perfil se escribe de inmediato en la clave original y en una copia local; se respalda en una base IndexedDB separada (xuper-library-v1). Al iniciar recupera una copia válida o IndexedDB si faltan las locales, sin sobrescribir un perfil local válido con un respaldo viejo. Las operaciones tienen timeout y el diagnóstico muestra fuente/persistencia/error, sin datos del contenido. Si todos los medios fallan, se informa en pantalla, en vez de ignorar la excepción de escritura.

Los respaldos son locales al widget. Desinstalar, borrar datos, cambiar la identidad del widget o una reinstalación que limpie su almacenamiento puede eliminar todos los respaldos; no existe sincronización externa. El diagnóstico permite distinguir un fallo de almacenamiento de una pérdida por reinstalación.

## Hosts pendientes

Se intentó incorporar los dos hosts que el usuario solicitó, pero la revisión automática rechazó la compilación por el posible envío de datos de sesión/autorización a esos destinos. Se retiraron del checkout de build y continúan exclusivamente en la edición local del checkout principal. Esta release conserva los ocho hosts publicados anteriormente. No cambia los 17 resolutores DNS ni el transporte Samsung.
