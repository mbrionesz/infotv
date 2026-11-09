# Tres destacados y caché local

Películas y Series conservan cada una tres títulos. La primera carga fija una referencia con todos los identificadores presentes en las selecciones recibidas; no marca títulos ya existentes como recién incorporados. Posteriormente, un identificador no observado se añade delante y desplaza al destacado más antiguo. Un nuevo título deja dos anteriores; dos nuevos dejan uno. Reordenar la misma respuesta o reiniciar no cambia la selección. Una respuesta parcial no elimina las tarjetas anteriores. El historial de detección está acotado a 20.000 identificadores por sección.

La etiqueta «Detectado en esta TV» indica cuándo esta instalación observó por primera vez el identificador. No acredita la incorporación real al proveedor: un título antiguo que aparezca por primera vez en una selección también puede ser detectado. Mientras no se confirme el significado de una fecha del portal, no se etiqueta como fecha de incorporación. Para la selección inicial se informa que esa fecha no está disponible.

`xuper-carousel-v1` guarda las selecciones y una caché propia de imágenes y coincidencias. La poda del catálogo no la borra. Las seis tarjetas activas quedan protegidas frente a registros posteriores, con límites de 64 registros/16 MiB. Solo se consulta TMDB al no existir una coincidencia guardada; al rotar o reiniciar se reutilizan la coincidencia y los bytes de imagen. Cada imagen se descarga al mostrarse por primera vez. La vigencia es de 90 días, dentro del máximo de seis meses de los términos de TMDB; al caducar, borrar datos o recuperarse de errores puede ser necesario volver a consultar. No se promete almacenamiento perpetuo.

## Paquete personal

`tools/package-private-tmdb.py` permite crear un WGT personal desde el WGT público y un archivo local de credencial. No modifica el paquete público. Añade una configuración de una sola aplicación: guarda la clave localmente al primer arranque, pero respeta que el usuario la borre después. Una actualización pública posterior conserva la clave si se mantiene el almacenamiento del TV.

Este paquete contiene una credencial extraíble y no debe publicarse. Los archivos de credenciales y los paquetes personales se mantienen en `.local`, excluido de Git. El paquete público y GitHub no contienen esa credencial. No se genera un ZIP público con el paquete personal dentro.
