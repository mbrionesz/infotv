# XuperTizen 0.10.10 beta

- Corrige respuestas de metadatos antiguas que interferían con un reintento nuevo.
- Detiene lecturas y temporizadores MP4 tras un fallo definitivo.
- Reinicia el estado de fin de archivo MPEG-TS al abrir otro rango, evitando completar un capítulo con un EOF anterior.
- Conserva el nombre y las marcas explícitas forced/isForced de subtítulos externos si el portal los entrega. El selector identifica Forzados y recuerda la selección; no los activa automáticamente ni los inventa a partir del idioma.

Mantiene DNS, TV en vivo y las funciones de 0.10.9. No se ha verificado que el proveedor ofrezca pistas forzadas en un título concreto. Apps2Samsung firma el WGT. Pruebas locales; pendiente comprobación Samsung real.
