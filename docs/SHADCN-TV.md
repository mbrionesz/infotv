# shadcn/ui para XuperTizen

0.10.19 beta.1 · adaptación visual para televisión, no instalación de React/Radix/Tailwind en el widget.

## Documentación revisada

- https://ui.shadcn.com/docs/theming — tokens semánticos de superficie/texto, bordes y estados.
- https://ui.shadcn.com/docs/installation/manual — dependencias e integración de Tailwind/React.
- https://ui.shadcn.com/r/themes/zinc.json — paleta Zinc oficial.
- Registry New York: Button, Card y Badge. Patrón de Tabs, Input y Sheet/Dialog aplicado a controles existentes.

`design/shadcn-tv.json` registra fuentes, tokens, licencia y adaptaciones. `app/css/shadcn-tv.css` es la capa local que aplica esas variables al DOM ya existente. La licencia MIT está incluida en `app/vendor/shadcn-ui-LICENSE.txt`.

Se mantiene el motor de navegación del mando: reemplazarlo por primitivas React cambiaría el foco y requeriría una migración más amplia. El componente React oficial no se presenta como instalado. La adaptación conserva variantes, estructura visual y pares semánticos del diseño.

## Compatibilidad y coste

Colores hexadecimales en lugar de OKLCH para Chromium 56; sin CSS moderno imprescindible, animaciones de foco, blur de fondo, nueva fuente remota, JavaScript de diseño ni solicitudes de componentes. Sombras estáticas. El nuevo stylesheet pesa aproximadamente 21 KB sin comprimir. El tamaño y tiempo del motor de reproducción no se cambian por este tema.

El vídeo AVPlay necesita un fondo transparente; se verificó que el tema no cubra esa superficie. Fuentes y colores de subtítulos siguen bajo control del reproductor. Selección persistente y foco del mando se distinguen. Las tarjetas de Seguir viendo son horizontales, con imagen sin deformación y metadatos debajo. No se inicia vídeo de vista previa en las portadas.

`magis.js` se conserva idéntico al de v0.10.17-beta.1 por solicitud del usuario. El diseño no cambia versiones de autenticación, DNS, búfer ni lógica de recuperación.

## Verificación

`tools/shadcn-design-browser.mjs` recorre Películas/Series, categorías, búsqueda, ficha, Ajustes, estadísticas, almacenamiento, TV y reproducción local. Pruebas de mando a 720p/1080p/4K, búsqueda integrada, categorías, ajustes, Seguir viendo y TV lateral. Los datos y títulos de las capturas son de prueba; no prueban conexión al portal real.
