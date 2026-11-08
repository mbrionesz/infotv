# Comparación de hosts y ampliación DNS

Los cuatro hosts vistos al resolver TNT/TVN son candidatos de vídeo entregados por el portal en esa consulta. No son la lista de hosts del portal. Nuestra app tiene ocho hosts del portal configurados. XuperMH 2.32.0 también configura ocho, con seis coincidencias.

| Host del portal | XuperTizen | XuperMH 2.32.0 |
| --- | --- | --- |
| ftmrmy.jdfey0cd.com | Sí | Sí |
| fuxok.nguvmqhpk.com | Sí | Sí |
| eajmnp.hcgv1dt8.com | Sí | Sí |
| mptec.dhkrxuzcy.com | Sí | Sí |
| osuhk.m3x8o50te.com | Sí | Sí |
| oogoy.f30c96w8.com | Sí | Sí |
| hinumz.a878kkoyc.com | Sí | No |
| krdwvd.swcaw7qx.com | Sí | No |
| dtgrd.txhnojlbu.com | No | Sí |
| c2tgd.izvhrdcjb.com | No | Sí |

Esta tabla compara configuración estática, no disponibilidad actual de esos portales. No se modificaron las rutas de portal ni se añadieron servidores de vídeo. El paquete LG resuelve su primera entrada live de `cdn_list`; no contiene una lista fija de ocho CDN adicionales. [Análisis del paquete](ANALISIS-XUPERMH-2.32.0.md).

## DNS de la versión 0.8.4

| Proveedor | IP | Host/SNI | Ruta wire |
| --- | --- | --- | --- |
| Cloudflare | 1.1.1.1, 1.0.0.1 | cloudflare-dns.com | /dns-query |
| Google | 8.8.8.8, 8.8.4.4 | dns.google | /dns-query |
| AdGuard | 94.140.14.14, 94.140.15.15 | dns.adguard-dns.com | /dns-query |
| Quad9 | 9.9.9.9, 149.112.112.112 | dns.quad9.net | /dns-query |
| NextDNS | 45.90.28.0, 45.90.30.0 | dns.nextdns.io | /dns-query |
| Control D | 76.76.2.0, 76.76.10.0 | freedns.controld.com | /p0 |
| AliDNS | 223.5.5.5, 223.6.6.6 | dns.alidns.com | /dns-query |

Las seis IP nuevas están en el paquete LG. Se usan endpoints wire compatibles con nuestro parser y certificado/hostname verificados, conservando Quad9: la unión suma catorce direcciones, no doce.

Validación externa: los seis resolutores nuevos respondieron HTTP 200 y DNS wire válido a una consulta `example.com`. cURL usó `CONNECT_TO` por IP, URL/Host/SNI del proveedor y verificación TLS, mediante el proxy del entorno. No es una prueba desde Chile ni desde el firmware Samsung. El endpoint de Control D que figuraba en la app LG devolvía un cuerpo que no era DNS wire; `/p0` sí devolvió una respuesta válida.

Validación local: el WASM compilado abre las catorce conexiones por IP. Un servidor TLS de laboratorio fuerza a cada una de las seis nuevas IP a ser la única respuesta válida y se verifica el ganador, Host/SNI y ruta; un certificado con hostname incorrecto sigue rechazándose. Pruebas de coherencia comparan las tres listas IP/Host/ruta nativas con la configuración JS. Se conservan TTL, caché, cooldown, cancelación y primera respuesta válida. El diagnóstico del navegador sigue limitado por CORS/certificados de orígenes IP y no altera la resolución del navegador/AVPlay.

Aumentar alternativas puede ayudar si un resolutor falla o está bloqueado; no garantiza menor demora ni arregla respuestas HTTP 404 o secuencias de vídeo incompatibles.
