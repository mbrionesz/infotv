# XuperTizen 0.8.7 beta

Correcciones de películas y series tras comparar la resolución VOD con TizenXuperTV:

- La API v14 se prueba también cuando v15 responde sin rutas VOD gratuitas utilizables.
- Se respeta un protocolo HTTP/HTTPS explícito entregado por el portal, en lugar de convertir HTTP a HTTPS. Los dominios sin esquema siguen usando HTTPS; no se fuerza una bajada de HTTPS a HTTP.
- Los errores de decodificación MP4/MPEG-TS se atienden sin esperar al límite global. Antes de iniciar, se prueba el siguiente CDN con sus propias cabeceras. Se descartan errores de sesiones anteriores.
- El tiempo de apertura de cada ruta queda acotado; Diagnóstico conserva el HTTP fallido y el host real del servidor alternativo. HTTP 206 sin Content-Range tiene un mensaje específico.

Mantiene los 17 DNS, HLS.js 1.7.4 y el motor VOD con transporte Samsung y MediaSource. No añade servidores inventados ni usa CUSTOM_MESSAGE de AVPlay como si garantizara cabeceras HTTP.

Validación con archivos MP4 y MPEG-TS, vídeo/audio, selección de episodio y rutas de respaldo. Pendiente confirmar el resultado con el proveedor en Samsung físico. Instala el WGT con Apps2Samsung.
