# XuperTizen 0.9.9 beta

- Inicio más sencillo, sin el bloque grande ni accesos duplicados; menú oculto con Inicio, TV en vivo, Películas, Series y Todo.
- Todo combina páginas de películas y series; Buscar consulta ambas sin un selector previo.
- Seguir viendo muestra minutos restantes cuando hay duración conocida, con ≈ si es estimada. Gestionar historial permite quitar un título o borrar el historial con confirmación, conservando favoritos.
- Similares requiere coincidencia de género. Películas y Series mantienen filas visuales y portadas con una presentación más sobria.
- Corregido el redondeo al reanudar MPEG-TS, que podía descartar un punto de salto válido.
- Corregido el búfer inicial de MPEG-TS: 128 KiB en lugar de 128 bytes. Mantiene descarga anticipada 25/10 s y AVPlay 3/6 s.

Conserva 17 DNS y diez hosts. No cambia la selección de motor guardada en el TV. El portal rechazó la sesión de prueba del entorno con portal100024: las calidades y el catálogo reales requieren comprobación en el televisor; no se inventan opciones 1080p ni totales únicos. Las capturas usan datos de prueba.
