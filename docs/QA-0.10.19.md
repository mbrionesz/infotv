# QA 0.10.19 beta.1 · Diseño

16 de noviembre de 2026.

- 346 pruebas unitarias aprobadas: incluye intervalo semanal, informes corruptos, fuente no disponible, conservación del dato anterior, detección de cambios, almacenamiento denegado y cancelación al cerrar.
- Build objetivo Chrome 56; transporte Samsung WASM TLS/Host/SNI y 17 DNS aprobados.
- Categorías: navegación por filas, restauración al volver, códigos de género/país del proveedor y ausencia de vista previa. Búsqueda con filtros a 720p/1080p/4K aprobada.
- Ajustes: trece paneles, columnas independientes, opciones de reproducción, fuente/tamaño/color y persistencia aprobados en 1080p/4K.
- Seguir viendo: foco, mantener OK, eliminación sin perder favoritos y restauración tras recargar aprobados.
- Limpieza de caché y TV lateral con 30 categorías aprobadas. La lista se desplaza y el vídeo local sigue avanzando.
- VOD UI: MP4/TS descargan durante reproducción; cada uno acumuló más de 285 s en pausa. Controles visibles en 720p/1080p/4K. No se alteran motores ni presupuestos de búfer.
- Recorrido visual: Películas, Series, categorías, búsqueda, ficha, ajustes, estadísticas, almacenamiento, fuentes de versiones y reproductor. AVPlay conserva fondo transparente. No se descargan componentes de ui.shadcn.com en runtime.
- Revisión manual de clientes: respuesta JSON simulada, cambio visible, foco conservado y configuración instalada intacta. Consulta inicial real de fuentes: LG e82c42ed321c8a924e49a52d4d7746256237c530; Samsung v1.18.2. No conecta al portal ni prueba aceptación de sus credenciales.
- magis.js comparado byte por byte con v0.10.17-beta.1: idéntico.

Las capturas usan datos de prueba. Chromium local no equivale a medir CPU/GPU/RAM en Samsung. Falta validar estabilidad prolongada y conexión al proveedor en el televisor del usuario. La revisión semanal describe clientes públicos, no una versión del servidor. No se promete ausencia de bugs ni 60 fps.
