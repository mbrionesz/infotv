# XuperTizen 0.6.4 alpha

Nuevo inicio sin reproductor vacío: accesos a TV en vivo, Películas, Series, Buscar, Mi lista y Ajustes, con portadas verticales cargadas en segundo plano.

- Estilo oscuro inspirado en Apple TV, nuevo icono y arranque XuperTizen / by Matias.
- Ajustes renovados, desplazamiento independiente de ambas columnas y navegación con mando sin saltos a controles ocultos.
- Escalado según el viewport disponible: 1080p, 4K y panel 4K con interfaz 1080p.
- Scroll del catálogo adaptado al tamaño real de las portadas.
- Filtro de contenido adulto conectado a guía, catálogo y portadas, según los metadatos disponibles. No es un bloqueo con PIN.
- Preferencia de audio para pistas HLS.js y aplicación del interruptor de subtítulos. Los idiomas requieren pistas disponibles; la selección automática por idioma en AVPlay sigue pendiente.

Validación: 78 pruebas unitarias; navegador con reproducción HLS de muestra; recorrido de seis accesos principales y diez secciones de ajustes, con capturas en 1080p y 4K. Pendiente comprobar esta versión en un Samsung físico y señales reales.

WGT para Tizen 4.0+, sin firma; firma e instala mediante Apps2Samsung. Se conserva el identificador Infotv2026.InfoTV. HLS.js y worker permanecen en 1.7.4.
