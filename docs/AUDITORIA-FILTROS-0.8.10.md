# Revisión general de controles del catálogo

La 0.8.9 corrigió el regreso a la portada ante errores de categorías; no fue una comprobación de cada opción real del proveedor. La 0.8.10 revisa el contrato completo de categorías/género/año/país y añade verificación en la sesión del televisor.

## Cambios

Los metadatos de filtros podían contener `{key, value}`; se conservaba el código pero se perdía su etiqueta y un cero se descartaba al evaluar truthiness. Ahora cada valor se representa como texto o `{id,name}`, preservando cero, código y etiqueta separados. La interfaz ya envía el valor del option; muestra el nombre del registro. No traduce el nombre visible de una categoría a una supuesta consulta por país.

Antes, una categoría elegida borraba género/año/país y deshabilitaba esos controles. Ahora las selecciones se conservan y se combinan explícitamente: una categoría sola puede usar getShelveData con fallback; una categoría con filtros utiliza filterByContent con su mismo columnId y tags/year/originalCountry. Si el servidor rechaza la combinación, se mantiene la selección y se muestra el error. Nunca se la sustituye por un estante sin filtrar. Buscar por texto mantiene su modo propio; los filtros que ese endpoint no confirma se deshabilitan, sin simular combinaciones. Resolución sigue siendo un filtro de la página visible, claramente indicado.

Las entradas IndexedDB de métodos catalog* llevan una nueva revisión de clave para evitar que los registros anteriores oculten las etiquetas o los resultados nuevos. Los reproductores, resolución de señales, DNS y certificados no cambian.

## Verificación automática

Una matriz recorre cinco raíces, sin categoría y con dos categorías, ocho combinaciones de género/año/país y dos páginas: 240 casos. Comprueba endpoints, categoría, página y cada parámetro. Otras pruebas cubren rechazo sin fallback sin filtrar, metadatos id/etiqueta/cero, validación de categorías y auditorías truncadas/canceladas. La prueba de interfaz cambia entre años, combina los cuatro controles y comprueba las etiquetas mostradas y los valores enviados. Los datos de estas pruebas son simulados; no prueban disponibilidad o exactitud de títulos del proveedor.

## Verificación real desde Apps2Samsung

Con la 0.8.10 instalada, deja la app en Principal y ejecuta uno a la vez:

```js
XuperStandalone.auditCatalog("series")
XuperStandalone.auditCatalog("movies")
```

La herramienta obtiene categorías y opciones actuales de género/año/país, consulta la primera página de cada opción individual y combinaciones representativas, secuencialmente, omitiendo la caché de catálogo para obtener respuestas nuevas, y sin resolver/reproducir contenido. No es el producto cartesiano de todas las opciones reales ni recorre todas sus páginas. Presupuesto predeterminado: cuatro minutos y 500 consultas; un límite alcanzado se presenta como incompleto. No se ejecuta al abrir la app, solo bajo esta llamada.

Cada XT_CATALOG_OPTION indica respondió, sin resultados o error. XT_CATALOG_AUDIT resume cobertura y errores. `complete` indica que se terminaron las consultas previstas, no que no hubiera errores o que los títulos sean correctos. No registra tokens, licencias ni URLs de vídeo. Una página vacía no se declara fallo por sí misma. La exactitud semántica de un resultado necesita contrastar los títulos y sus metadatos; la herramienta no la certifica.

Detener: `XuperStandalone.cancelCatalogAudit()`. La solicitud en curso termina o agota su tiempo; no se inicia otra. Recuperar el estado: `console.log(JSON.stringify(XuperStandalone.catalogAudit(),null,2))`.

El entorno de desarrollo recibió portal100024 al activar una sesión anónima nueva. No puede certificar aquí cada opción real; el resultado del televisor permite identificar las que aún requieren adaptar parámetros o endpoints.
