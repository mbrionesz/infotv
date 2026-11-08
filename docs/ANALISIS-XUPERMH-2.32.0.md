# Análisis de XuperMH 2.32.0 y corrección VOD

Fuentes: [release v2.32.0](https://github.com/xuperaaronmh/xupermh/releases/tag/v2.32.0), repositorio en el tag (commit `ebedfa0b503d6b071ef08dca85e318348e8d1d2e`) y paquete público `XuperMH-v2.32.0.ipk` (22.594.734 bytes, SHA-256 `424a8a8cc7c09d0636917e6ded1c960225c470651083ad3fd5e0e8a0e40c66f5`). Se descargó, extrajo e inspeccionó sin instalar ni ejecutar el paquete. El código del servicio está en el IPK; el repositorio de ese tag contiene principalmente documentación, imágenes e instaladores. El paquete contiene una licencia MIT con créditos de CristiancoDEV y AarónMH. No se incorporó código ni binarios de ese proyecto.

## Servidores: conceptos diferentes

| Elemento | Hallazgo en el paquete |
|---|---|
| Hosts del portal | Ocho entradas en `magis.js`; no son una lista de servidores de vídeo. |
| Resolutores DoH | Doce direcciones en `dnsx.js`: Cloudflare, Google, AdGuard, NextDNS, Control D y AliDNS. Más resolutores no equivalen a más canales/CDN. |
| CDN en TV en vivo | `resolveLive` consulta `cdn_list`, recoge entradas de tipo live y usa la primera. No expone `backupUrls` en su resultado. No se identificó una lista fija adicional de CDN de vídeo que importar. |
| CDN VOD | `vodCdns` recoge dirección principal y de reserva de entradas VOD. `resolve` usa la primera base del primer candidato. |
| Proxy | Servicio Node local con peticiones HTTP/HTTPS y resolución por IP; almacena una IP por sesión. |
| Relay | FFmpeg local con copia de audio/vídeo a MP4 fragmentado, selección de audio y opciones de reconexión según el formato. No crea una fuente ni otro CDN. |
| Túnel | Configuración opcional de endpoints externos; no proporciona por sí misma una infraestructura pública de servidores. |

El proxy aplica algunas sustituciones de SNI y desactiva verificación de certificados (`rejectUnauthorized:false`). Estos comportamientos no se trasladaron a Samsung: se mantiene validación TLS y Host/SNI del destino real. Aumentar DoH no corrige las secuencias incoherentes observadas en las señales actuales.

## Aplicabilidad a Samsung

Son útiles como ideas el uso de una sesión de red estable, recuperación limitada, diagnóstico de rutas y remux de contenedores. El IPK depende de servicios Node/Luna, procesos y FFmpeg para webOS. Un widget WGT de Samsung no puede instalar o ejecutar directamente ese servicio LG. Una adaptación de relay requiere un diseño y validación específicos; no está incluida en 0.8.3. Tampoco se verificó la disponibilidad actual de sus fuentes contra el proveedor.

## Error VOD de nuestra app

`createVodReader` trataba como respuesta HTTP cualquier resultado del transporte nativo. Ese transporte retorna `null` cuando solicita fallback al navegador. El lector intentaba leer `result.body` sin ejecutar la rama XHR. El código publicado de 0.8.2 reproduce literalmente el TypeError informado.

Se corrige usando XHR cuando no hay respuesta nativa, conservando cabeceras permitidas, Range, límites de tamaño y validación de rangos. Antes y después de las operaciones se comprueba cancelación. Una respuesta nativa HTTP 401/403 no se convierte en fallback ni se trata como descarga válida. El transporte y DNS integrados siguen siendo la primera ruta; el fallback del navegador usa DNS/CORS de la plataforma y queda registrado como `vodBrowserFallbacks`.

Verificación: pruebas de respuesta nativa nula con Range y autorización; cancelación antes del fallback; pruebas reales de decodificación en Chromium de MPEG-TS y MP4 por XHR, incluidos audio, pausa, búsqueda y episodio de serie. Pruebas adicionales de MP4 nativo, respaldo con credenciales propias, 1080p y teardown. No certifica todos los códecs ni la reproducción del proveedor en un Samsung físico.
