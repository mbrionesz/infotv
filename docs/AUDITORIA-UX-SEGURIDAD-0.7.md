# Auditoría de UX, QA y seguridad — XuperTizen 0.7

Estado: correcciones locales sobre la beta publicada `v0.7.0-beta.1` (commit `9833a02`). No se ha modificado ni reemplazado esa release. Esta revisión no certifica ausencia de bugs ni riesgo cero.

## Actualización posterior del transporte

La observación sobre cURL/OpenSSL antiguos se ha atendido en la revisión local:
cURL 8.23.0, OpenSSL 3.5.9 LTS y zlib 1.4 compilados con el SDK Samsung.
Las pruebas del WASM validan TLS, Host/SNI, gzip, rechazo de hostname incorrecto
y los ocho resolutores DoH por IP. Los resultados originales de la auditoría
se conservan como historial; queda pendiente la validación en Samsung físico.
Ver [transporte moderno](TRANSPORTE-MODERNO.md).

## Resultado

No se encontraron indicios de minería de criptomonedas en el código inspeccionado. Se revisaron entradas de la aplicación, scripts, trabajadores, transporte nativo, dependencias, permisos y solicitudes de red del recorrido con datos locales. CryptoJS se utiliza para el protocolo del catálogo; WebAssembly contiene el transporte HTTP/TLS/DNS, no constituye por sí mismo un indicio de minería.

Se encontró y corrigió una vía de inyección HTML en subtítulos externos. También se reforzó la política de scripts, la validación del almacenamiento y los límites de descarga. La revisión de UX detectó una búsqueda con alcance engañoso y controles sin etiqueta accesible.

## Hallazgos corregidos

| Hallazgo | Corrección | Evidencia |
| --- | --- | --- |
| Alto: los subtítulos externos acababan en `innerHTML`; una pista manipulada podía introducir elementos y manejadores de eventos. | Los subtítulos se crean con `textContent`. Se conservan saltos de línea y se retiran únicamente marcas conocidas de formato. Las URL requieren HTTP(S) sin credenciales en la autoridad; descarga limitada a 1 MiB y 8 s. | SRT controlado con `img/onerror` y `svg/onload`: no crea esos elementos ni ejecuta los marcadores; el texto normal conserva legibilidad. |
| Medio: la política de scripts admitía código inline y la vista previa no aplicaba la misma política que el widget. | Se extraen las ayudas de compatibilidad a `js/bootstrap.js`; se elimina `unsafe-inline` de `script-src`; se sincroniza la política de vista previa con el manifiesto. Se bloquean cambios de URL base, formularios y marcos. Los estilos inline se mantienen por el diseño existente. | Se inyectan scripts inline y remotos de prueba: CSP los bloquea. HLS, VOD y arranque siguen pasando. |
| Medio: historial incompatible y favoritos nulos/malformados podían romper la interfaz. | Lectura tipada y acotada, tolerancia a almacenamiento denegado y diccionario de favoritos sin prototipo. Se ignoran claves reservadas. | Tests con JSON inválido, `null`, objetos en lugar de arrays, tipos inesperados y `__proto__`; prueba del teclado con historial dañado. |
| Medio: el límite de tamaño de respuestas de metadatos se comprobaba al terminar la descarga. | Se aborta durante la recepción al superar 8 MiB. Las portadas se abortan al superar 512 KiB y se protege la liberación de la cola contra llamadas repetidas. | Prueba de aborto temprano y recorrido de portadas. Esto acota descargas de aplicación, no toda la memoria de códecs o bibliotecas. |
| UX: Buscar anunciaba películas y series, pero comenzaba directamente en películas. | Se elige el catálogo antes de abrir el teclado; el título del teclado declara el alcance real. | Mando: Principal → Buscar → Series → teclado “Buscar en Series”. |
| UX/accesibilidad: interruptor de adultos y portadas interactivas sin nombre semántico. | El interruptor declara rol, nombre y estado; las portadas declaran acción y título accesible. | Inventario de controles, más pruebas existentes del filtro y persistencia. |

## Cobertura de UX y QA por sección

| Sección | Revisión y resultado |
| --- | --- |
| Arranque e identidad | Imagen de inicio, transición a Principal y escala 1080p/4K pasan en Chromium; scripts de arranque ahora locales. La pantalla previa propia del sistema Samsung queda fuera del HTML. |
| Principal | Destinos de TV, películas, series, búsqueda, biblioteca y Ajustes; portadas y acceso a Mis canales. Se conserva la navegación del menú lateral con OK. Búsqueda corregida. |
| Destacados, Películas, Series, Infantil, Anime | Carga de tarjetas, títulos e imágenes, selector de filtros, teclado y navegación con datos de demostración. Las portadas se rotulan con el título. |
| Fichas y temporadas | Portada sin recorte, sin autoplay, selección de temporada/episodio y desplazamiento hasta recomendaciones. La prueba VOD reproduce el segundo episodio. |
| Reproductor | HLS con autorización y claves, MP4, TS, vídeo/audio, pausa, cambios, salida y recuperación controlada. Protección añadida en subtítulos. No es una prueba de todos los códecs/servidores del proveedor. |
| TV en vivo | Categorías, lista, vista previa, pantalla completa, búsqueda y favoritos. Acciones visibles con OK; pie sin depender de colores. |
| Mis canales | Guardar, consultar desde Principal y TV, quitar y estado vacío; persistencia local. No es sincronización entre televisores. |
| Biblioteca | Historial, favoritos VOD y foco de pestaña. Se distingue de favoritos de canales. |
| Listas M3U | Entrada de URL, descarga limitada, lectura, actualización, favoritos y confirmación de eliminación. Se rechazan esquemas que no son HTTP(S). |
| Reproducción en Ajustes | Modo de menor retraso, subtítulos, formato, idioma, tamaño y estilo guardan valores reales. Audio/idioma dependen de pistas disponibles; formato y subtítulos externos no equivalen a cambiar resolución/códec del proveedor. |
| Pantalla y compatibilidad | Automático y HD cambian el estado de escala; opciones inferiores permanecen accesibles con mando. |
| Control parental | Preferencia real, con nombre y estado accesibles. Es filtro por metadatos, sin PIN; no debe presentarse como bloqueo de seguridad. |
| Este televisor | Perfil local y accesos a biblioteca, listas e instrucciones. No representa una cuenta comercial autenticada. |
| Diagnóstico | Apertura del panel, navegación y cancelación de mediciones. Una respuesta HTTP no demuestra disponibilidad del canal ni identifica por sí sola un bloqueo de operador. |
| Instalación, Ayuda y Acerca de | Paneles informativos. No se presentan como botones que ejecutan una instalación o soporte remoto. |

El inventario registra los controles visibles y su función asociada en los diez menús de Ajustes. Tener un manejador asociado no prueba por sí solo todos sus resultados: se combina con las pruebas de persistencia, presentación, reproducción y navegación. Las pruebas usan datos controlados, no todas las fichas ni señales del catálogo real.

## Revisión de minería, dependencias y red

- No hubo coincidencias de los indicadores de minería buscados (`coinhive`, `cryptonight`, `stratum`, `xmrig`, `monero`) en las fuentes de ejecución examinadas. Esta búsqueda no es un detector universal de malware.
- Se inspeccionaron los usos de criptografía, trabajadores y temporizadores. El protocolo usa 3DES/MD5 y las peticiones DNS/TLS usan WebAssembly. No se identificó una rutina de trabajo de minería.
- Una muestra de Principal en reposo, en Chromium y con datos locales, registró 0 ms redondeados de JavaScript y 3 ms de tareas en 2,5 s. Es una muestra breve de QA, no evidencia suficiente para descartar comportamiento diferido ni una medida de CPU del Samsung.
- `npm audit --json`: 0 avisos conocidos entre las dependencias instaladas consultadas. No cubre las bibliotecas C/C++ incluidas en WebAssembly ni acredita que un paquete no pueda ser malicioso.
- Los tres archivos del transporte nativo coinciden con los SHA-256 de su manifiesto local. Esto verifica integridad respecto a ese manifiesto, no una auditoría independiente ni una recompilación reproducible de todas las bibliotecas. Las importaciones del módulo WASM pertenecen a `env` y `global`.
- El widget declara privilegios de internet y mando. No se encontraron certificados privados `.p12`, `.pfx` o `.key` en `app/`.
- La carga ejecutable procede del paquete y de la API Samsung. La política actual bloquea scripts remotos; las fuentes de contenido siguen siendo externas.
- La prueba registra orígenes y tipos de recurso sin consultas ni tokens. `example.invalid` aparece por el intento deliberado de cargar un script, bloqueado por CSP; no es un servidor incorporado a la app.

## Riesgos pendientes y límites importantes

1. **Prioridad alta: modernizar el transporte nativo.** El manifiesto declara cURL **7.68.0** y OpenSSL **1.1.1w**, versiones antiguas. El `npm audit` limpio no las valida. La actualización requiere adaptar/recompilar el puerto Samsung y probar TLS/DNS en el dispositivo. No se han cambiado esas bibliotecas en esta revisión ni se asegura que todos los avisos históricos sean explotables en esta compilación.
2. **El HTTP plano continúa permitido.** Algunas rutas del proveedor y mecanismos de compatibilidad usan HTTP. No tienen confidencialidad e integridad equivalentes a HTTPS. El cifrado del protocolo del catálogo no sustituye a TLS. Bloquearlo de golpe impediría señales que hoy funcionan; esta revisión no lo elimina silenciosamente.
3. **Navegador y códecs del TV.** Los fallos del firmware, parsers nativos y reproductor Samsung no pueden descartarse desde Chromium. Hace falta probar el WGT en el QN70F.
4. **Proveedor y listas de terceros.** Pueden cambiar, fallar o entregar contenido/archivos manipulados. Los límites y la presentación como texto reducen superficie, pero no garantizan seguridad de cada flujo multimedia.
5. **Datos locales.** Historial, preferencias, favoritos y URL M3U se guardan en el TV. Una URL personalizada puede contener parámetros sensibles; no son un almacén cifrado de credenciales.
6. **Alcance de red.** No se comprobó una sesión real del proveedor durante el recorrido de seguridad. No se afirma ausencia de anuncios dentro de una señal, ni fiabilidad de cada CDN.

## Pruebas reproducibles

- `npm test`: **88 pruebas**, todas pasan.
- `npm run test:security`: **19 capturas**, ataques de prueba bloqueados y sin excepciones JavaScript.
- `npm run test:ux`: recorrido de mando, preferencias, favoritos, desplazamiento, estados vacíos y escala 1080p/4K.
- `npm run test:browser`: HLS.js real, AES-128, credenciales, navegación, listas M3U y recuperación 404 pasan con fuentes controladas.
- `npm run test:vod`: MP4 faststart/moov final, TS, respaldo 404, audio/vídeo, pausa y episodios pasan.
- `npm run test:startup`: arranque y transición a Principal pasan en 1080p y 4K.

Las imágenes y el inventario se generan localmente en `docs/qa-security-0.7/`. No se incorporan al WGT ni al ZIP de código fuente.

## Mejoras siguientes de UX

- Ordenar los canales favoritos y permitir iniciar opcionalmente en el último canal.
- Unificar los iconos heredados del reproductor y mostrar una ayuda breve del mando cuando el usuario la solicite.
- Progreso por capítulo, marcado de visto y acceso explícito al siguiente episodio.
- Separar todavía más el diagnóstico técnico del resumen útil para una persona que solo quiere ver TV.

La prioridad de seguridad antes de afirmar una entrega estable es modernizar la ruta nativa y validar el conjunto en el Samsung, no declarar “cero riesgo” por pasar pruebas automáticas.
