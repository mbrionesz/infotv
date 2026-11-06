# XuperTizen 0.5.4 alpha.1

El log físico de 0.5.3 identifica errores de listas clasificados target-duration
y un hueco entre 40,267 y 45,321 s de vídeo almacenado. También registra waiting
con unos 10 s de buffer, seguido de pausas internas. El control añadido en 0.5.3
pausaba indiscriminadamente; la recuperación de huecos de HLS no progresa del
mismo modo cuando el vídeo está pausado. Además, AbortError en play interno podía
dejar bloqueado el controlador de buffer.

- Se deja waiting a HLS cuando hay un rango posterior al hueco, ya se cumplen
  aproximadamente 6 s de buffer o está pendiente el play nativo. No se realiza
  un seek manual ni se inventan timestamps/segmentos. handling indica la decisión.
- Un AbortError interno puede reintentarse hasta tres veces. La pausa explícita
  del usuario y el cierre siguen cancelando las esperas y la reanudación.
- Se mantienen objetivos 3/6 s para arranque y escasez real de datos, con las
  salidas acotadas para ventanas cortas de 0.5.3. Se mantienen HLS/worker 1.6.19,
  cuatro candidatos y renovación única de URL ante 404.
- Se limpia el estado del gate al cerrar/cambiar la ruta para no mostrar buffer
  antiguo como estado actual del controlador.
- El loader guarda hasta ocho resúmenes de listas en memoria: tamaño, cabecera,
  número de segmentos, presencia/valor de TARGETDURATION y estado HTTP si está
  disponible. Se asocian al error del parser. No se guardan cuerpos ni se exponen
  URLs, licencias o tokens en ese diagnóstico.

El registro anterior clasificaba target-duration, pero los campos de texto eran
nulos: no prueba por sí solo si faltaba la etiqueta o su valor era inválido.
Esta versión permite verificarlo. Los dos últimos CDN del log devolvían 404;
esta corrección no crea señales que el servidor no ofrece ni garantiza que
resuelva los fallos de lista del proveedor.

Validación local: 49 pruebas unitarias, incluida la geometría del hueco del TV,
waiting con buffer suficiente y recuperación de play interrumpido. Integración
Chromium y 60 s de HLS cifrado con ventana deslizante, lista sin TARGETDURATION,
fallos HTTP y recuperación sin cambiar de CDN. El diagnóstico identifica la
etiqueta ausente con longitud real de respuesta. Metadatos del portal simulados
y adaptador HTTP local; sockets y hardware Samsung no probados en esta versión.
Prueba física pendiente. [Datos](benchmarks/live-continuity-v054.json).
