# XuperTizen 0.10.11 beta

- Ajustes: corrige acciones duplicadas por clic en menor retraso, subtítulos, TMDB y Diagnóstico.
- VOD: un reintento forzado solicita autorización nueva aunque haya una consulta anterior pendiente; las respuestas antiguas no sobrescriben la caché vigente.
- Subtítulos: conserva la elección manual de pista completa frente a una forzada del mismo idioma.
- TV: conserva respuestas de canales y categorías mientras la guía está oculta, descarta categorías de una apertura anterior y cancela cambios diferidos al ocultarse.
- TV: reintenta una selección de audio/subtítulos rechazada temporalmente hasta que el reproductor la acepte.

Mantiene DNS, servidores, perfiles de buffer y las funciones anteriores. 268 pruebas unitarias y pruebas locales de Ajustes, guía TV, continuidad VOD y audio/subtítulos aprobadas. Pendiente comprobar en Samsung real y con el proveedor. El WGT se firma al instalarlo con Apps2Samsung.
