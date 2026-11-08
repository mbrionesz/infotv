# XuperTizen 0.8.13 beta

- Español latino sigue siendo el audio preferido. Los subtítulos empiezan apagados cuando hay audio español; en automático se activan los subtítulos españoles disponibles si las pistas identificadas no incluyen español. Audio sin identificar no se interpreta como ausencia de español.
- Los cambios manuales de audio y subtítulos se guardan inmediatamente por película o serie. Se conservan al reiniciar y entre episodios; se restaura idioma/variante, no un índice que pueda cambiar entre archivos. Si la pista no existe, se usa la mejor alternativa disponible sin añadir ni traducir pistas.
- Ajustes permite subtítulos automáticos, siempre apagados o activados si están disponibles. Las elecciones del título tienen prioridad. Tamaño y color mantienen su guardado global.
- Diagnóstico de metadatos desde la sesión del TV: `XuperStandalone.auditVodMetadata().then(function(r){console.log(JSON.stringify(r,null,2))},console.error)`. Abrir primero una ficha o reproducir un título. No incluye URLs, licencias ni cabeceras.

Pruebas de audio y subtítulos reales MP4/TS, reinicio, segundo episodio con pistas reordenadas, ausencia de español y apagado manual persistente. Mantiene 17 DNS, reanudación y TV en vivo. Pendiente la comprobación física en Samsung.

La consulta del portal desde el entorno recibió portal100024 (región rechazada). No se afirma haber confirmado nuevos metadatos en vivo. Ver docs/PORTAL-Y-PREFERENCIAS-0.8.13.md.
