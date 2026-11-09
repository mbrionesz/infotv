# TMDB preconfigurado en el widget público

Desde 0.10.3, el propietario autoriza incluir su clave TMDB en el WGT público. La variable de compilación `XUPER_TMDB_PUBLIC_KEY` se proporciona exclusivamente al empaquetado. Cuando los permisos permiten configurar el secreto de Actions homónimo, el flujo puede utilizarlo. `tools/tmdb_provision.py` añade `js/tmdb-default.js` al widget compilado; no edita los archivos fuente de la app. Los hashes y la copia del WGT dentro del ZIP se generan después de añadir la configuración.

Un secreto de compilación evita guardar la clave en el historial del código; no la oculta dentro del WGT distribuido. Cualquiera que descargue el widget o el ZIP con el widget puede extraerla.

La primera ejecución configura la clave predeterminada si no existe una propia. La marca de provisión evita reactivarla en cada reinicio si el usuario la desactiva. Las claves ya guardadas se conservan. El carrusel mantiene tres títulos por sección, caché local de metadatos/imágenes y espera ante limitación de TMDB.

Una compilación local sin esa variable sigue generando un widget sin clave preconfigurada. El flujo público exige el secreto cuando publica automáticamente. Con `publish_artifacts=false` ejecuta la verificación sin publicar: el mantenedor puede empaquetar localmente con la variable y publicar los artefactos después de comprobar el resultado de CI. La conexión utilizada para 0.10.3 no permite crear secretos de Actions (HTTP 403), por lo que esa versión usa este último procedimiento.
