# Dos alternativas de navegación superior

Prototipos de diseño: **no se han aplicado al frontend de producción**. Comparten solo tres destinos: TV, Películas y Series. Ajustes queda en la tuerca superior derecha; su pantalla se pospone. El contenido, los minutos y las etiquetas 1080p de los prototipos son ejemplos; no representan disponibilidad de esos títulos o calidades en el proveedor.

Abrir `a.html` o `b.html` mediante un servidor local de la raíz del repositorio. Por ejemplo: `python3 -m http.server 8080`, luego `/docs/design-options-0.10/a.html` o `/docs/design-options-0.10/b.html`. También se puede usar `index.html?design=a&section=tv` y cambiar design/section. La demostración permite cambiar secciones, buscar, filtrar, abrir fichas y ver la organización de episodios. No reproduce fuentes ni consulta cuentas.

## A · Cinemática

Una imagen protagonista y dos acciones, seguidas de Seguir viendo en formato horizontal y colecciones del portal. Más visual, con menos controles iniciales. En TV prioriza una señal y una fila de canales; seleccionar abre pantalla completa. Películas y Series mantienen la misma jerarquía. Buena opción si se busca una apariencia cercana a Netflix y una experiencia sencilla con el mando.

## B · Biblioteca

Una cabecera compacta, una banda de Continuar, filtros visibles y un catálogo más denso. Películas usa mosaicos horizontales; Series, portadas verticales. En TV muestra categorías y una lista amplia de canales, sin una imagen protagonista. Prioriza encontrar un título concreto y recorrer más opciones por pantalla.

Las dos usan archivos locales, superficies simples, sin vídeo automático, blur, carruseles animados ni fuentes remotas. El prototipo verifica disposición a 1280×720, 1920×1080, 3840×2160 960×540, 1024×768 (4:3) y 2560×1080, pero no mide rendimiento físico de un Samsung. Son prototipos de navegador; al implementar se adaptarán las reglas CSS modernas y los diálogos a los motores Tizen compatibles. Al implementar se conservarán paginación, carga diferida de imágenes y los límites del catálogo existente.

## Qué permiten las rutas actuales

| Contenido que se puede mostrar | Rutas o datos actuales | Condición |
| --- | --- | --- |
| Filas editoriales y colecciones | `getNextColumns`, `v3/getColumnContents`, `v3/getShelveData` | Usar solo los nombres y colecciones realmente anunciados. No equivalen a tendencias o estrenos semanales. |
| Explorar el catálogo completo por páginas | `v3/getShelveData` para All; alternativa `v3/filterByContent` | Los totales son declaraciones del proveedor y pueden incluir temporadas o solapamientos. |
| Género y año | `v3/filterGenre`, `v3/filterByContent` | Los filtros de una colección se aplican dentro de sus páginas; no se cambia silenciosamente de raíz. |
| Buscar películas o series | `v3/searchByName` | Cada sección conserva su ámbito. |
| Sinopsis, reparto, temporadas y episodios | `v4/getItemData` | Mostrar campos disponibles; no inventar duración o sinopsis. |
| Versiones, idiomas y calidad para reproducir | `v10/startPlayVOD`, `v15/getSlbInfo`, alternativa `v14/getSlbInfo` | Mostrar versiones anunciadas. 1080p/4K, HDR o 5.1 no se deducen del nombre del título. |
| Reparto ampliado y títulos de una persona | `getPerson`, `getItemByPerson` | Rutas implementadas; acceso visible solo con datos válidos. No están verificadas para todas las sesiones. |
| TV, categorías y señales | `v6/getLiveData` / `v7/getLiveData`, `v4/startPlayLive` / `v5/startPlayLive` | Conservar favoritos y apertura directa con OK. |
| Programas recuperables | `getAllbackProgram`, `v6/startPlayBTV` | Reservado para una mejora condicional; no se promete programación o catch-up sin respuesta válida. |
| Seguir viendo, minutos restantes y Mi lista | Perfil local y duración conocida/estimada | No necesita una ruta extra. ≈ identifica una duración estimada. |
| Similares | Géneros del título + catálogo filtrado/local | Coincidencia real de género; no una recomendación aleatoria. |

`getHome` existe en el inventario, pero devolvió portal100023 en la TV y no es la base de estas propuestas. `getShortVideo` está implementada, pero no confirma que haya tráilers disponibles: no se muestran tráilers automáticos en las propuestas. `v3/snToken` y `v8/active` son autenticación, no fuentes adicionales de títulos. Tener 22 rutas implementadas no significa tener 22 catálogos distintos.

Las capturas usan datos de demostración. La consulta del proveedor desde este entorno fue rechazada anteriormente con portal100024; el diseño no convierte esa limitación en una promesa de contenido.

## Corrección independiente del panel de fuentes

El panel de audio/subtítulos ahora usa filas completas: fuentes y tamaños en dos columnas, colores en una fila y audio/idiomas con ajuste de línea. El cuerpo se desplaza verticalmente, con indicador de desplazamiento visible y botón Listo fijo. Las pruebas verifican cada opción y el recorrido horizontal/vertical del mando, además de carga y persistencia de las fuentes existentes.
