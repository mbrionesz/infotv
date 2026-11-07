# Inicio y ajustes: UX y revisión funcional

La principal sustituye el reproductor vacío por seis destinos: TV en vivo (guía), Películas, Series, Buscar, Mi lista (VOD) y Ajustes. Tiene una fila de hasta seis portadas cargada en segundo plano desde el catálogo; no bloquea el arranque si falla. No se añaden títulos ficticios ni se inicia reproducción en la principal. Si no hay datos, ofrece abrir Películas.

Se retiran los accesos superiores duplicados, Explorar (duplicaba Buscar) y Novelas (el proveedor no admite ese root y terminaba devolviendo películas). Se mantienen Inicio, Destacados, Películas, Series, Kids, Anime y Mi lista en la barra lateral. El mando omite elementos ocultos, vuelve a los destinos visibles y conserva foco cuando se refrescan las portadas.

## Capturas

Estas capturas son de Chromium con datos de demostración; no prueban disponibilidad del proveedor ni rendimiento en Samsung físico.

- [Principal 1080p](../screenshots/dashboard/inicio-1080p.png) · [4K](../screenshots/dashboard/inicio-4k.png)
- [Mi cuenta](../screenshots/dashboard/menu-profile-1920.png)
- [Mi lista](../screenshots/dashboard/menu-history-1920.png)
- [Listas M3U](../screenshots/dashboard/menu-addons-1920.png)
- [Instalación en otro TV](../screenshots/dashboard/menu-share-1920.png)
- [Reproducción](../screenshots/dashboard/menu-playback-1920.png)
- [Filtro de adultos](../screenshots/dashboard/menu-parent-1920.png)
- [Pantalla](../screenshots/dashboard/menu-display-1920.png)
- [Diagnóstico](../screenshots/dashboard/menu-netdiag-1920.png)
- [Ayuda](../screenshots/dashboard/menu-feedback-1920.png)
- [Acerca de](../screenshots/dashboard/menu-about-1920.png)

Los paneles originales de cuenta, listas, filtro y pantalla usan ahora flujo de contenido y superficies grafito con foco blanco. Historial/favoritos conserva portadas verticales y puede desplazar todas sus filas. Se conservan los ajustes válidos y las explicaciones de idiomas disponibles. Compartir, Ayuda y Acerca de son informativos.

## Correcciones funcionales

- Scroll del catálogo calculado con `offsetTop`/`offsetHeight`, en lugar de alturas antiguas incompatibles con las portadas nuevas.
- Filtro de adultos conectado a guía, catálogo y portadas principales, incluyendo favoritos de TV y listas M3U por sus metadatos. No detecta contenido sin clasificación ni equivale a un PIN.
- Preferencia de audio conectada a HLS.js; subtítulos aplica la preferencia local al cambiar el interruptor. Consulta [la matriz de ajustes](SETTINGS-AUDIT.md) para los límites de AVPlay y las pistas externas.
- Columnas de ajustes y movimiento de foco independientes; se elimina el acceso a elementos ocultos.

## Validación

78 pruebas unitarias, prueba de navegador con reproducción HLS de muestra y recorridos específicos de los seis destinos principales y las diez secciones de ajustes. Capturas y límites en 1080p, 4K y panel 4K con viewport 1080p.

El CSS no usa desenfoque, fuentes remotas ni animaciones continuas. El catálogo mantiene su paginación y las seis portadas principales se solicitan de forma asíncrona. La fluidez y las pistas de señales reales requieren una comprobación en el TV.

Cambios preparados para revisión, sin publicar esta propuesta.
