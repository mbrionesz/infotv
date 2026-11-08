# Verificación 0.8 beta

El reporte de la 0.7 en QN70F describe congelación tanto en vista previa como en pantalla completa. No se tiene acceso remoto a ese TV. Las pruebas de Chrome no certifican el decodificador Samsung ni la disponibilidad del proveedor.

Se corrigieron dos condiciones reproducibles en el código compartido: pausar desde `waiting` podía impedir la reparación de huecos HLS; el watchdog ignoraba indefinidamente la ausencia de avance si quedaba un buffer parcial. Ahora mantiene el reloj disponible para HLS, distingue pausa explícita, limita recuperación y cambia de ruta al agotar el presupuesto. Las pruebas cubren buffer vacío, parcial, pausa voluntaria y salida del reproductor con respuestas tardías. También se corrigió el foco al cerrar la guía después de reproducir: podía quedar sobre controles ocultos del reproductor e impedir navegar en Principal. Se comprueba Volver dos veces y flecha derecha hasta Películas. La causa completa del bloqueo en hardware sigue pendiente de confirmación.

La guía utiliza un solo reproductor, al abrir pantalla completa; OK no pasa por una resolución y reproducción de vista previa adicionales. La navegación conserva la selección al volver. Favoritos se guardan con → y OK; la búsqueda está en cabecera y el diagnóstico en Ajustes.

Se incluyen la auditoría de seguridad y el transporte moderno documentados en AUDITORIA-UX-SEGURIDAD-0.7.md y TRANSPORTE-MODERNO.md. El test del WASM enlazado verifica TLS/Host/SNI y las ocho rutas DoH por IP mediante sockets simulados locales, sin sustituir el ensayo en firmware.

Verificación local: 90 pruebas unitarias; prueba integral HLS AES-128 y renovación 404; VOD MP4/TS/1080p con audio y búsqueda; recorrido UX de 33 capturas a 1080p/4K, incluyendo vuelta desde TV; auditoría de 19 capturas y ataques de subtítulos/CSP; integración del WASM HTTP/TLS y ocho resolutores DoH. Las capturas usan contenido de demostración.
