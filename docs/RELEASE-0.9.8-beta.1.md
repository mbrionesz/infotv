# XuperTizen 0.9.8 beta

- Películas y series intentan AVPlay en Samsung, con autorización por fuente, duración nativa y espera del salto al minuto guardado antes de comenzar. Si falla, vuelven al reproductor alternativo.
- Renovación acotada de la fuente ante un fallo nativo; OK permite reintentar un vídeo detenido sin reiniciar la app.
- Catálogo general mediante la colección All y getShelveData cuando el portal la anuncia, con alternativa a la consulta general.
- Controles y ajustes de reproducción renovados. Duración MPEG-TS estimada con ≈ cuando puede calcularse; sin duración ficticia.

Conserva los 17 DNS, diez hosts y la configuración de TV en vivo. AVPlay resuelve con el DNS del firmware; el transporte alternativo conserva DoH. Las cabeceras personalizadas de AVPlay necesitan confirmación en el TV: no todos los firmwares garantizan su soporte.

Validado con 204 pruebas unitarias, reproducción de archivos de prueba MP4/TS, renovación de autorización, audio/subtítulos, navegación y catálogo simulado. No constituye una prueba del proveedor ni garantiza reproducción continua en Samsung.
