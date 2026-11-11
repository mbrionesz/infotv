# Recarga VOD e historial: 0.10.17 beta

## Historial

Se migra el JSON existente a los cinco últimos cambios al cargarlo. No añade entradas para un total idéntico. Al sexto cambio elimina los cuatro más antiguos y conserva los dos últimos. Mantiene la última comprobación separada de la fecha del cambio.

## Conteo

`catalogTotals` usa `catalogFullPage`, exactamente la consulta compartida con las secciones Películas y Series, sin filtros, página 1 de 36 títulos y actualización fresca. Suma ambos `total` solo si ambos `totalKnown` son verdaderos. La ruta compartida utiliza `catalogBrowse`, «All/Todos» y `v3/getShelveData` (`assetListTotalSize`), con alternativa `v3/filterByContent` (`totalSize`). No es un censo de títulos únicos y no puede corregir un total limitado que declare el proveedor. No se recorren miles de páginas ni se suman géneros solapados.

## Recarga en reproducción

La reserva normal objetivo es MP4 80 s con recarga a 60 s y MPEG-TS 72 s con recarga a 55 s. El presupuesto estimado de datos comprimidos sigue en 16 MiB durante reproducción y 32 MiB en pausa; a mayor bitrate se reducen automáticamente los segundos. TS sin tasa conocida conserva un objetivo conservador de 25 s. La reserva de pausa sigue hasta 300 s cuando la tasa y el presupuesto lo permiten. No aumenta el tiempo obligatorio de espera inicial.

La salida con doble Atrás, en la raíz de una sección, reutiliza el limpiador: checkpoint, guardado confirmado del perfil, limpieza de caché de metadatos y portadas/carrusel y cierre de recursos. Si no se pudo guardar la biblioteca no cierra para evitar pérdida. Conserva progreso, favoritos, estadísticas, conteo y preferencias; no borra los datos personales de la aplicación.

No acelera el servidor ni garantiza que todos los cortes se resuelvan. La prueba de navegador confirma descargas adicionales sin pausar tanto en MP4 como en TS, además de la reserva en pausa y controles. Diagnóstico `player.vodLastRead` añade bytes, elapsedMs y throughputKbps del último bloque; no es la velocidad total de internet.

La ruta AVPlay ya se intenta y puede caer a MSE/MP4Box o MPEG-TS cuando el transporte, formato o cabeceras lo requieren. Un relay externo con FFmpeg es otra arquitectura posible, pero requiere servicio adicional y no es parte de este cambio. Un widget web no incorpora el servicio Node/FFmpeg de webOS por copiarlo.
