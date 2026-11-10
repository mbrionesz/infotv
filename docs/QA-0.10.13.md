# QA 0.10.13

Validación local con respuestas y medios de prueba; no equivale a una prueba prolongada del proveedor en Samsung.

296 pruebas unitarias aprobadas; pruebas de categorías, búsqueda, salida doble, audio/subtítulos, recuperación VOD y búfer aprobadas con medios/respuestas locales.

Cobertura: selección máxima 720p/1080p/4K por idioma, preferencias explícitas, recuperación de fichas y propagación de errores; categorías sin géneros y selección de 15 versiones; limpieza selectiva de metadatos; doble Atrás sin disparo por tecla mantenida, simulando API Tizen; reserva MP4/TS mientras está pausado y vuelta al perfil normal; recuperación de capítulos y persistencia de preferencias de audio/subtítulos.

Límites: el presupuesto de 32 MiB estima datos comprimidos, no la RAM total. Un bloque puede sobrepasar el objetivo temporal. AVPlay administra su búfer nativo. Cortos y recuperación BTV siguen como APIs bajo demanda, sin pantallas completas; getRecommends continúa sin validar y no se anuncia como ruta funcional. La consulta real del portal desde el entorno respondió portal100024.
