# XuperTizen 0.5.7 alpha.1

Recuperación específica para errores fatales media-sequence-mismatch y
discontinuity-sequence-mismatch en TV en vivo, confirmados en los logs del usuario.
HLS.js no puede combinar listas donde una misma secuencia se asocia a segmentos
incompatibles. startLoad por sí solo puede conservar los detalles anteriores.

- El primer desajuste fatal en una ruta destruye HLS y MediaSource, cancela
  sus cargas, mediciones y control de buffer, limpia el elemento de vídeo y crea
  una instancia HLS nueva sobre la misma URL con las mismas cabeceras.
- Espera 250 ms antes de abrir de nuevo (0 ms si conserva Pausa). Invalida la
  generación anterior para descartar callbacks tardíos. El vídeo puede recargar
  y saltar al directo; no se conserva el buffer incompatible.
- Solo se permite un reinicio específico por URL durante esa apertura. Si
  reaparece el desajuste en la misma ruta, se pasa al siguiente candidato. Las
  variantes HTTPS son rutas distintas; las cuatro alternativas originales
  siguen teniendo prioridad. Si se agotan, se informa inconsistencia de listas.
- La pausa explícita se conserva en reinicios y cambios de respaldo. El cierre
  o cambio de canal cancela el reinicio pendiente. Errores no fatales conservan
  la recuperación propia de HLS; no se desactiva su validación.
- El reinicio no consume ni reinicia el presupuesto de reintentos HTTP genéricos.
  Se conservan renovación única tras 404, límite inicial total de 30 s y plazo
  de apertura por candidato. Una renovación de resolución crea una nueva apertura.
- Diagnóstico añade sequenceRestarts, sequenceFailovers, sequenceRestartPending y
  sequenceRecoveryMs. Los eventos distinguen reinicio y repetición que lleva al
  respaldo. Los contadores describen la apertura actual.

Se mantienen HLS/worker 1.6.19, DNS, buffer 3/6 s, calidad/FPS y tipografía. Este
cambio no corrige el contenido que genera el proveedor, ni recupera una ruta 404.
Su objetivo es recuperarse sin repetir indefinidamente el mismo estado HLS.

Validación: 56 pruebas unitarias y Chromium. La prueba HLS de 60 s se amplía con
un desajuste real de secuencia: comprueba reinicio completo y reproducción en el
mismo candidato; después provoca recurrencia, exige cambio al respaldo con sus
credenciales, comprueba Pausa/reanudación y cancelación de un reinicio al cerrar.
Se conserva el diagnóstico sanitizado y la prueba de OK sin resolver otra vez.
Metadatos del portal simulados y adaptador HTTP local, no sockets/decodificador
Samsung. Prueba física de 0.5.7 pendiente; pueden persistir cortes si el proveedor
continúa sirviendo listas incompatibles. [Datos](benchmarks/live-continuity-v057.json).
