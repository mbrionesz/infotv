# Revisión funcional y UX 0.10.5

Se revisaron el código y las pantallas en Chromium con el canvas real de la app, fuentes locales de vídeo y respuestas de catálogo controladas. Las capturas de pruebas no muestran el catálogo del proveedor ni mediciones de la TV.

| Área | Comprobación |
|---|---|
| Películas y series | Filas por género, todas las 12 tarjetas de Acción, cuatro filas de series, abrir/regresar conservando selección, Ver todas, filtros combinados con IDs reales de las respuestas simuladas |
| Carrusel | Avance manual y automático, tres destacados, pausa por interacción, sin nuevas consultas de catálogo ni reproducciones por cada avance; caché TMDB reutilizada al reiniciar |
| Seguir viendo | 18 películas y ocho series; desplazamiento hasta la última tarjeta; reanudación; biblioteca persistida y recuperación IndexedDB |
| Fichas | Sinopsis larga expandida completa; acciones accesibles después de expandir; volver arriba; abrir película/episodio y regresar |
| TV | 120 canales, recorrer 100 hacia abajo y arriba manteniendo foco visible, 35 categorías, solo 12 botones reutilizados, sin reproducción durante navegación, favoritos, logos con contain |
| Cabecera | Primer inicio en Películas; flechas activan secciones; engranaje espera OK; regreso desde Ajustes; cambios repetidos sin paneles duplicados |
| Ajustes | Diez paneles a 1080p/4K; opciones de imagen/audio/idioma/tamaño/color/fuente; persistencia, desplazamiento de columnas y modal TMDB |
| Diagnóstico | Latencia HTTP, descarga limitada a 4 MiB, errores y cancelación; 200 verde/404 ámbar; controles accesibles a 720p/4K |
| Reproducción | MP4 al inicio/al final, MPEG-TS, alternativas, FHD, reintento, episodio, reanudación y renovación de fuente con archivos autorizados locales |

La prueba pública de internet usa HTTPS a speed.cloudflare.com, solo al pulsar su botón. Mide tres respuestas pequeñas y una descarga de 4 MiB, cada petición limitada a 12 segundos. Se cancela al cerrar el diagnóstico. No altera el DNS de la app, no mide Wi-Fi físico y no comprueba la licencia/disponibilidad del canal. Se comprobó HTTP 200 y CORS permisivo del endpoint desde el entorno.

No se ha probado esta versión en el hardware QN70F ni se ha verificado cada título/servidor del proveedor. Los logos de baja resolución no adquieren detalle nuevo: se evita estirarlos o recortarlos. Se conservan el transporte seguro, sus 17 resolutores, los 10 hosts y los perfiles de búfer.

Para Windows puede reutilizarse la lógica de catálogo, biblioteca y buena parte de la UI. Conviene definir adaptadores de reproducción, transporte/DoH, almacenamiento y entrada, con una aplicación de escritorio aparte y el mismo conjunto de pruebas. No se introduce esa migración en esta versión.
