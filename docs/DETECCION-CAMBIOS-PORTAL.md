# Comprobación interna del portal

Corrección incluida en Tizen 0.10.20 beta y Windows 0.1.1 beta: se retiró el monitor de clientes externos por aclaración del usuario. La tarea GitHub Actions que consultaba otras apps fue desactivada. El código de consulta de GitHub, sus datos y su workflow se retiran de la app.

Ajustes → Estado del portal usa directamente `catalogFullPage` para Películas y Series, con actualización fresca, una página de un título por sección y la sesión/transportes existentes. Revisa cada siete días en la app cuando está abierta y fuera de reproducción; tiene botón manual y guarda la fecha local. No consulta otros clientes o repositorios.

Las rutas subyacentes son v3/getShelveData y v3/filterByContent según la colección del catálogo. El panel muestra respuesta, total informado, ruta y códigos de error. No se identificó un endpoint confirmado que publique la versión del servidor. `apkVersion`, `apkVer` y `spkgVer/sysVersion` son los valores enviados por nuestro cliente y se etiquetan así. La app no inventa ni cambia esos valores.

Un cambio en el total demuestra un cambio en esa cifra declarada, no una actualización de la API. Un total igual puede contener títulos diferentes. Los errores de red/autenticación tampoco prueban por sí solos una actualización del servidor. Para conocer futuras versiones exigidas por el portal es necesaria una respuesta o ruta verificada que las declare; la consulta de catálogo no proporciona esa información en el modelo actual.

La 0.10.19 beta.1 ya instalada conserva su monitor anterior hasta instalar una versión corregida. Desactivar el workflow remoto impide nuevas consultas a otras apps por ese proceso, pero no cambia el código de una instalación existente.
