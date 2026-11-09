# Afinado después de 0.10.0

## Carrusel e imágenes

Avance automático cada ocho segundos, con un único temporizador cancelable. Usar el control o pulsar un botón reinicia la espera. No se mueve el foco ni se resuelven señales. El avance se pausa al bajar por las filas, abrir el teclado/filtros, enfocar las flechas manuales, ocultar la app o solicitar movimiento reducido. El temporizador se elimina al suspender o cerrar el catálogo. Al volver se crea uno nuevo. Una imagen todavía descargándose impide acumular nuevos avances.

Se prioriza `stage` sobre `poster` para el destacado; se verifica la proporción de la imagen descargada para mostrar completa una portada vertical. Las miniaturas siguen bajo demanda. Esto mejora la selección y el encuadre, no crea detalle HD si el proveedor no lo entrega. TMDB sigue siendo la alternativa propuesta para fondos HD, pendiente de configurar su clave y atribución; no se implementa scraping ni se inventan coincidencias por título.

Evaluación UX: la jerarquía de tres pestañas y el foco visible son una mejora. Los puntos pendientes son la uniformidad/calidad de fondos del proveedor, nombres largos de colecciones y el aprovechamiento del destacado cuando solo existe una portada vertical. Las filas deben conservar su posición y la rotación no debe interrumpir una selección con el control. Estas conclusiones proceden de inspección y pruebas locales, no de un estudio con usuarios ni del firmware Samsung.

## Comparación LG

Revisada la rama principal de [XUPER-HYDRA-PORT-WEBOS](https://github.com/cristianco7/XUPER-HYDRA-PORT-WEBOS/tree/cb2391987f4414a5bce82b2b784113b992795812), commit `cb2391987f4414a5bce82b2b784113b992795812`.

En `webos/services/com.webosflux.xuptertv.fidelity.service/magis.js`, el servicio descarga un pool al arrancar tras dos segundos. Comprueba cada 15 minutos si quedan pocas semillas o han pasado tres horas. `seedStatus` informa del último error. Las semillas se usan con `adoptSeed` para adoptar datos de sesión; no son DNS, hosts adicionales ni búfer.

Nuestro `tools/build-standalone.mjs` desactiva expresamente la descarga de sesiones prestadas. Se conserva la renovación automática de la propia sesión ya existente. No se añade un botón que afirme actualizar semillas cuando esa operación no está habilitada. Actualizar semillas tampoco repara códecs, segmentos ausentes ni un servidor que devuelve 404.

## VOD

MPEG-TS mantiene stash de 128 KiB y umbrales de descarga de 25/10 segundos. AVPlay y HLS mantienen sus parámetros. En MP4 se mantiene el máximo de 25 segundos, adaptado al presupuesto existente de 16 MiB según tamaño/duración, y el límite de cola de 8 MiB. Se añade histéresis: tras llenarse, la descarga espera al 60% del objetivo (máximo 15 segundos) para reanudarse. Al buscar otra posición se reinicia esta espera. No aumenta la resolución, el ancho de banda contratado ni arregla errores del proveedor.
