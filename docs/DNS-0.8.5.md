# Ampliación a diecisiete DNS

Se añaden los siguientes endpoints wire DoH a los catorce existentes:

| Proveedor | IP | Host/SNI | Ruta |
| --- | --- | --- | --- |
| DNS.SB | 185.222.222.222 | doh.dns.sb | /dns-query |
| DNS.SB | 45.11.45.11 | doh.dns.sb | /dns-query |
| Mullvad | 194.242.2.2 | dns.mullvad.net | /dns-query |

Fuentes oficiales: [DNS.SB](https://dns.sb/doh/) y [Mullvad](https://mullvad.net/en/help/dns-over-https-and-dns-over-tls). La dirección de Mullvad corresponde al endpoint estándar indicado, no a sus variantes adicionales con filtros.

Comprobación externa: las tres IP respondieron HTTP 200 y DNS wire válido a consultas `example.com`, por IP mediante cURL CONNECT_TO, manteniendo Host/SNI y verificación TLS, a través del proxy del entorno. Esto no sustituye una prueba desde la red chilena del TV.

Comprobación del código/binario: arrays IP/Host/ruta nativos y configuración JS coherentes; módulo WASM recompilado; integración TLS local contacta todas las IP y fuerza por turnos los resolutores incorporados desde 0.8.4, verificando la IP ganadora, Host/SNI, ruta y rechazo de certificado con hostname incorrecto.

No cambian la caché (TTL hasta diez minutos), cooldown (cinco minutos), presupuesto global DoH (cinco segundos) ni selección de la primera respuesta válida. El diagnóstico del navegador sigue sujeto a TLS/CORS y no modifica el DNS usado por navegador/AVPlay.

Esta actualización conserva los ocho hosts del portal publicados en 0.8.4. La edición local pendiente de `magis.js` que añade dos hosts se mantiene aparte y no se incorpora a este WGT. Los resolutores DNS reciben consultas de nombres, no las credenciales HTTP del portal. Más direcciones de resolución no equivalen a más CDN ni garantizan resolver errores de reproducción.
