# XuperTizen 0.5.6 alpha.1

Corrige el diagnóstico del parser y expone su motivo para investigar los cortes.
No cambia buffer, DNS, códecs ni la validación de HLS.js.

HLS.js puede generar errores de secuencia cuyo mensaje contiene dos listas M3U
completas. La clasificación anterior encontraba TARGETDURATION dentro del cuerpo
y podía asignar target-duration a un error distinto. Por tanto, los logs de
0.5.3–0.5.5 con esa categoría no prueban un fallo de dicha etiqueta. La corrección
conservadora de duplicados idénticos de 0.5.5 no intervino en las muestras del TV.

- Se clasifica por la primera línea del motivo y se distingue media-sequence-mismatch
  de discontinuity-sequence-mismatch antes de examinar etiquetas.
- playlistError.message conserva esa primera línea sanitizada: omite URL,
  parámetros sensibles, valores entre comillas, cabeceras de autorización y
  cuerpos adjuntos. No se expone el mensaje completo de HLS ni su stack.
- Cada resumen de lista tiene requestId, atMs, CDN, fase HTTPS, tipo de petición,
  estado HTTP si disponible, MEDIA-SEQUENCE y DISCONTINUITY-SEQUENCE. Se conserva
  playlistHistory con los ocho últimos resúmenes, sin cuerpos, URL o credenciales.
- Se ignoran callbacks tardíos de una ruta cerrada al construir ese diagnóstico.

El siguiente registro puede identificar si los números de secuencia y los
segmentos del servidor son inconsistentes. No se da por confirmada esa causa para
TNT Sports ni se afirma corregido el corte. No se ignoran errores del parser.

Validación: 56 pruebas unitarias y Chromium. Prueba HLS de 60 s con las incidencias
transitorias habituales. Después se inyecta, por separado, una lista con una
secuencia incompatible y se comprueba que HLS.js produce el error real, que su
clasificación no se confunde por TARGETDURATION y que se asocia a un requestId.
La prueba valida el diagnóstico de ese fallo estructural, no su recuperación.
Respuestas simuladas/adaptador HTTP local, sin prueba física Samsung de 0.5.6.
HLS/worker permanecen en 1.6.19. [Datos](benchmarks/live-continuity-v056.json).

En Debug, con el canal abierto o después del fallo:

```js
var p=XuperStandalone.diagnostics().player,g=XuperGuide.diagnostics();console.log(JSON.stringify({version:XuperStandalone.version,principal:{error:p.playlistError,listas:p.playlistHistory},guia:{error:g.playlistError,listas:g.playlistHistory}},null,2));
```

Los comandos anteriores de captura completa también incluyen los campos nuevos.
