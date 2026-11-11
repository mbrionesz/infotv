# Estadísticas del catálogo

Ajustes → Estadísticas del catálogo muestra el total declarado de Películas y Series, fecha del último cambio y última comprobación. El ✓ verde confirma una respuesta completa en la sesión; no certifica títulos únicos ni disponibilidad de vídeo.

El JSON local `xt.catalogStatistics.v1` contiene versión, historial y última comprobación. Máximo cinco cambios (menos de unos pocos KB). Al sexto registro se eliminan los cuatro más antiguos y se conservan los dos últimos. Al actualizar desde el historial anterior se conservan los últimos cinco. Un total idéntico no añade filas ni cambia la fecha del encabezado. Subidas y bajadas quedan registradas; no se suman categorías que se solapan. El desglose se presenta cuando ambos totales están disponibles. Al reiniciar el estado es «Último dato guardado» hasta recibir respuesta. Si falla la consulta, se conserva el último total y se indica ausencia de actualización.

No guarda títulos, URLs, tokens ni respuestas completas del portal. Se conserva al limpiar caché; borrar los datos de la app desde el TV o desinstalar puede eliminarlo. Un fallo de almacenamiento se muestra y no bloquea la navegación.

El contador usa la misma consulta catalogFullPage que las pantallas de Películas y Series, una página de 36 títulos por sección en un worker. No inicia consultas durante reproducción, en Ajustes ni estando oculto. Una solicitud iniciada antes puede terminar en segundo plano; sus respuestas se ignoran tras cerrar o limpiar la sesión. Hay límite de espera, reintento al minuto tras fallos y periodo de 30 minutos tras éxito.

Pruebas: tests/catalog-statistics.test.mjs, tests/catalog-count-controller.test.mjs, tests/catalog-counter.test.mjs; tools/catalog-statistics-browser.mjs, tools/catalog-counter-browser.mjs y test:cache-cleanup. El proveedor se simula en las pruebas de interfaz.
