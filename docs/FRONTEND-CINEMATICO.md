# Frontend A+ — borrador de próxima versión

Tres pestañas superiores: TV, Películas y Series, con Ajustes a la derecha. Flecha derecha/izquierda cambia el foco; OK abre la sección. Arriba o Volver desde el catálogo permite regresar a las pestañas.

Películas y Series incorporan un destacado manual (máximo ocho títulos), categorías rápidas y selectores de colección y año. Las etiquetas distinguen novedades declaradas por el portal de estrenos ordenados por fecha; no se inventa una fecha de incorporación. La calidad solo se muestra cuando existe en los metadatos.

Seguir viendo y Mi lista se separan por tipo de contenido. El historial conserva el límite existente de 30 registros y permite desplazamiento horizontal; no queda limitado a las seis tarjetas visibles. Gestionar abre la gestión existente del historial.

Rendimiento: sin avance automático del destacado, sin resolver vídeos al cambiar de portada, tarjetas mediante IntersectionObserver, dos descargas de imágenes concurrentes y cola acotada. Miniaturas hasta 480×720 y destacado hasta 1600×900, sin ampliar originales pequeños. Caché de imágenes acotada a 18 MiB y URLs temporales a 80/16 MiB. Se mantienen los motores de reproducción, la configuración de búfer y los resolutores DNS.

## Fuentes de imágenes verificadas el 9 de noviembre de 2026

- [FAQ oficial de TMDB](https://developer.themoviedb.org/docs/faq): API gratuita para uso no comercial con atribución de datos/imágenes. Requiere cuenta y clave. Uso comercial mediante licencia aparte. [Condiciones](https://www.themoviedb.org/api-terms-of-use).
- [Acceso oficial de IMDb](https://developer.imdb.com/documentation/api-documentation/getting-access/): API mediante suscripción de AWS Data Exchange, con posibilidad de solicitar prueba. No se presupone un precio ni acceso gratuito permanente.
- [Datasets no comerciales de IMDb](https://developer.imdb.com/non-commercial-datasets/): contienen subconjuntos de títulos, nombres y calificaciones, sin campos de portadas. No sustituyen una API de imágenes.

Esta implementación usa las imágenes del portal. No incorpora scraping ni claves de TMDB/IMDb. Una futura integración debe identificar el título por ID o título/año/tipo y mantener la imagen del portal si no hay coincidencia fiable.

## Comprobación

`npm test`, `npm run build`, `npm run test:cinematic`, `npm run test:catalog`, `npm run test:audio`, `npm run test:startup` y `npm run test:live`.

La prueba cinematográfica usa datos propios de prueba y vídeo local real: navegación, combinación de filtros, historial, retorno de reproductor y Ajustes, reanudación, tamaños de pantalla y generación real de miniaturas en el worker. Las capturas son de la interfaz ejecutándose en Chromium; no acreditan el rendimiento del firmware Samsung ni la disponibilidad del proveedor.
