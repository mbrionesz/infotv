# Auditoría VOD posterior a 0.10.9

Revisión del código, pruebas de regresión y reproducción con archivos locales; sin sesión del proveedor ni acceso al hardware Samsung.

## Correcciones

1. Respuestas antiguas de mediaInfo: tras reiniciar servicios, una respuesta de la petición anterior para el mismo título podía consumir los callbacks nuevos y guardar metadatos obsoletos. Se comprueba la identidad de la lista de peticiones pendientes antes de aplicar la respuesta.
2. Error definitivo MP4: el finally del lector y el intervalo podían seguir programando trabajo después de notificar un error. Se añade estado de fallo único, cancelación de lector/temporizadores y protección de callbacks. La liberación final sigue disponible aunque el lector haya fallado.
3. MPEG-TS tras otra lectura: un EOF confirmado anteriormente podía permanecer activo al abrir otro rango. Se reinicia el detector de final y la histéresis de lectura al abrir el nuevo rango; solo otro EOF confirmado permite completar la reproducción.

## Pruebas

262 pruebas unitarias aprobadas, incluidas regresiones específicas de las tres correcciones. Compilación completada. Reproducción MP4/MPEG-TS y continuidad de episodios comprobadas con los scripts test:vod y test:vod-recovery; fuentes locales y proveedor simulado.

No se aumentó el buffer ni se modificó TV en vivo, los DNS o el orden de calidades. No se afirma ausencia total de bugs ni estabilidad del proveedor. Validación Samsung y sesiones largas reales siguen pendientes. Correcciones preparadas para 0.10.10 beta.

## Subtítulos forzados

No se encontró una API independiente de textos en pantalla en la copia XuperMH revisada. startPlayVOD ya devuelve subtitleList. Se conserva nombre y forced/isForced si existen en la entrada o su primer archivo; no se interpreta un idioma, nombre de archivo o campo type desconocido como prueba de subtítulos forzados. La marca permite identificarlos en el selector y en auditVodMetadata; se conserva la elección por título. No cambia la activación automática. No se ha confirmado un título real que entregue estos campos. Si la traducción viene incrustada en el vídeo, no es una pista desactivable.
