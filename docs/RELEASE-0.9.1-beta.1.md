# XuperTizen 0.9.1 beta

- Cada apertura VOD solicita datos de reproducción frescos. Una autorización HTTP 401/403/404/410 vencida puede renovarse y reintentar el mismo rango de bytes sin reiniciar el vídeo, con límite de intentos.
- Recuperación acotada de un reloj VOD detenido y cambio a respaldo ante errores de red durante reproducción cuando existe un punto seguro. Reintentar desde una ficha con error vuelve a resolver la fuente.
- Guardado de progreso cada cinco segundos, al ocultar/salir y antes de desmontar el reproductor. El guardado previo al desmontaje conserva la identidad del título y episodio.
- Biblioteca con copia de respaldo local y respaldo IndexedDB. Informa si no puede persistir. No conserva datos borrados por desinstalación o por el sistema.
- MPEG-TS sin duración declarada muestra --:-- en lugar de una duración estimada. El historial antiguo sin duración verificada ya no se oculta por parecer completado.

Mantiene el diseño 0.9.0 y 17 DNS. Los dos hosts adicionales siguen excluidos: la revisión automática rechazó compilarlos por el envío de datos de sesión a destinos sin autorización específica del contenido enviado.

Pruebas con vídeo MP4/TS propio y expiración simulada durante reproducción; biblioteca restaurada tras pérdida de las copias locales. No se afirma haber reproducido ni resuelto todos los cortes de treinta minutos del proveedor en Samsung; requiere prueba y diagnóstico en el TV.
