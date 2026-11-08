# XuperTizen 0.8 beta

- TV en vivo: OK abre directamente el canal. Favoritos a la derecha; búsqueda y Mis canales en la cabecera. Sin submenú de cuatro acciones ni segundo reproductor de vista previa.
- Mando: restaura el foco visible en Principal al salir de la guía tras reproducir.
- Recuperación HLS: evita pausar internamente durante un corte; detecta falta de avance aunque quede algo de buffer. Reintentos limitados, cambio de ruta y salida con error si ninguna funciona.
- Transporte Samsung modernizado: cURL 8.23.0, OpenSSL 3.5.9 y zlib 1.4. Se conservan los ocho resolutores DNS integrados, Host/SNI y validación TLS.
- Correcciones de seguridad de subtítulos, almacenamiento, límites de respuestas y política de scripts; mejoras de búsqueda e interfaz.

Importa **XuperTizen-0.8.0-beta-Tizen4plus-UNSIGNED.wgt** en Apps2Samsung y utiliza su firma habitual. Conserva el identificador de la aplicación.

Pruebas locales con contenido simulado; pendiente confirmar en Samsung el bloqueo reportado y la reproducción del proveedor. No se promete ausencia total de errores.
