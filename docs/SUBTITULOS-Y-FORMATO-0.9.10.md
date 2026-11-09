# Formato y fuentes de subtítulos 0.9.10

## Proporción del fotograma

mediaHealth conserva width/height y añade aspect con ratio, label, source=decoded-frame y embeddedBars=unknown. frameAspect calcula la relación usando las dimensiones que entrega HTMLVideoElement; reconoce relaciones cercanas a 16:9, 4:3, 21:9, 2.39:1, 2.40:1, 1.85:1, 2:1 y 1:1. Para otras medidas muestra la relación decimal. Sin dimensiones fiables no inventa una proporción. El reproductor VOD muestra la información en la barra inferior y el diagnóstico la conserva.

No se inspeccionan píxeles ni se utiliza canvas por fotograma: no se añade trabajo de análisis de imagen durante la reproducción. Un archivo 1920×1080 con una película panorámica y bandas negras codificadas sigue siendo un fotograma 16:9. No es posible deducir la imagen útil solo con width/height. La app no elimina bandas ni cambia automáticamente la escala; Normal conserva la proporción, mientras Pantalla completa puede recortar y los modos forzados pueden deformar. AVPlay puede no exponer las dimensiones por el elemento HTML; en ese caso se indica que no hay datos.

## Fuentes

Cuatro opciones: Sistema (Arial/Helvetica), Cine (Open Sans), Serif (DejaVu Serif) y Monoespaciada (Liberation Mono). Los tres archivos TTF y sus licencias están en app/assets/fonts. Se cargan localmente al seleccionar la fuente, sin solicitudes a Google Fonts ni otros proveedores. No se incluye ni se representa como propia la fuente Netflix Sans.

En Ajustes → Reproducción se guarda font en xuper_global_playback_v1. Durante una película/serie, Audio/subtítulos → Fuente guarda un valor acotado 0–3 en mediaPreferences[id].font dentro del perfil existente, con respaldo e IndexedDB. La elección por título tiene prioridad sobre la global y se aplica al volver a abrir, cambiar de episodio y reiniciar; otros títulos mantienen la global. La fuente se aplica a la capa de subtítulos externos, sin cambiar su contenido. No altera texto quemado en la imagen ni garantiza modificar subtítulos nativos no renderizados por la app.

Pruebas: 210 unitarias; fuentes cargadas realmente con document.fonts desde los TTF, familia aplicada al texto, selección con mando visible dentro del panel, persistencia tras reiniciar y pasar al siguiente episodio, aislamiento de otros títulos, audio multilenguaje MP4/TS y WebVTT. Recorrido de UX a 1080p, 4K y 720p. Se usan archivos propios de prueba; no es validación del portal ni de todos los firmwares Samsung.

El comando xt.vodEngine=doh no amplía el catálogo. Los totales declarados por las rutas del proveedor pueden incluir temporadas y colecciones solapadas y no representan títulos únicos verificados.
