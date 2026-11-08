# XuperTizen 0.8.3 beta

- Corrige `MPEG-TS: Cannot read properties of null (reading 'body')` en películas y series: si el transporte nativo indica fallback, el lector continúa por el navegador con los mismos rangos y autorización.
- La cancelación descarta respuestas tardías y evita iniciar una descarga de fallback al salir.
- Diagnóstico añade `vodBrowserFallbacks` para identificar el camino utilizado.

Mantiene la recuperación de TV en vivo de 0.8.2 y los ocho DNS integrados. El fallback por navegador utiliza el DNS del TV, igual que las otras rutas de fallback existentes; no sustituye globalmente el transporte Samsung. La disponibilidad y los códecs del contenido siguen dependiendo de su origen y del TV.

Importa el WGT en Apps2Samsung y utiliza tu firma habitual. Validación local con vídeo/audio MP4 y MPEG-TS; pendiente confirmar con el contenido real en Samsung.
