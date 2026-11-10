# XuperTizen 0.10.7 beta

- Corrige guardar/cerrar el episodio anterior antes de asignar el siguiente, sin trasladarle el minutaje ni el estado de completado.
- Avance automático al confirmar el final del capítulo; al acabar la película o el último episodio, vuelve al catálogo.
- MPEG-TS: el final del archivo y el consumo del búfer permiten completar títulos que no emiten ended. Un corte de red no se toma como final.
- Si falla VOD: reintentar con conexión nueva, volver al catálogo o reiniciar la app sin borrar favoritos, historial ni preferencias.
- Al reabrir después de una suspensión larga, ofrece recuperar con una conexión nueva. Exit sigue disponible durante el error.
- Reinicia los servicios transitorios de datos y sockets al recuperar; conserva los 17 DNS y 10 hosts.

Validación: pruebas locales de transición MP4/TS, cambio manual, error de autorización en el siguiente episodio, reanudación, suspensión simulada y salida. No equivale a reproducir 45 minutos en el Samsung ni confirma la causa exacta del fallo reportado.
