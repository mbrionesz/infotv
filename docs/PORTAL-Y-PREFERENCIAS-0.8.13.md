# Portal y preferencias VOD

## Evidencia y límites

Se intentó consultar el portal con sesión invitada propia, por el proxy configurado, sin reutilizar sesiones prestadas ni activar hosts nuevos. La activación devolvió portal100024: región rechazada. No se pudo obtener una muestra actual de getItemData/startPlayVOD. No se concluye que un campo exista en todos los títulos porque lo contemple el parser.

El adaptador actual contempla:

- getItemData/assetData: título, sinopsis, director, reparto, puntuación, año/fecha, país, géneros, alias, lema, portadas y fondos, duración, quality/resolution, contador de episodios y temporadas.
- simpleProgramList: número, nombre, duración, calidad, imagen y descripción del episodio. sameSeasonSeriesList relaciona temporadas.
- startPlayVOD: audioInfo, subtitleList, variantes de vídeo con encodeFormat, videoFormat, quality y duración. Se contemplan altura, bitrate y fps cuando vienen expresados. No hay evidencia nueva de códec de audio, número de canales, HDR o tiempos de intro.

La calidad declarada por el portal se distingue de la resolución/códec observados durante reproducción. No se infiere 4K, HDR ni 5.1 por nombre. `XuperStandalone.auditVodMetadata()` permite una consulta explícita desde la sesión que funciona en el TV y devuelve campos permitidos del adaptador y del reproductor, sin transporte/sesiones. Los campos desconocidos descartados por el parser no aparecen; esto no es un volcado completo de la respuesta original. La herramienta tools/audit-vod-metadata.mjs intenta además listar nombres de campos originales, pero quedó bloqueada en activación.

## Política y persistencia

Valor inicial: audio español (prioridad latino, luego español genérico/España), subtítulos en modo automático y apagados con audio español. Si existen pistas identificadas y ninguna española, se seleccionan subtítulos del idioma configurado si están disponibles (español inicial). Audio desconocido no demuestra que falte español. Sin subtítulos disponibles no se traducen ni crean pistas.

La elección manual se guarda inmediatamente en el perfil local por ID raíz de la película/serie, compartida por sus episodios. Se guardan idioma y variante de audio, estado e idioma de subtítulos, no URL ni índice de pista. Máximo 200 títulos; una preferencia ausente cae en la global. El cambio manual del título prevalece sobre ajustes globales. Los cambios no alteran las preferencias de otros títulos. Las preferencias antiguas no distinguían un ON explícito del ON de fábrica: al migrar se establece automático, conservando tamaño/color e idioma de audio guardados.

El fallo de una descarga de subtítulos no provoca reintentos infinitos por la comprobación periódica. La selección de audio manual HLS tiene prioridad en futuras actualizaciones de pistas dentro de la sesión. No se modifica DNS, C++, certificados, transporte ni reglas de TV en vivo.

## Validación

Pruebas unitarias de políticas, español/ausencia/idioma desconocido, prioridad manual y variante de audio con orden distinto. Integración Chromium con vídeo y audio decodificados: español latino inicial sin subtítulos, activación manual, selección portuguesa, reinicio, siguiente episodio con la pista portuguesa movida de índice, restauración de subtítulos, otro título con valores iniciales, archivo solo portugués con subtítulos automáticos, apagado manual y reinicio. Se conservan pruebas de tamaños/colores, reanudación avanzada, series, menús y reproducción HLS. Fuentes propias de laboratorio; pendiente probar en el Samsung y contenidos reales.
