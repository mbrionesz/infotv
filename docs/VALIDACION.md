# Validación actual — 0.5.7

56 pruebas unitarias e integración Chromium. La prueba de secuencia verifica
reinicio completo en la misma ruta, reproducción recuperada, respaldo ante
recurrencia, credenciales, pausa explícita y cancelación. [Notas](RELEASE-0.5.7-alpha.1.md).
Prueba física pendiente; no se garantiza estabilidad de las listas del proveedor.

Los apartados siguientes se conservan como historial.

# Validación actual — 0.5.6

56 pruebas unitarias e integración Chromium. El diagnóstico clasifica el motivo
por su primera línea e incluye mensaje sanitizado, secuencias y asociación a una
petición. La simulación adicional verifica un error real de secuencia, no su
recuperación. [Notas y comando Debug](RELEASE-0.5.6-alpha.1.md). Prueba física
pendiente; no se afirma corregido el corte de TNT Sports.

Los apartados siguientes se conservan como historial.

# Validación actual — 0.5.5

54 pruebas unitarias; integración Chromium de resolución/FPS/códecs, filas 16 px,
reproducción y recuperación. Prueba HLS de 60 s con medición de fotogramas y
normalización conservadora de TARGETDURATION duplicado. WASM recompilado con
ocho direcciones DNS. [Notas](RELEASE-0.5.5-alpha.1.md). Prueba física pendiente;
los registros previos no prueban bloqueo DNS ni el motivo preciso del parser.

Los apartados siguientes son historial.

# Validación actual — 0.5.4

Se corrige la pausa indiscriminada del buffer 0.5.3, se delegan huecos a HLS y se
recupera AbortError interno. 49 pruebas unitarias, integración Chromium y 60 s de
HLS con fallo de lista y diagnóstico de etiqueta ausente. [Notas](RELEASE-0.5.4-alpha.1.md).
No se afirma corregida la lista real del proveedor. Prueba física pendiente.

Los apartados siguientes se conservan como historial.

# Validación actual — 0.5.3

HLS.js y worker 1.6.19. 46 pruebas unitarias e integración Chromium; prueba de
60 s de HLS cifrado con umbrales medidos de 3/6 s y lista inválida recuperada sin
cambiar de CDN. Se verifica explícitamente Pausa y cancelación de esperas.
[Notas y límites](RELEASE-0.5.3-alpha.1.md). Prueba física de esta versión pendiente;
no se afirma resuelto el fallo del proveedor, los FPS o el desfase audiovisual.

Los apartados siguientes se conservan como historial.

# Validación actual — 0.5.2

42 pruebas unitarias y Chromium: los tres primeros candidatos fallan y el cuarto
reproduce con sus credenciales. Se prueban candidatos recibidos antes de variantes
HTTPS generadas. Verificación del adaptador por lectura del código y logs del
usuario (cuatro alternativas para seis canales), sin acceso directo a su sesión
ni prueba de disponibilidad real de esos hosts. Prueba física de esta versión
pendiente. [Detalle](RELEASE-0.5.2-alpha.1.md).

Los apartados siguientes son historial.

# Validación actual — 0.5.1

Se retiran los presets externos, incluidos los heredados. Se conserva la
importación de URL propia y la renovación única tras HTTP 404. Validación local:
40 pruebas unitarias e integración Chromium. Motor de reproducción sin cambios;
prueba física pendiente. [Notas](RELEASE-0.5.1-alpha.1.md).

Los apartados siguientes se conservan como historial.

# Validación actual — 0.5.0

40 pruebas unitarias; integración Chromium de listas M3U con mando, descarga y
parseo, favoritos, pantalla completa, caché/actualización/eliminación y renovación
única de resolución tras 404. Se mantiene la prueba HLS de 60 s con caída de lista
tras el segundo 30. Trece listas públicas respondieron HTTP 200 y contenido M3U;
esto no valida sus canales individualmente. [Notas](RELEASE-0.5.0-alpha.1.md).

El usuario confirmó en 0.4.4 vídeo H.264/AAC 720p a los 71,6 s, worker activo y
12,8 s de buffer; un atasco de arranque no fatal y un 404 en otro canal. Sus
contadores de fotogramas devolvieron cero y no permiten verificar FPS. Prueba
física de 0.5.0 pendiente; no se da por resuelto el pequeño desfase audiovisual.

Los apartados siguientes se conservan como historial.

# Validación actual — 0.4.4

Prueba física de 0.4.3: arranque más rápido, algunos canales estables, otros con
cortes cerca de 30 s, vídeo poco fluido y desfase de audio pequeño. No hay aún
logs que identifiquen la causa de cada canal.

0.4.4 añade worker HLS local, adaptación por fotogramas perdidos, recuperación
acotada de bloqueos y diagnóstico de buffer/códecs/fotogramas. Validación local:
36 pruebas unitarias, integración Chromium y 60 s de vídeo sintético con lista
deslizante y caída de lista después del segundo 30. No prueba los FPS ni la
sincronía audiovisual en hardware Samsung. [Detalle](RELEASE-0.4.4-alpha.1.md).
La validación física de esta versión sigue pendiente.

Los apartados siguientes son historial.

# Validación actual — 0.4.3

El usuario confirmó vídeo real durante unos segundos en 0.4.2, seguido de cortes.
Las fotos muestran HTTP 416 y fallos al cargar listas. En 0.4.3 se corrige el
Range inválido, la recuperación de HLS y la solicitud de interacción.

Validación local: 33 pruebas unitarias; integración Chromium; vídeo sintético
H.264/AAC AES-128 con lista deslizante durante 22 segundos, recuperando un 404
de lista y un 503 de segmento sin reiniciar el CDN ni pedir OK indebidamente.
El adaptador HTTP de esa prueba no ejecuta sockets Samsung. Una prueba C++
comprueba que tres peticiones reutilizan una sola conexión TLS y que POST no
espera Expect: 100-continue. WASM Samsung recompilado con verificación TLS activa.

La continuidad del proveedor y los tiempos de arranque en el QN70F con esta
versión siguen pendientes de prueba física. El indicador startupMs mide desde
la apertura del reproductor, sin incluir la resolución previa del canal.
[Notas completas](RELEASE-0.4.3-alpha.1.md).

Los apartados siguientes se conservan como historial.

# Validación actual — 0.4.2

28 pruebas y HLS real local aprobados. Fotos de la TV con 0.4.1: lista cargada,
respuestas DoH y timeout cURL 28; reproducción detenida antes del manifiesto.
La 0.4.2 cambia conexión por IP y aislamiento de fallos; su resultado en TV está
pendiente. [Detalle](DNS-INTEGRADO.md). Lo siguiente es historial de versiones.

# Validación actual — 0.4.0 alpha.1

22 pruebas aprobadas, más integración Chromium. El transporte de sockets/DoH
Samsung aún no tiene prueba física. [Resultados y límites completos](DNS-INTEGRADO.md).

Los resultados siguientes corresponden a la 0.3.1 y se conservan como historial.

# Validación de XuperTizen 0.3.1 alpha

La prueba física disponible corresponde a **0.2**, realizada por el usuario en
QN55QN70FAGXZS, Tizen 9, firmware T-PTMFUABC-0090-1301.0: lista de canales cargada,
menús lentos y reproducción sin inicio tras 20 s. **0.3.1 todavía no probada en TV.**

| Comprobación de 0.3 | Resultado local |
|---|---|
| Pruebas unitarias | 19 aprobadas, incluidas 4 de la pasarela histórica |
| Inicio autónomo y protocolo/TripleDES en worker | Aprobados en Chromium; sin PC/RPC |
| IndexedDB | Caducidad, límites, recuperación offline acotada y actualización en segundo plano |
| Miniaturas | Reducción y reutilización de blob cacheado verificadas en Chromium |
| Catálogo de 21.000 títulos sintéticos | Índice consultable con salida paginada; no es el catálogo del proveedor |
| Guía, QWERTY y catálogo de 36 tarjetas | Aprobados con metadatos simulados |
| HLS.js H.264/AAC MPEG-TS AES-128 | Decodifica y avanza el tiempo con vídeo sintético |
| Content-Auth/Content-License | Exigidos por servidor de prueba separado en manifiesto, segmentos y clave |
| Vista previa → pantalla completa, pausa, cambio y cierre | Aprobados en navegador con UA Samsung simulada |
| HTTP 403 de manifiesto | Error temprano con etapa/estado, sin exponer los headers |
| AVPlay y rectángulo en viewport 4K | API Samsung simulada; no hardware real |
| Códecs HEVC/AC-3/E-AC-3/DTS | Sin validación física; no hay transcodificador en el WGT |
| DoH por IP | Diagnóstico de carrera/caché/cooldown probado con transporte simulado; fallo de acceso controlado en Chromium |
| Cambio del resolver de vídeo / Host / SNI personalizados | No implementado; DNS del TV |
| CDN alternativo | HTTP 403 inicial → HLS real con otras credenciales en manifiesto/segmentos/clave |
| Canal real del proveedor en 0.3 | Pendiente en TV |
| Tizen 4–9+ y Apps2Samsung con 0.3 | Pendientes en hardware |

La consulta previa desde esta nube devolvió `403 Invalid CORS request` en
preflight y `portal100024` por región al activar sesión anónima. No demuestra
que la TV tenga el mismo problema: el usuario sí obtuvo su lista con la 0.2.

## Comparación de navegación

Chromium con CPU limitada ×6 y 2.000 canales simulados, mismo escenario:

| Métrica | 0.2 | 0.3 |
|---|---:|---:|
| Nodos DOM | 10.188 | 543 |
| Filas de inicio | 2.000 | 24 |
| Manejo de tecla P95 | 97,3 ms | 10,4 ms |
| Espera hasta siguiente frame P95 | 587,3 ms | 17,8 ms |
| Filas en guía nueva | — | 12 |

Registros en [benchmarks](benchmarks/). Son tiempos locales de un escenario
sintético; no acreditan 60 FPS, consumo de memoria o latencia en un Samsung.
El script `tools/bench-navigation.mjs` permite repetir el escenario.

```sh
npm ci
npm run build
npm test
npm run test:browser
npm run package
```

Chromium y FFmpeg se necesitan sólo en desarrollo para generar la señal de
prueba. El catálogo y canales de las capturas están simulados. Las pruebas de
companion no se presentan como evidencia de funcionamiento autónomo.

Comparación 0.3.0 → 0.3.1 y alcance DNS: [revisión de referencias](REFERENCIAS-RENDIMIENTO-DNS.md).
