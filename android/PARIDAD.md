# Funciones de XuperAndroid 0.1.1 beta 1

La equivalencia se implementa sobre Media3 nativo. Las funciones de los motores AVPlay, VLC o libmpv y sus cifras de búfer no se trasladan literalmente a Android.

| Función del cliente existente | Implementación Android |
|---|---|
| Identidad, TV/Películas/Series, lupa y ajustes | Compose adaptativo; táctil y D-pad; pestañas por foco en TV |
| Catálogo completo, categorías, búsqueda y filtros | Mismas rutas del portal, páginas de 36; carga progresiva, sin cargar todo en RAM |
| Fichas, sinopsis, temporadas, episodios y similares | Metadatos del portal; sugerencias por género excluyendo el título actual |
| Seguir viendo y eliminar historial individual | Room; separación por tipo, nombre/episodio/temporada, progreso rojo, minutos restantes y pulsación larga |
| Mi lista y canales favoritos | Colección navegable y eliminación |
| Reproducción integrada, avance, pausa y recuperación | Media3; seek cuando la fuente lo admite; renovación limitada de autorización, sin perder posición o pausa |
| Audio y subtítulos de VOD/TV | Prioridad latino cuando se identifica; pistas internas y alternativas VOD del portal; TV inicia sin subtítulos |
| Estilos de subtítulos | Selección única de fuente, tamaño y color |
| Siguiente episodio | Solo series, último tramo de 90/180/240 segundos según duración; requiere listado de episodios |
| Resolución/FPS/formato de imagen | Valores observados de Media3; imagen ajustada, ampliar o estirar; no inventa 1080p, HDR ni FPS |
| Información de caché/búfer | Reserva real en segundos; objetivo 30/60 s y límite 12/32 MiB según memoria. No copia los 3 minutos de libmpv ni garantiza esos segundos con cualquier bitrate |
| Máxima calidad disponible | Sin límite artificial en Wi-Fi; presupuesto inicial interno para datos celulares/ahorro de Android, sin selector |
| Carrusel e imágenes mejoradas | Tres títulos; rotación cada 8 s pausada por foco; TMDB limitado al carrusel y caché persistente |
| Estadísticas e historial del catálogo | Totales declarados de las rutas usadas para navegar; no suma subcategorías; cinco cambios acotados |
| Versión del portal | Solo campos realmente declarados por el servidor, observación semanal en respuestas propias |
| Diagnóstico y limpieza | HTTP/latencia, descarga acotada de 1 MiB, limpieza de imágenes temporales conservando biblioteca |
| Salir y liberar reproductor | Doble Atrás desde Inicio; conserva progreso y favoritos. El sistema administra la RAM y puede conservar caché de imágenes |
| PiP | Exclusivo móvil/tablet compatibles, no TV |

## Límites que deben permanecer visibles

- El portal puede no proporcionar ciertos idiomas, duraciones, FPS, calidades o totales. No se garantizan alternativas inexistentes.
- Búsquedas con filtros adicionales se refinan sobre las páginas consultadas; no se presentan como índice local exhaustivo.
- Siguiente capítulo corresponde a la temporada cargada; el cambio automático a la siguiente temporada no está implementado.
- No hay APK actualizable desde el portal ni descarga de semillas de otros clientes. La sesión es propia.
- La caché de vídeo es de RAM y acotada. No hay descargas offline ni promesa de cinco minutos para dispositivos de memoria reducida.
- Las pruebas locales/CI verifican contenido de prueba y el contrato criptográfico. No prueban la autorización real de cada CDN, una sesión prolongada o todos los códecs del equipo.
- Compatibilidad física TCL/Lenovo/teléfonos y Android TV prolongado siguen pendientes de validación con modelo/firmware concretos.

La equivalencia funcional no debe describirse como certificación universal ni como garantía de ausencia de errores. Los detalles reproducibles están en VALIDACION.md.
