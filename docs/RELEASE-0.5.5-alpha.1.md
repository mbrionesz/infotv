# XuperTizen 0.5.5 alpha.1

Añade información técnica del canal, letra más pequeña en la guía y Quad9.
El nuevo log de TNT Sports de 0.5.4 muestra respuestas HTTP 200 con cabecera M3U,
seis segmentos y TARGETDURATION:5 durante errores clasificados target-duration.
No confirma ausencia de etiqueta ni bloqueo DNS. HLS.js 1.6.19 también rechaza
TARGETDURATION repetido; se investiga esa posibilidad sin darla por demostrada.

## DNS

Se añaden 9.9.9.9 y 149.112.112.112 de Quad9, verificadas contra sus direcciones
oficiales y endpoint https://dns.quad9.net/dns-query. Son ocho direcciones de cuatro
proveedores. WASM recompilado para conectar por IP conservando Host/SNI, CA y
verificación TLS. Carrera, caché, cooldown y límite global de 5 s se mantienen.
No se promete que resuelva fallos de manifiestos o servidores 404.

## Información y guía

La vista previa y la barra de información de pantalla completa muestran dimensiones
reales del vídeo, códecs H.264/HEVC/AAC/etc. y FPS cuando hay datos. Los FPS de
la variante HLS se etiquetan declarados. En su ausencia, requestVideoFrameCallback
permite medir diferencias de presentedFrames entre muestras, con una solicitud
por cada muestreo de salud (~2 s), sin un bucle JS por fotograma. La medición es
cadencia de presentación aproximada y puede variar por pausas/carga; no equivale
a FPS nominales del archivo, captura HDMI o sincronía audio/vídeo. No se deduce
progresivo/entrelazado solo de la altura. Sin API/datos se muestra FPS sin datos.
No se altera la cadencia ni se convierte el códec. API y resultados reales de
cada firmware Samsung pendientes; AVPlay puede no exponer estas métricas.

Las filas de canales de la guía pasan de 19 a 16 px manteniendo altura y foco
para el mando. La información aparece en la guía y al mostrar la barra del vídeo.

## Listas HLS

El loader conserva conteo de TARGETDURATION y distingue errores de ausencia,
duplicado o posición cuando el parser aporta ese motivo. Solo elimina repeticiones
de TARGETDURATION con un mismo valor entero positivo y una única cabecera M3U,
sin múltiples MEDIA-SEQUENCE. Mantiene la primera etiqueta, segmentos, direcciones
y credenciales intactos. No repara valores contradictorios, concatena listas,
inventa etiquetas ausentes ni desactiva la validación de HLS. playlistRepairs
indica cuántas etiquetas idénticas eliminó. Este caso aún no se confirma para la
señal real; si el fallo tiene otra causa, requiere el nuevo diagnóstico.

## Comprobaciones

54 pruebas unitarias; Chromium con calidad técnica real y fuente de canales de
16 px, reproducción, controles y recuperación. Prueba de 60 s con FPS medidos,
listas duplicadas normalizadas y listas sin TARGETDURATION reintentadas, además
de 404/503 y caída temporal de lista. Metadatos simulados y adaptador HTTP local:
no representa el transporte ni decodificador Samsung. Datos en
benchmarks/live-continuity-v055.json. HLS/worker siguen en 1.6.19. Prueba física
pendiente; SDK nativo antiguo experimental sin cambios en su validación TLS.
