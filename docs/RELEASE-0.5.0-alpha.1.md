# XuperTizen 0.5.0 alpha.1

Añade listas M3U a la guía y renueva una resolución del portal tras un HTTP 404.
El usuario confirmó en 0.4.4 reproducción H.264/AAC 720p, worker activo y posición
71,6 s con 12,8 s de buffer; también reportó un 404 en un canal antes disponible.
No se atribuye todo 404 a la caché: puede faltar la señal en el servidor.

## Listas M3U

Trece accesos públicos: Chile, Argentina, Colombia, México, Perú, Uruguay,
España, español, deportes, cine, noticias, música e infantil, de IPTV-org.
La copia de LG disponible localmente contiene cuatro presets; estos trece son
la selección de esta versión, no una afirmación de identidad con los de la foto.
Se verificaron HTTP 200 y contenido M3U en las trece listas el 6 de noviembre de
2026. Esto no verifica cada canal ni su disponibilidad geográfica o futura.
Datos: [m3u-presets-v050.json](benchmarks/m3u-presets-v050.json).

- En TV en vivo aparecen como categorías «M3U · …». Ajustes → Agregar Addons
  abre esa misma guía. No se descargan todas al iniciar; solo la seleccionada.
- «+ Añadir lista M3U» permite escribir una URL HTTP(S) con teclado para mando,
  con Mayús y signos de URL. Guardar añade; Return cierra sin añadir.
  Se conservan hasta 20 definiciones propias en el TV. Las URL no van al historial
  de búsquedas. No se incluyen listas privadas del usuario en el repositorio.
- Amarillo vuelve a descargar la lista. Rojo sobre una categoría propia la
  elimina; rojo sobre un canal conserva su comportamiento de favorito.
- Búsqueda por nombre y grupo, favoritos con URL conservada y pantalla completa.
  Los identificadores incluyen la fuente para no mezclar el primer canal de
  distintas listas. Se rechazan esquemas ajenos a HTTP(S), HTML y manifiestos HLS
  confundidos con listas de canales. Límite: 8 MB y 10.000 entradas por lista.
- Parseo en el worker de datos; caché solo en memoria, hasta tres listas durante
  cinco minutos. No se persistirán resoluciones de canales ni credenciales HLS
  del portal como parte de esta función. Las preferencias de una URL propia y
  los favoritos M3U sí incluyen su URL para poder recuperarlos tras reiniciar.
- Se reconocen EXTINF, group-title, EXTGRP y direcciones relativas. No incluye
  EPG XMLTV ni soporte de todas las extensiones Kodi/VLC de cabeceras/DRM.
  Las listas deben dar acceso a señales reproducibles por el TV. No convierte
  códecs ni incorpora un servidor externo. TS/MP4 usa la ruta nativa disponible;
  HLS usa las rutas ya soportadas, incluido el transporte seguro de la app.

## HTTP 404

El portal mantenía resoluciones de canales durante dos minutos. Ante un error
fatal HLS 404, un canal del portal solicita una nueva resolución omitiendo esa
caché y vuelve a abrir con las nuevas cabeceras de su CDN. Se hace una vez por
apertura, con ocho segundos de espera para la renovación. Se cancela al salir o
cambiar de canal. Si la renovación falla, se conservan las alternativas acotadas;
si persiste el 404, se muestra que la señal no está disponible.

No se renueva el portal para canales M3U, que no pertenecen a él: actualizar la
lista puede traer otra URL, pero no recupera una señal retirada. No se eluden
403, controles de acceso ni certificados. Diagnóstico registra sourceRefreshes.

## Comprobaciones y límites

40 pruebas unitarias; integración Chromium de URL escrita con mando, descarga y
parseo en worker, reproducción M3U H.264/AAC AES-128, favoritos, pantalla completa,
caché, actualización y eliminación de lista. Un 404 caducado se recupera con una
resolución nueva; un 404 permanente falla tras una sola renovación. La prueba de
continuidad de 60 s con caída de lista después del segundo 30 se mantiene.
Los metadatos del portal se simulan en estas pruebas; no son pruebas físicas.

La reproducción, los FPS y la sincronía audiovisual de 0.5.0 requieren prueba
en Samsung. Los contadores del QN70F observado devolvieron cero pese a reproducir;
no se interpretan como ausencia de pérdidas de fotogramas. WGT sin firma para el
flujo Apps2Samsung, mínimo declarado Tizen 4.0, SDK nativo experimental con curl y
OpenSSL antiguos, sin cambios en la verificación TLS.
