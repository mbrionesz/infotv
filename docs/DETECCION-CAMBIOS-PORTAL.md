# Cómo saber si cambió el portal

No se ha identificado un endpoint fiable que declare la versión del servidor. apkVersion, apkVer y spkgVer/sysVersion de magis.js son identificadores enviados por el cliente: no demuestran una actualización del portal.

Los totales y su historial prueban solo que cambiaron las cifras declaradas por las consultas de catálogo. Un total igual puede contener títulos diferentes. Una releaseDate es el estreno del título; no es una fecha de incorporación salvo que el proveedor la identifique así.

Para detectar un cambio de protocolo se comparan respuestas de la misma ruta y sesión (campos y tipos), resultados de autenticación, códigos exactos y constantes de clientes de referencia. Un error de autenticación o de red aislado no prueba una actualización; tampoco se soluciona automáticamente igualando todos los números de versión.

La app conserva los valores de cliente de 0.10.17. No descarga ni ejecuta código nuevo del portal ni modifica magis.js automáticamente. Una corrección de compatibilidad requiere evidencia, pruebas y una versión de la app.

## Comprobación semanal desde 0.10.19

GitHub Actions (`check-portal-versions.yml`) revisa los clientes públicos los lunes y permite ejecución manual. Guarda únicamente `data/portal-client-watch.json`, con versiones, fuente, revisión y fecha. No conecta al portal ni cambia código de autenticación. Descarga fuentes y el paquete público Samsung con límites de tamaño y tiempo, sin ejecutarlos. Si falla una fuente, conserva su último dato legible con estado no comprobado. El programador de GitHub puede retrasar una ejecución.

La TV incluye un informe inicial y consulta el JSON público como máximo una vez cada siete días en segundo plano, fuera de reproducción y después del inicio. Solo descarga un JSON de alrededor de 1 KB, no APK/WGT. La fecha de consulta se conserva al reiniciar y hay un botón manual en Ajustes → Clientes de referencia. Las diferencias se comparan con los valores de magis.js incluidos al compilar esta app. Un cambio respecto al informe anterior se registra con fecha. No se ejecutan archivos de referencia ni se aplican sus valores.

Se mantiene la última información si no hay red. Un informe con más de siete días se identifica como antiguo. Borrar los datos de usuario desde el TV puede eliminar la fecha local de consulta. La interfaz permite desplazarse por todas las fuentes y no comunica al proveedor datos de reproducción o credenciales.
