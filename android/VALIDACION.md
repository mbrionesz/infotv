# XuperAndroid 0.1.1 beta 10: perfil y renovación de sesión

- Fuente validada: `eb3ebffad53d276f44ba20ac9d48b067682e0fd9`.
- El reporte del usuario fue `aaa100083` (sesión no iniciada), no `portal200001` (perfil retirado). No se reprodujo la respuesta en la tablet física ni se atribuye el fallo exacto a una causa confirmada. La auditoría encontró dos defectos relacionados e independientes.
- Android beta 8/9 comparaba el perfil con el `magis.js` archivado de 2024, mientras Tizen/Windows aplicaban un adaptador de compilación de 2025. Las tres plataformas ahora leen `shared/portal-profile.json`: APP com.android.msandroid, APK 49902, cabecera APK 43404, paquete/sistema `2025-08-07 05:40:11_36_16_`, SDK de protocolo 36. Gradle genera las constantes y los tests de Android leen el mismo recurso. El mínimo de Android sigue en API 26/Android 8. Se incluyen los nuevos inputs en el hash de compilación y en el kit de fuentes Tizen; su código generado permanece sin diferencias funcionales.
- Cada solicitud captura las credenciales de su propia sesión. Ante códigos de sesión caducada solo se invalida esa sesión si aún es la actual. Se evita que un rechazo tardío de otra consulta borre una sesión más reciente. El test concurrente falla al restaurar la invalidación anterior: provoca dos activaciones en lugar de una. La versión corregida pasa.
- El bootstrap usa su SN local y publica una sesión solo después de activarla con usuario/token válidos; la migración de perfil conserva la identidad de instalación y los datos personales. Un rechazo persistente tras renovar se informa con su código, sin bucle de reintentos. El mensaje de aaa100083 se explica en español.
- 43 pruebas unitarias (7 modelo, 36 datos), incluidas tres nuevas pruebas de transporte simulado cifrado: perfil real enviado en cabeceras/cuerpo y migración, recuperación concurrente y rechazo persistente limitado. Pruebas del adaptador compartido, compilación de bundles y hash de frescura correctos. Sin consulta al portal real, sesiones prestadas ni metadatos privados exportados.
- 20 pruebas instrumentadas (18 funcionales, 1 PiP y 1 de capturas), sin fallos, errores u omisiones: https://github.com/mbrionesz/infotv/actions/runs/45759468760 . Evidencia en los artefactos `XuperAndroid-0.1.1-beta10-pip` y `XuperAndroid-0.1.1-beta10-functional`, con 20 PNG de celular/tablet/disposición TV. Android 15/API 35 Google APIs con contenido local, `portal_probe=false`; la disposición TV se fuerza en el emulador y no certifica un TCL físico.
- Release optimizado/R8 y lint correctos; APK universal de 4.768.240 bytes. Firma v2/v3 idéntica a beta 9 y alineación 16 KiB verificadas. El DEX contiene el perfil 2025 y no contiene el perfil 2024. SHA-256 `4242ca0464a1b0666fc07f772daa854d94ec2b1cafa09a2f1eba87a9cdf87a36`.
- Publicación exitosa: https://github.com/mbrionesz/infotv/actions/runs/45760457404 . Descarga pública verificada con el mismo SHA-256: https://github.com/mbrionesz/infotv/releases/tag/v0.1.1-android-beta.10 . Se transfirieron solo el APK firmado y sus comprobantes públicos; la clave privada permanece local.
- Se mantienen los 17 DNS, diseño, PiP y política de memoria/búfer. Estos cambios no garantizan que el servidor acepte cada instalación ni demuestran una mejora de velocidad. Pendiente probar el APK release optimizado en la tablet afectada y otros dispositivos físicos con su red/portal.
- `companion/lib/magis.js` permanece intacto, SHA-256 `fa910167e612539f54cad7535f96da1dce7abb5b3525b499a1a1edcc8c4cbf77`. Tizen/Windows utilizan los mismos valores efectivos que antes de este cambio.

## Registro anterior: beta 9

# XuperAndroid 0.1.1 beta 9: reproducción y PiP

- Fuente validada: `2cb54a49affc95ebbde1548d424fcd282f8eb5dc`. El APK optimizado se compiló desde `c40a8284333090ef2068532f64d158d38bb980d3`; los commits posteriores hasta la fuente validada solo modifican pruebas y su configuración, sin diferencias de código de producción.
- Cada ExoPlayer recibe un selector independiente. La auditoría encontró una excepción real de Media3 al reutilizar el selector entre los hilos de dos motores; se corrigió junto con el enlace explícito de PlayerView a la nueva instancia al cambiar de vídeo/capítulo/canal.
- Recuperación inicializada con un scope activo antes de preparar la fuente. Una renovación conserva la pausa y el último adelanto solicitado durante la espera; liberar el reproductor cancela resultados tardíos. Los errores no reactivan indefinidamente el indicador de carga.
- Pausar funciona mientras espera búfer porque se utiliza la intención de reproducción, no solo `isPlaying`. PiP automático sigue esa intención, se deshabilita ante pausa/error y oculta controles desde el inicio de la transición Android 15+. La detección TV usa UiMode o Leanback tanto en la interfaz como en la exclusión PiP. Celular/tablet ajustan la distribución a las dimensiones actuales.
- 40 pruebas unitarias (7 modelo, 33 datos) y 20 instrumentadas (PiP 1, funcionales 18 y capturas 1), cero fallos, errores u omisiones: https://github.com/mbrionesz/infotv/actions/runs/45757533728 . Las dos nuevas pruebas cubren pausa/adelanto durante renovación, fallo sin spinner persistente y cancelación al liberar. Incluye limpieza, episodios, controles y navegación D-pad.
- PiP se verifica en un emulador independiente: salida mediante Home, avance del vídeo, expansión con el control nativo Android, regreso a Activity reanudada y exclusión TV. Se habilitan los relojes de animación del sistema y se deja estabilizar la transición de entrada antes del toque. Las pruebas de hardware seleccionan el task de la app antes de inyectar teclas. Se descarta el tutorial inmersivo de primer inicio del emulador. No se eliminan aserciones ni se omiten casos para aprobar.
- 20 PNG de interfaz nativa en `XuperAndroid-0.1.1-beta9-functional/qa-screenshots`: celular normal/estrecho, tablet y disposición TV. Revisión visual de cabecera, distribución, contraste y Ajustes. La disposición TV usa `force_tv` en un emulador de teléfono Android 15/API 35; sus barras del sistema no certifican el aspecto de un TCL físico. Contenido local identificado como prueba; `portal_probe=false` y ausencia de diagnóstico de sesión real.
- Release/R8, lint, firma v2/v3 y alineación 16 KiB verificados. APK universal de 4.768.240 bytes; mismo certificado de desarrollo que beta 8. SHA-256 `f1fa421349ff5472ce9b56b4a7e8ed3b66c9bf80f85af72a9139d96e24480d5f`.
- Publicación: https://github.com/mbrionesz/infotv/actions/runs/45758395175 . Descarga pública verificada con idéntico SHA-256: https://github.com/mbrionesz/infotv/releases/tag/v0.1.1-android-beta.9 . Solo APK firmado y datos públicos; la clave privada permanece local.
- Se conservan los 17 resolutores, biblioteca, limpieza y presupuestos de vídeo de 30/60 s con 12/32 MiB según memoria reducida. No se amplía el búfer ni se afirma una mejora de velocidad medida. Pendiente probar el APK release optimizado en celulares, Lenovo P11 y TCL físicos, reproducción prolongada, códecs y CDN reales.
- Tizen/Windows y `companion/lib/magis.js` no se modifican; hash de este último: `fa910167e612539f54cad7535f96da1dce7abb5b3525b499a1a1edcc8c4cbf77`.

## Registro anterior: beta 8

# XuperAndroid 0.1.1 beta 8: limpieza y reinicio

- Fuente validada: `9a07d57e4118ea73f84e64047738010b6a69c6fe`.
- Ajustes → Almacenamiento incorpora «Limpiar caché y reiniciar». Bloquea pulsaciones repetidas y navegación durante la operación, cancela y espera peticiones de catálogo/reproducción/diagnóstico/conteo, espera escrituras pendientes y guarda el progreso antes de liberar Media3. Elimina caché de imágenes, JSON de presentación y categorías en memoria; vacía respuestas DNS y conexiones HTTP y renueva la sesión temporal conservando el identificador de instalación. Recrea la Activity y recarga Películas. Room, DataStore, estadísticas y preferencias por título se conservan; no utiliza borrado global de datos ni mata el proceso.
- Fallos de limpieza muestran Almacenamiento y permiten reintentar. No se anuncia éxito ni se ejecuta el reinicio si la limpieza falla. Un contador de generación impide que consultas DNS anteriores repueblen la caché después de limpiarla. La política de búfer y la lista de 17 resolutores permanecen iguales.
- PiP: Android 12+ utiliza entrada automática al salir; Android 8–11 mantiene el mecanismo anterior. La entrada manual es idempotente y se bloquea durante mantenimiento. Televisores continúan excluidos. Se conserva el menú/diseño de beta 7.
- 40 pruebas unitarias (7 modelo, 33 datos) y 18 instrumentadas (PiP 1, funcionales 16 y capturas 1), sin fallos, errores ni omisiones en la ejecución final: https://github.com/mbrionesz/infotv/actions/runs/45719644435 . Los tres nuevos casos nativos verifican datos persistidos y recreación real de Activity; progreso activo y cancelación de una apertura pendiente sin doble ejecución; y fallo de almacenamiento con biblioteca conservada y reintento. Los dos casos DNS nuevos verifican renovación e invalidación de respuestas en vuelo.
- Una ejecución previa aprobó las 16 pruebas funcionales y las capturas pero falló la salida PiP. El registro mostró una transición lenta del emulador y que el clip local de 12 s terminaba durante ella. La prueba mantiene ese clip en bucle, comprueba avance incluso al repetir y da 45 s a la salida nativa, sin eliminar la aserción de pantalla completa/Activity RESUMED ni convertir errores en éxitos. La ejecución final pasó completa. El bucle solo existe en el test.
- 20 capturas nativas conservadas en el artefacto `XuperAndroid-0.1.1-beta8/qa-screenshots`; revisión visual de Almacenamiento. Android 15/API 35 Google APIs, tamaños de celular/tablet/TV mediante `force_tv`. Contenido local de prueba y respuestas simuladas; `portal_probe=false`, ausencia de `portal-probe.json` comprobada. No certifica funcionamiento integral del portal ni dispositivos físicos.
- Compilación release optimizada/R8 y lint correctos. APK universal de 4.768.240 bytes, firma v2/v3 con el mismo certificado de desarrollo de beta 7 y alineación de 16 KiB verificadas. SHA-256 `ec7c4be4c83d821b852beaecbcc53720c8e6b6b132d9210eb4fe4ce0f1d1ac2e`.
- Publicación verificada: https://github.com/mbrionesz/infotv/actions/runs/45720751624 . APK público descargado y SHA-256 idéntico comprobado: https://github.com/mbrionesz/infotv/releases/tag/v0.1.1-android-beta.8 . Solo APK firmado y datos públicos, clave privada local. El release optimizado y las plataformas físicas quedan pendientes de prueba.
- Tizen no se modifica: Chromium pertenece al firmware Samsung; cambiar el SDK u objetivo JavaScript del WGT no actualiza el motor instalado. Se conserva el objetivo Chrome 56 y la versión mínima Tizen 4.0 para mantener compatibilidad previa. `companion/lib/magis.js` conserva su hash.

## Registro anterior: beta 7

# XuperAndroid 0.1.1 beta 7: identidad compartida

- Fuente validada: `a71cebd85d9ea9f0679d9200dfceb61577dafc90`.
- Referencia visual: cabecera compartida de `browser/tv-shell.js`, Ajustes de `app/js/app.js` y estilos `app/css/cinema.css` / `app/css/shadcn-tv.css`. Implementación nativa Compose: logo conservado, TV/Películas/Series/lupa centrados, engranaje a la derecha, menú lateral por grupos y panel de opciones en tablet/TV. Teléfono utiliza menú y páginas de sección con los mismos componentes y navegación atrás.
- Selección única de fuente/tamaño/color, vista previa, acciones reales de biblioteca, reproducción, imagen, diagnóstico, conteo y limpieza de imágenes temporales. Las preferencias de audio reconocen códigos ISO de tres letras. Transporte, 17 resolutores, perfil y búfer de beta 6 conservados; `companion/lib/magis.js` no modificado.
- 38 pruebas unitarias (7 modelo y 31 datos) y 15 instrumentadas (PiP 1, funcionales 13 y capturas 1), cero fallos/errores/omisiones en la ejecución final: https://github.com/mbrionesz/infotv/actions/runs/45713949552 . Incluyen centrado independiente del logo, fuente seleccionada y persistida en el estado, Mi lista desde Ajustes, cambio de panel con D-pad, navegación atrás, reproducción y recuperación VOD, PiP con avance del tiempo, retorno a pantalla completa y exclusión de TV.
- 20 PNG reales de la interfaz nativa en el artefacto `XuperAndroid-0.1.1-beta7/qa-screenshots`: celular normal/estrecho, tablet y disposición TV. Android 15/API 35 Google APIs con `force_tv` para la disposición TV; la barra del sistema de las capturas pertenece al emulador de teléfono. Revisión visual de alineación, lectura, menú/panel, botones y secciones Diagnóstico/Catálogo/Almacenamiento/Acerca de. Contenido local identificado como prueba; sin imágenes inventadas ni portal real. Ausencia de `portal-probe.json` comprobada, `portal_probe=false`.
- Durante la validación se corrigió el recorrido de capturas para desplazar la LazyColumn real y conservar imágenes aun cuando falla un test. Una descarga de la imagen SDK falló antes de ejecutar pruebas. El emulador también atascó una salida de PiP con las animaciones desactivadas; la prueba usa ahora relojes de animación normales durante PiP y consulta Activity/lifecycle en el hilo principal, sin omitir aserciones. Una falla de PiP mantiene la ejecución global fallida, conservando informes funcionales y capturas. La ejecución final pasó completa.
- Release R8 optimizado y lint correctos. Firma v2/v3, alineación 16 KiB y mismo certificado de desarrollo que beta 6 verificados. APK universal de 4.768.240 bytes; SHA-256 `42d41a1609d2d5c7f31274480f0110f81ae32c7f290a67870eaf1cf43416fc8f`.
- Publicación verificada: https://github.com/mbrionesz/infotv/actions/runs/45715253042 . Descarga pública comprobada con el mismo SHA-256: https://github.com/mbrionesz/infotv/releases/tag/v0.1.1-android-beta.7 . Solo APK firmado, SHA256SUMS.txt y build-info.json; clave privada local. El release optimizado y dispositivos físicos quedan pendientes de prueba, sin atribuir al portal la validación de fixtures locales.

## Registro anterior: beta 6

# XuperAndroid 0.1.1 beta 6: revisión del flujo VOD

- Fuente validada: `819a77189ce383a63cf8bf5ebe4ffa59af5c8166`.
- Errores corregidos: reintento inicial deshabilitado antes de obtener un enlace; identificación de películas como episodios; búsqueda con debounce capaz de cancelar ficha/apertura; contexto de episodios de otra temporada al reanudar; inicio tardío tras ir a segundo plano; selección de pistas sin licencia y primera licencia vacía; ausencia de alternativa SLB tras fallo de transporte; ficha `type=1` para `portal100006`; elección manual de audio en otra calidad y distinción por nombre de variantes del mismo idioma. Preparación de fuentes inválidas produce un error recuperable en vez de una excepción sin manejar.
- Resolución inicial VOD limitada a 60 s, metadatos opcionales de temporada separados de una reproducción ya iniciada. El estado conserva título/episodio/posición para reintentar. Biblioteca, preferencias, 17 resolutores, perfil, búfer y diseño anteriores conservados.
- 37 pruebas unitarias y 15 instrumentadas aprobadas, sin fallos/errores/omisiones en las suites controladas: https://github.com/mbrionesz/infotv/actions/runs/45705217250 . Nueve pruebas nuevas de contrato VOD (JSON simulado) y seis nuevas de interfaz nativa (MP4 H.264/AAC/SRT local): fallo inicial y reintento, siguiente episodio/vuelta a ficha, búsqueda pendiente, cambio de temporada, cancelación con Volver y cancelación al pasar al fondo con reintento.
- El corredor de pruebas utiliza una Application de test que inyecta repositorios controlados; esa implementación y las pruebas no forman parte del APK release. Las suites se separan en PiP (1), funcional (13) y capturas (1), conservando sus informes en qa-evidence. Capturas al final para aislar cambios globales de tamaño/densidad; eventos de teclado esperan foco real de la ventana. No se omiten aserciones.
- El diagnóstico opcional del portal real NO se ejecutó y no se incluye en las 15 pruebas. La revisión automática rechazó ejecutarlo y transferir metadatos de esa sesión a artefactos de GitHub sin autorización explícita. La ejecución publicada usa `portal_probe=false`; un segundo opt-in de instrumentación impide cualquier petición real del diagnóstico si se incluyera accidentalmente. Se comprobó ausencia de `portal-probe.json` en el artefacto. No se afirma una prueba integral contra el portal ni disponibilidad de sus CDN/códecs físicos.
- Release optimizado/R8 y lint correctos; firma v2/v3, certificado idéntico a beta 5 y alineación de 16 KiB verificados. APK universal de 4.735.472 bytes; SHA-256 `58e32191c0db2693016baee64ed31ca2836fe032107583361edf223049cce756`.
- Publicación exitosa: https://github.com/mbrionesz/infotv/actions/runs/45706510478 . Descarga pública comprobada con el mismo SHA-256: https://github.com/mbrionesz/infotv/releases/tag/v0.1.1-android-beta.6 . Solo APK público, SHA256SUMS.txt y build-info.json; keystore local y `realPortalChecked=false` explícito.

## Registro anterior: beta 5

# XuperAndroid 0.1.1 beta 5: verificación

- Fuente validada: `4a658a2e7f6016d2c2cb3d747e61feda06ad245a`.
- Catálogo DNS generado al compilar desde `desktop/resolvers.json` mediante la API de fuentes Kotlin generadas de AGP. Comparación exacta de las 17 IP, hostnames TLS y rutas contra el transporte nativo Samsung (`native/transport.cpp`) y diagnósticos del navegador (`browser/dns-diagnostic.js`). Nueve proveedores: Cloudflare, Google, AdGuard, Quad9, NextDNS, Control D, AliDNS, DNS.SB y Mullvad.
- Un endpoint DoH por IP, bootstrap literal y TLS validado. Se mantienen seis trabajadores seguros, dos de sistema, cola acotada de 128, caché de 64 hosts/60 s y plazo global 3,5 s. Las alternativas pendientes se cancelan tras la primera respuesta válida; no garantiza consultar los 17 en cada operación. Respuestas de bloqueo y rangos privados descartados como en Windows; IPv6 público del sistema continúa admitido.
- 28 pruebas unitarias y 9 instrumentadas aprobadas, cero fallos/errores/omisiones, en el segundo intento del mismo código: https://github.com/mbrionesz/infotv/actions/runs/45665589273/attempts/2 . El primer intento tuvo tres fallos de foco/navegación en el emulador; se repitió la suite completa sin modificar el código ni omitir pruebas. El artefacto del intento exitoso es `15047823340`.
- Siete pruebas DNS incluyen alternativa del resolutor 17 cuando fallan los anteriores y rechazo de respuestas de bloqueo. Son pruebas con resolutores simulados; la paridad de configuración no certifica disponibilidad/latencia de cada proveedor desde la conexión del usuario.
- APK release optimizado/R8, lint, firma v2/v3 y alineación 16 KiB verificados. Mismo certificado que beta 4; APK universal de 4.735.472 bytes. SHA-256: `0f63b520b7c2995f1958fb3a1d5a5f6a0ebc1b7914b2102aef69ce12bc980c8f`.
- Publicación exitosa: https://github.com/mbrionesz/infotv/actions/runs/45668621520 . Descarga: https://github.com/mbrionesz/infotv/releases/tag/v0.1.1-android-beta.5 . Se transfieren solo APK público y comprobantes, sin keystore.
- Las pruebas instrumentadas usan debug y contenido local. Release optimizado compilado/verificado, pendiente de pruebas físicas y tiempos reales de carga del portal. No se promete una mejora de velocidad por aumentar el número de resolutores. Perfil, historial, preferencias, búfer y diseño de beta 4 conservados; `magis.js` sin cambios.

## Registro anterior: beta 4

# XuperAndroid 0.1.1 beta 4: verificación

- Fuente validada: `b3aaf70de44e4342721ce00267a0adcd0448dc3f`.
- DNS: Cloudflare, Google y Quad9 en paralelo, DNS Android diferido, plazo global 3,5 s, caché de 64 hosts/60 s y ejecutores/colas separados y acotados. TLS validado y bootstrap por IP. Cinco pruebas cubren lentitud, fallos, respuestas vacías, deadline y caché; no miden proveedores reales desde la red del usuario.
- Perfil del portal alineado con el cliente compartido archivado: spkgVer/sysVersion `2024-09-10 06:25:30_33_13_`, sdkVer de protocolo 33, apkVersion 49902 y apkVer 43404. Prueba de contrato añadida. Sesiones de otro perfil se renuevan con la identidad propia, conservando biblioteca/preferencias. `companion/lib/magis.js` sin cambios.
- Primeros resultados visibles antes de finalizar metadatos opcionales; carga inicial limitada a 60 s. Consultas concurrentes de categorías de la misma sección comparten exclusión mutua/caché, evitando la doble petición inicial de VOD.
- 26 pruebas unitarias y 9 instrumentadas aprobadas, sin fallos/errores/omisiones: https://github.com/mbrionesz/infotv/actions/runs/45661511276 . Incluye reproducción, PiP, navegación táctil/D-pad, pantalla estrecha, contraste y 16 capturas.
- Release optimizado/R8 y lint correctos; firma v2/v3 y alineación 16 KiB verificadas. Certificado público idéntico al de beta 3. APK universal de 4.735.472 bytes, SHA-256 `6df2f30d753c1c0bfec35343a0b0a0d6c4f96ef03659c1a51425f8daf28b7310`.
- Publicación exitosa: https://github.com/mbrionesz/infotv/actions/runs/45662760770 . Descarga pública verificada con el mismo SHA-256: https://github.com/mbrionesz/infotv/releases/tag/v0.1.1-android-beta.4 . Solo se transfieren APK público y comprobantes; keystore local.
- Las pruebas de interfaz usan debug y contenido local. APK release compilado/verificado, pendiente de pruebas físicas. No se confirmó la causa exacta ni la mejora de tiempos del portal real en la conexión del usuario; DNS, perfil y espera de metadatos son diferencias observadas en el código, no diagnósticos probados del dispositivo.

## Registro anterior: beta 3

# XuperAndroid 0.1.1 beta 3: verificación

- Fuente validada: `b0725a339824de14a68cfdce0701770c80d57d6d`.
- Cabecera compacta de tablet/TV: navegación limitada a 520 dp, iconos de 20 dp, logo de 36 dp y áreas de interacción de 48 dp. Ventanas menores de 720 dp conservan la cabecera en dos filas. Contador, historial y funciones existentes conservados.
- 20 pruebas unitarias y 9 instrumentadas aprobadas, cero fallos, errores u omisiones: https://github.com/mbrionesz/infotv/actions/runs/45652342427 . Incluye PiP, reproducción, navegación táctil/D-pad, pantalla estrecha, contraste y 16 capturas de emulador.
- Release optimizado y lint correctos; firma v2/v3 y alineación de 16 KiB verificadas. Mismo certificado de desarrollo que beta 1; actualización sin reinstalación limpia.
- APK universal: 4.735.472 bytes, SHA-256 `9e99aa2eee56529638a03c2317eaf3e5dd4af0298560cb2945b6c4988c293278`.
- Publicación exitosa: https://github.com/mbrionesz/infotv/actions/runs/45653287670 . Se suben solo APK público, SHA256SUMS.txt y build-info.json. Keystore privado local.
- Descarga: https://github.com/mbrionesz/infotv/releases/tag/v0.1.1-android-beta.3 . Incluye los cambios de beta 2, cuya publicación quedó en borrador por un fallo temporal del servicio.
- Las capturas y pruebas instrumentadas usan debug y contenido local identificado como prueba. Release optimizado compilado y verificado, pendiente de pruebas físicas. No certifica cada modelo, códec ni CDN del portal.

## Registro anterior: beta 2

# XuperAndroid 0.1.1 beta 2: verificación

- Fuente validada: `dee82646b3288a26e7492e757769046b578d1b82`.
- 20 pruebas unitarias y 9 instrumentadas aprobadas: cero fallos, errores u omisiones. Android API 35 Google APIs con aceleración; PiP se ejecuta primero en la pantalla original y las otras ocho pruebas a continuación.
- Evidencia: https://github.com/mbrionesz/infotv/actions/runs/45645971515 . Incluye contraste real, límites de navegación a 320 dp, foco inicial/retorno al menú y 16 capturas de teléfono, tablet y TV.
- APK universal optimizado: 4.735.472 bytes. Firma v2/v3 y alineación 16 KiB verificadas. Mismo certificado de desarrollo que beta 1.
- SHA-256: `12fbfc6edfa3419e3f458611c4409683401556c317c92c6f42b99ddfe82138be`.
- Publicación pendiente: https://github.com/mbrionesz/infotv/actions/runs/45648438226 . Todas las verificaciones pasaron; GitHub devolvió HTTP 502 al subir los archivos públicos. La release permanece en borrador y se conserva el payload público para reintentar, sin claves privadas.
- Las capturas usan contenido local de prueba. No certifican hardware TCL/Lenovo físico, cada CDN, todos los códecs ni sesiones de reproducción prolongadas. Las pruebas instrumentadas ejecutan debug; el APK release está compilado y verificado, pendiente de prueba física.

## Registro anterior: beta 1

# XuperAndroid 0.1.1 beta 1: verificación

- Fuente de la beta: `94711491eceb24981c55343329e30309dd7e2b09`.
- **20 pruebas unitarias aprobadas**, cero fallos/errores/omisiones: políticas de audio/progreso/datos, cifrado/firma del portal y autorización por origen, historial acotado de conteos y lectura de FHD/UHD/resoluciones/FPS fraccionarios.
- **6 pruebas instrumentadas aprobadas**, cero fallos/errores/omisiones, Android 15/API 35 Google APIs con sistema completo: navegación táctil/ajustes/búsqueda; H.264/AAC y menú de pistas; tablet y D-pad/TV; favoritos y similares; renovación conservando pausa/posición; PiP con avance real del tiempo, vuelta a pantalla completa y exclusión de TV.
- Evidencia reproducible: https://github.com/mbrionesz/infotv/actions/runs/45552687664 . La imagen reducida ATD no incluye PiP; por eso la beta se valida con la imagen completa y no se omite ese caso.
- Compilación debug y release optimizada/R8, lint y alineación de 16 KiB completados. APK de 4.735.472 bytes (4,52 MiB), firma v2/v3 verificada; certificado idéntico al de la alpha local para permitir actualizarla.
- Publicación verificada: https://github.com/mbrionesz/infotv/actions/runs/45553513023 . El workflow exige la ejecución exitosa del mismo commit, verifica SHA-256, firma y alineación antes de publicar. Se transfiere únicamente el APK ya firmado y sus datos públicos; el keystore privado permanece local.
- Descarga: https://github.com/mbrionesz/infotv/releases/tag/v0.1.1-android-beta.1 . Se publican APK, SHA256SUMS.txt y build-info.json. La firma sigue siendo de desarrollo, no de distribución definitiva/Play Store.

Las pruebas instrumentadas utilizan el build debug y contenido local identificado como prueba. El release optimizado está compilado y verificado, pendiente de prueba física. Esto no certifica la autorización real de cada CDN, reproducción de 45–120 minutos, todos los códecs, TCL/Lenovo físicos ni cada versión de Android. Los objetivos de memoria/búfer están acotados; no se promete una reserva idéntica a VLC/libmpv.

PiP solo está habilitado en teléfono/tablet que lo soporten. Android TV/Google TV no muestra el botón ni activa PiP al salir. No se solicita permiso de superposición.

## Registro anterior: primera alpha

- Nombre visible XuperAndroid; revisión de código UI sin textos Samsung, Tizen o Windows.
- Compilación debug y release optimizada, pruebas unitarias y lint completados.
- 11 pruebas unitarias: políticas de progreso, audio, datos celulares y equivalencia de cifrado/firma con el JavaScript existente; autorización por origen y rechazo HTTP fuera del alcance permitido.
- 3 pruebas instrumentadas aprobadas en Android 15 / API 35: navegación táctil/ajustes/búsqueda; H.264/AAC local con Media3 y apertura de audio/subtítulos; cambio de dimensiones a tablet/TV y cambio entre TV/Películas/Series por foco y D-pad.
- Ejecución: https://github.com/mbrionesz/infotv/actions/runs/45547487275
- APK universal optimizado de aproximadamente 4,5 MiB, firma de desarrollo verificada y comprobación zipalign de 16 KiB. Las pruebas instrumentadas usan el build debug; el release optimizado está compilado y verificado, pendiente de prueba física.

No certifica TCL o Lenovo P11 físicos, Android 8/17 reales, variantes de códec de cada fabricante ni reproducción autenticada del portal. El contenido local se identifica como prueba y no se presenta como contenido real del catálogo. El emulador local sin aceleración sufrió un ANR de arranque; la validación reproducible se completó en CI con aceleración, sin extrapolar su rendimiento a equipos físicos.

La optimización de conexión no tiene selector de modos. Se utiliza el transporte Android, presupuesto de calidad inicial en conexiones celulares y adaptación de Media3 cuando hay variantes. No cambia las bandas del módem ni transcodifica fuentes fijas. El presupuesto se aplica al abrir el vídeo.
