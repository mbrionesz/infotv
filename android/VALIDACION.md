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
