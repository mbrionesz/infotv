# Almacenamiento, idiomas y contador

Incluido en 0.10.14 beta.

## Por qué pueden aparecer unos 10 MB

La caché administrada por la app guarda metadatos y portadas. Los bytes de reproducción MP4/TS/HLS no se escriben en estas bases IndexedDB. El indicador de Samsung puede incluir otros datos del runtime; no se ha medido el reparto exacto en el TV del usuario.

Antes, los presupuestos de caché eran 16 MiB de metadatos, 18 MiB de portadas y 16 MiB de arte de carrusel. Llegar a 10 MB no demuestra corrupción ni falta de RAM. Borrar los datos también reinicia estado y sesiones: que mejore después no prueba cuál fue la causa.

El historial ya es JSON: hasta 30 títulos, con último episodio, temporada, posición y estado de finalización; cada marca TS contiene un punto de recuperación pequeño, no el capítulo ni el índice completo. Es un historial del último episodio por título, no un registro ilimitado de todos los capítulos vistos. Favoritos y preferencias usan una base separada y copias de respaldo.

## Problemas y correcciones

- La apertura y transacciones de caché no tenían límite temporal. Una operación bloqueada podía dejar esperando catálogos/carrusel. Ahora vencen, devuelven una ausencia de caché y la app continúa; una transacción atascada desactiva esperas posteriores de esa caché durante la sesión.
- Las respuestas de metadatos esperaban a que terminara su escritura persistente. Ahora la escritura se realiza después sin retrasar la respuesta al usuario.
- El recorte de caché retenía registros completos en memoria y podía contabilizar registros caducados contra el presupuesto. Ahora conserva solo metadatos pequeños durante el recorte y cuenta únicamente registros retenidos.
- Nuevos presupuestos: metadatos 3 MiB/64 registros; portadas 6 MiB/48; carrusel 6 MiB/48. Se recortan también datos antiguos al iniciar. No son límites de RAM ni del indicador total de Samsung, ni garantías exactas de ocupación física del motor IndexedDB.
- El arte TMDB del carrusel usa su caché dedicada y evita una segunda copia persistente en la caché general de portadas.
- Las escrituras IndexedDB de progreso se agrupan: si hay cambios pendientes mientras se guarda, permanece la instantánea más reciente. Se conservan las copias de respaldo y el historial.

La limpieza de metadatos al salir con doble Atrás de 0.10.13 continúa. No se borran favoritos ni progreso para reducir caché. Los datos de recuperación/imagen no se confunden con la autorización de reproducción, que sigue siendo temporal.

## Idiomas

El valor predeterminado de audio ahora expresa explícitamente Español latino. Se prioriza esa variante cuando está identificada y la máxima calidad dentro de ella. Si no existe una variante marcada latino, se admite español disponible sin atribuirle un acento no declarado. Las selecciones manuales guardadas se conservan.

Los subtítulos priorizan latino cuando está identificado; por defecto siguen apagados si hay audio español. La selección manual guarda además del idioma el nombre de variante, para distinguir dos pistas con código `es`. Se corrige la interpretación de nombres como Español (España), que podían quedar como español genérico.

No hay evidencia nueva de subtítulos forzados reales del proveedor. La app solo muestra esa marca si la respuesta la trae explícitamente; no se crea una opción ni se infiere por el nombre de archivo.

## Contador bajo el logo

Muestra `X títulos informados · DD/MM` debajo de by Matias. X es la suma de los totales declarados de las raíces de Películas y Series, no de categorías/plataformas repetidas. La consulta pide una página de un elemento por raíz; no descarga miles de fichas ni utiliza TMDB. Se inicia después de la interfaz, solo desde portada, y se renueva como máximo cada 30 minutos. Mientras hay reproducción no se inicia una consulta nueva.

No es un censo verificado de títulos únicos de todo el portal: las raíces adicionales Infantil/Anime y colecciones pueden solaparse, y un servidor puede limitar su contador. El tooltip identifica el alcance. Sin ambos totales válidos conserva el último valor y su fecha, o muestra sin conteo; no inventa cero ni actualiza la fecha con consultas fallidas.

## Comprobaciones

Pruebas unitarias de IndexedDB bloqueado, transacciones atascadas, poda por presupuesto, progreso más reciente, preferencia latino y manual España, y conteos parciales/completos. Prueba de navegador con base de carrusel intencionalmente bloqueada y contador visible en 720p/1080p/4K. Regresiones de audio MP4/TS, subtítulos, historial y recuperación con fuentes locales.

No se confirmó la causa del incidente de la TV ni el universo actual del portal desde este entorno. No se afirma que 10 MB de datos persistentes fueran la causa del fallo de reproducción.

## Limpieza manual desde Ajustes

Nuevo panel Almacenamiento, con botón «Limpiar caché y reiniciar» y explicación de qué se conserva. Guarda la biblioteca antes de actuar; si no puede guardarla, no limpia ni reinicia. Elimina metadatos/portadas de la caché general y arte/estado temporal del carrusel, e invalida escrituras antiguas para que respuestas pendientes no vuelvan a poblarla. No utiliza localStorage.clear ni elimina la base de perfiles. Conserva historial, progreso, favoritos, idiomas, ajustes, clave TMDB y configuración de DNS. El pequeño contador se vuelve a consultar.

Si alguna caché no puede borrarse dentro del tiempo previsto, informa limpieza parcial y reinicia servicios; no afirma un borrado completo. La app se recarga para liberar conexiones y cachés en memoria. El indicador de almacenamiento físico de Samsung puede tardar en reflejarlo y volverá a aumentar con el uso normal.

309 pruebas unitarias aprobadas. Prueba de navegador del botón real, en 720p y 4K, con recarga y comprobación de caché vacía, favorito guardado, progreso de episodio y favorito de canal conservados. El televisor real sigue pendiente de validación.
