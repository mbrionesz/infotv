# QA 0.10.14

316 pruebas unitarias aprobadas. Regresiones de reproducción local MP4/MPEG-TS y FHD, autorización renovada, historial, categorías, teclado/filtros, audio/subtítulos y limpieza desde Ajustes.

Panel TV validado con 30 categorías y vídeo activo: extremos sin vuelta circular, scroll/foco en 720p/1080p/4K, OK y Atrás devuelven la lista de canales. Se elimina el acceso antiguo Addons M3U del selector, manteniendo la configuración de listas propias.

Fuentes locales/respuestas controladas; no certifica disponibilidad del proveedor ni todos los códecs en un Samsung real. El log aportado de Hope muestra una sola variante 720p en esa consulta. No se promete que corregir el ID de la película haga aparecer una variante 1080p si el portal no la entrega. DNS integrado conservado.

Beta.2 corrige el formato de fecha del contador para no depender de String.padStart en Tizen 4. Prueba con ese método ausente aprobada.
