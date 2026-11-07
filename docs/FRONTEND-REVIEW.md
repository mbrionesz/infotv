# Revisión visual de XuperTizen

Capturas de la interfaz actual en Chromium, con datos locales de demostración. No acreditan acceso al catálogo del proveedor ni una prueba física en Samsung. El rediseño general queda pendiente de la conversación sobre estas vistas.

| Vista | 1080p | 4K |
| --- | --- | --- |
| Inicio | [Ver](screenshots/frontend-review/inicio-1080p.png) | [Ver](screenshots/frontend-review/inicio-4k.png) |
| Ajustes | [Ver](screenshots/frontend-review/ajustes-1080p.png) | [Ver](screenshots/frontend-review/ajustes-4k.png) |
| Películas | [Ver](screenshots/frontend-review/peliculas-1080p.png) | [Ver](screenshots/frontend-review/peliculas-4k.png) |
| Series | [Ver](screenshots/frontend-review/series-1080p.png) | [Ver](screenshots/frontend-review/series-4k.png) |
| Nuevo arranque | [Ver](screenshots/frontend-review/arranque-1080p.png) | [Ver](screenshots/frontend-review/arranque-4k.png) |

El icono fue generado para este proyecto por petición del usuario. Original en `branding/xupertizen-master.png`; exportaciones de 117 px para el lanzador y 512 px para el arranque. El nombre y el crédito se renderizan como texto para conservar nitidez al escalar.

El ajuste automático utiliza el área CSS que ofrece el televisor. La resolución del panel y la densidad se conservan para diagnóstico, pero no amplían la interfaz fuera de ese espacio. Se verificaron 1920×1080, 3840×2160 y panel 4K con viewport 1080p/DPR 2. No se fuerza una resolución que Tizen no ofrezca.

Reproducir las capturas y las comprobaciones: `ASSERT_VIEWPORT=1 node tools/frontend-review-browser.mjs`.
