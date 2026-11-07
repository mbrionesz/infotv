# Propuesta visual Cinema

Inspiración: superficies oscuras, tipografía clara y foco blanco de Apple TV, conservando identidad XuperTizen. Implementada en `app/css/cinema.css` como una capa de presentación reversible. No se publica esta propuesta durante la revisión visual.

El estilo compartido cubre inicio y categorías, películas/series, búsqueda, guía, detalle, teclado, menús de reproducción, ajustes y diagnóstico. Las cuatro capturas principales usan datos locales de demostración, no una sesión del proveedor.

| Vista | 1080p | 4K |
| --- | --- | --- |
| Principal | [Ver](screenshots/cinema-proposal/inicio-1080p.png) | [Ver](screenshots/cinema-proposal/inicio-4k.png) |
| Ajustes | [Ver](screenshots/cinema-proposal/ajustes-1080p.png) | [Ver](screenshots/cinema-proposal/ajustes-4k.png) |
| Películas | [Ver](screenshots/cinema-proposal/peliculas-1080p.png) | [Ver](screenshots/cinema-proposal/peliculas-4k.png) |
| Series | [Ver](screenshots/cinema-proposal/series-1080p.png) | [Ver](screenshots/cinema-proposal/series-4k.png) |

Rendimiento: sin nuevas dependencias, fuentes remotas, filtros blur, zoom animado, temporizadores o peticiones de catálogo. Se reutilizan el icono y las portadas existentes. La paginación de 36 títulos y la navegación permanecen iguales; las portadas verticales muestran menos filas a la vez y conservan desplazamiento. No cambia el reproductor ni el transporte de vídeo.

Comprobación de límites en 1080p, 4K y panel 4K con viewport 1080p. La prueba de navegador cubre navegación, catálogo, teclado, reproducción de prueba y caché. Esto no sustituye la medición de fluidez en un Samsung físico.

Regenerar capturas: `SCREENSHOT_DIR=docs/screenshots/cinema-proposal ASSERT_VIEWPORT=1 node tools/frontend-review-browser.mjs`.
