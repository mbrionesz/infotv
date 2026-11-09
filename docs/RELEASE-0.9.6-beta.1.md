# XuperTizen 0.9.6 beta

- Corrige el tipo JSON de los identificadores numéricos de categorías: se envían como números. Si la consulta moderna falla, puede usar el código de la misma categoría anunciado por el portal; nunca sustituye la selección por el catálogo general.
- Una categoría cuyo respaldo también falla conserva el error original en diagnóstico, en vez de presentarlo como cero títulos. La comparación de totales consulta las categorías sin ocultar errores con respaldos.
- Turquía conserva valores del proveedor como `Turkey`. Si el primer filtro está vacío, puede probar una alternativa informada en filtros o fichas; conserva género, año y categoría. Los países preferidos observados en fichas siguen accesibles aunque falten en los metadatos de filtros.
- La ficha vuelve hacia arriba por filas de controles, episodios y recomendaciones. Corrige también el desplazamiento horizontal con escala 4K/720p.
- Principal tiene ancho y espaciado corregidos, portada completa y controles dentro de un margen de seguridad del 5% para evitar recortes en TV.

Conserva el guardado de progreso, las 22 rutas, diez hosts, 17 DNS y la reproducción de TV en vivo. La navegación y los márgenes se comprobaron en navegador; falta confirmar la respuesta de las categorías con el proveedor desde Samsung.
