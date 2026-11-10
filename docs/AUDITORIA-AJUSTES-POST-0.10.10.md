# Auditoría de Ajustes posterior a 0.10.10

## Bug reproducido y corregido

Menor retraso, política de subtítulos, TMDB y Abrir diagnóstico tenían un onclick idéntico a _activate. El manejador delegado del documento también invocaba _activate, ejecutando dos veces cada clic. Se retiran los onclick duplicados: tanto el clic como OK usan el mecanismo existente de la app. No se modifican los eventos de los diálogos que gestionan sus propios botones.

La prueba añadida falla antes de la corrección: un clic en Menor retraso no cambia el estado final. Tras corregir, alterna una sola vez; la política de subtítulos avanza una opción y Diagnóstico recibe una sola llamada.

## Validación

- test:settings aprobado en 1920x1080 y 3840x2160: diez paneles, desplazamiento independiente de las dos columnas, acceso al último control de reproducción y al último menú, grupos de fuente/formato/audio/idioma/tamaño/color, conmutadores y modo de interfaz.
- Comprueba clic único y apertura/cierre de TMDB con mando.
- Preferencias de reproducción conservadas tras recargar la app.
- Suite unitaria y compilación completadas.

La auditoría usa Chromium y datos simulados. No certifica respuesta de los CDN, velocidad real del Wi-Fi, disponibilidad de pistas del proveedor ni comportamiento del mando físico Samsung. Correcciones incluidas en 0.10.11 beta.

Correcciones incluidas en la entrega 0.10.11 beta.
