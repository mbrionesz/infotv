# QA 0.10.17 beta

- 336 pruebas unitarias aprobadas.
- Transporte Samsung WASM: TLS, Host/SNI y los 17 resolutores DoH por IP aprobados.
- Navegador: MP4 y MPEG-TS descargan más datos mientras reproducen; ambos acumularon más de 285 s en pausa, manteniendo inmóvil el reloj. Controles verificados en 720p, 1080p y 4K.
- Doble Atrás por eventos del mando: limpieza temporal, una llamada de salida Samsung simulada y recuperación de favoritos, progreso y estadísticas al reabrir.
- Historial: cinco registros al migrar y dos al llegar el sexto cambio; navegación y reinicio aprobados.
- Una ejecución de reproducción falló al reanudar MPEG-TS cerca de 95 s con MediaError 3. La repetición superó ese caso. No se ha identificado la causa de ese fallo inicial ni se afirma que todos los bloqueos estén resueltos.

Las pruebas usan fuentes locales y proveedor simulado. No equivalen a una sesión prolongada en el Samsung del usuario. La reserva es un objetivo: con bitrate alto los presupuestos de 16/32 MiB reducen los segundos. El decodificador y otros recursos consumen RAM adicional. AVPlay gestiona su propio búfer.
