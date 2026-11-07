# XuperTizen 0.5.9 alpha.1

Corrige el fallo observado en la señal FHD cuando la lista del respaldo apuntaba
a segmentos de nioo.wvdbozpfc.com con un espacio codificado al final del dominio.
El navegador solicitaba un host terminado en %20 y fallaba antes de descargar vídeo.

- Antes de entregar la lista a HLS.js, elimina exclusivamente espacios ASCII
  literales o %20 al final de un hostname DNS válido, antes de un puerto opcional.
  Conserva exactamente protocolo, puerto, ruta, consulta y fragmento. No decodifica
  tokens ni cambia licencias/cabeceras. Rechaza reparaciones ambiguas o con userinfo.
- Aplica la reparación a líneas URI HTTP(S)/protocol-relative y atributos URI de
  tags HLS reconocidos, incluyendo claves, mapas y sublistas. No modifica títulos,
  comentarios, tags desconocidos ni listas concatenadas. Registra las reparaciones.
- Aumenta de cuatro a dieciséis el límite de candidatos con credenciales propias
  recibidos del portal. Los candidatos originales preceden las variantes HTTPS.
  Mantiene autorización por origen, renovación acotada y plazo inicial total de
  30 s: un servidor lento puede impedir alcanzar todos los candidatos en ese plazo.
- Diagnóstico: cdnReceived, cdnAvailable, cdnLimit, cdnHosts, playlistHosts y uriRepairs.
  Por lista: repairedHostSpaces, uriHosts y repairedHosts. Los inventarios exponen
  solo hostnames, sin rutas, consultas, licencias ni cabeceras de autorización.
  Los hosts de listas incluyen respuestas, sublistas, claves y segmentos; no deben
  confundirse con CDN alternativos autorizados para el mismo canal.

## Direcciones observadas

Los logs disponibles muestran cuatro candidatos del portal:
niguof.vynbszicd.com, aluve.rdgqkfxio.com, auuy2136a.xh09je1qy.com y
adf76zg.lwhypcwckuf.com. El último log añade el destino de segmentos
nioo.wvdbozpfc.com. Este último no se añade como candidato de manifiesto porque
no se ha confirmado que sirva la misma URL ni acepte la autorización de otro host.

Se revisó liveCdnsOf: recoge direcciones principal/de respaldo de todas las entradas
live compatibles con CFL de getSlbInfo y elimina duplicados; no limita la salida a
cuatro. Ahora la app puede usar más si el portal los devuelve en la sesión del TV.
No se obtuvo un inventario nuevo autenticado desde la nube ni se inventaron dominios.

Consulta DNS pública mediante Google DoH el 7 de noviembre de 2026: los cinco
hosts resolvieron. nioo.wvdbozpfc.com devolvió la cadena CNAME
caeo-wvdbozpfc-com.cachefly.net → rvip16.ue.cachefly.net. Son destinos de
infraestructura DNS, no respaldos de manifiesto confirmados. Resolver DNS no
demuestra disponibilidad del canal ni corrige la secuencia del contenido.

## Validación

Pasaron 61 pruebas unitarias y las pruebas de Chromium: reproducción real AES-128
H.264/AAC y continuidad de 60 s con worker local, listas con hosts mal formados en
claves y segmentos, errores 404/503 y desajustes de secuencia. Se comprobó además
reproducción en el quinto candidato con sus propias credenciales, y el límite de
16 candidatos con pruebas unitarias. [Resultados](benchmarks/live-continuity-v059.json).
Metadatos simulados y adaptador HTTP local; no sockets ni decodificador Samsung.
HLS.js y worker siguen en 1.7.4. Prueba física Samsung pendiente: no se garantiza
corregir las inconsistencias de secuencia del proveedor.
WGT sin firma para firmar e instalar mediante Apps2Samsung.
