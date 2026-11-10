# XuperTizen 0.10.16 beta.1

- Ajustes → Estadísticas del catálogo: total, fecha de cambio, última comprobación y hasta 90 cambios guardados en JSON local.
- Solo añade registros si cambia el total de Películas y Series. El ✓ verde indica una respuesta completa recibida en la sesión; el dato guardado se distingue del comprobado.
- Contador visible desde el arranque con el último dato guardado; actualización en segundo plano y reintento tras fallos sin duplicar consultas.
- Cierre, limpieza de caché, respuestas tardías y navegación del historial corregidos.

No descarga el catálogo completo ni inventa cifras: utiliza los totales declarados por el portal. El historial se conserva al limpiar caché. Mantiene correcciones VOD, DNS y biblioteca anteriores. WGT sin firma para Apps2Samsung. Requiere validación en Samsung.
