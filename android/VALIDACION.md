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
