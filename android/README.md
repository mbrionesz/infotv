# XuperAndroid · 0.1.1 beta 5

Cliente **nativo Kotlin + Compose + Media3**. Comparte los contratos y la identidad de XuperTizen/XuperWindows; no usa Electron, un reproductor externo ni una WebView para la interfaz.

## Novedades de beta 5

- Los mismos 17 endpoints DoH (9 proveedores) que Windows y el transporte nativo Samsung/Tizen, con idénticas IP, hostname TLS y ruta. Se genera la lista Kotlin al compilar desde `desktop/resolvers.json`, sin mantener una copia manual en Android.
- Bootstrap por IP para cada endpoint y TLS validado. Se mantienen seis trabajadores de DNS seguro, dos de sistema, cola acotada de 128 tareas y plazo global de 3,5 s; se cancelan las alternativas pendientes tras una respuesta válida. No garantiza consultar los 17 antes del plazo ni que más resolutores reduzcan la latencia en cualquier red.
- Descarta respuestas de bloqueo y direcciones privadas como el resolutor Windows, permitiendo que otra alternativa responda.
- Prueba adicional de alternativa final: el resolutor 17 puede responder cuando fallan los anteriores. Conserva las correcciones de perfil, sesión y carga de beta 4.

## Novedades de beta 4

- Perfil de portal alineado con el cliente compartido archivado: spkgVer/sysVersion de 2024, sdkVer de protocolo 33 y cabeceras coherentes. Las sesiones de otro perfil se renuevan sin borrar historial/favoritos.

- DNS seguro en paralelo mediante Cloudflare, Google y Quad9, con bootstrap por IP y DNS Android como alternativa diferida. Espera global de 3,5 s, caché de 64 hosts/60 s y pools/colas acotados. Un DNS del sistema bloqueado no ocupa los trabajadores de DNS seguro. Se mantiene validación TLS y nombres originales de los hosts.
- Las peticiones concurrentes de categorías de la misma sección se comparten mediante exclusión mutua y caché, evitando la doble consulta inicial en Películas/Series.
- La primera página aparece sin esperar categorías/filtros opcionales; carga del catálogo limitada a 60 s y cancelación al cambiar/paginar. No afirma resolver errores de perfil o autorización del portal.
- Pruebas de DNS cubren proveedor lento, respuesta vacía, alternativa del sistema, plazo global y caché.

## Novedades de beta 3

- Cabecera de tablet/TV compacta: navegación limitada a 520 dp, iconos de 20 dp y logo de 36 dp, manteniendo objetivos de interacción de 48 dp y foco visible. En ventanas menores de 720 dp usa dos filas para evitar apretar la marca y los controles.
- Se conserva el contador del portal, su historial y todas las funciones de beta 2.

## Novedades de beta 2

- TV, Películas, Series y búsqueda en un bloque común, con disposición adaptativa para teléfono, tablet y TV. Ajustes y Mi lista permanecen accesibles a la derecha.
- Contraste claro heredado en todas las pantallas, paleta neutra compartida y controles coherentes; logo X conservado.
- Foco inicial en Películas y navegación con mando corregidos; búsqueda accesible incluso a 320 dp. PiP solo móvil/tablet.
- Capturas reales de emulador en los tres formatos, con contenido local identificado como prueba. Ver [VALIDACION.md](VALIDACION.md).

## Funciones implementadas

- Móvil, tablet y Android TV/Google TV: TV, Películas, Series, lupa y ajustes. Inicio en Películas; en TV los tabs se activan al recibir foco.
- Catálogo paginado (36 títulos), categorías por géneros y países anunciados por el portal, ficha, temporadas, episodios y búsqueda con filtros. No descarga 50.000 títulos para pintar la portada ni guarda consultas.
- Media3 para VOD y TV; salto por tiempo cuando el medio lo permite, audio, subtítulos, fuentes/tamaños/colores, resolución/FPS observados y reserva en segundos. Controles traslúcidos en el mismo árbol nativo, ocultación a los tres segundos y botón de siguiente episodio solo en series.
- Room: progreso separado por tipo, episodios y favoritos; DataStore: preferencias; Keystore: sesión propia cifrada. No persiste enlaces de vídeo autorizados ni importa sesiones ajenas.
- Progreso de «Seguir viendo», eliminación por pulsación larga, PiP solo en teléfono/tablet compatibles, pausa al ir a segundo plano fuera de PiP, foco de audio y desconexión de audífonos. Girar la pantalla conserva el ViewModel/reproductor.
- Caché de imágenes de 8/16 MiB en RAM y 20 MiB en disco; reserva de vídeo objetivo de 30/60 s con presupuesto de 12/32 MiB según memoria reducida. Son objetivos acotados, no una garantía de RAM total ni duración universal del búfer.
- Modo local explícito para probar interfaz y H.264/AAC/SRT sin depender del portal. Los títulos de prueba **no son el catálogo del proveedor**.

Novedades de beta 1:

- Mi lista navegable (películas, series y canales), similares por género y favoritos de TV.
- Conteo de películas + series con las mismas consultas paginadas del catálogo: se conservan únicamente totales declarados, sin sumar categorías ni inventar cifras. Historial de cinco cambios; el sexto conserva el anterior y el nuevo. Se consulta en segundo plano, sin descargar el universo completo.
- Observación semanal de versiones declaradas en respuestas de nuestra propia sesión. Sin consultas a otros clientes. No es un comprobador de APK de terceros ni garantiza que el servidor publique esos campos.
- Diagnóstico de hosts/CDN, latencias y descarga de hasta 1 MiB. Medición puntual; comparar hosts no certifica la estabilidad de una conexión a largo plazo.
- Renovación acotada de enlaces caducados, credenciales por origen, conservación de posición/pausa y selección de subtítulos durante la renovación. Alternativas de idioma del portal además de pistas internas.
- Imagen ajustada sin deformación por defecto; opciones Ampliar/Estirar. Se observa el tamaño del fotograma, sin afirmar detección de bandas negras incorporadas al archivo.
- TMDB solo para las tres imágenes del carrusel por sección; coincidencia por título/año, caché persistente positiva/negativa de 30 días y hasta 60 registros; si no hay coincidencia se conserva la imagen del portal. Clave pública autorizada por el propietario. No hay llamadas TMDB en modo de prueba.
- PiP al pulsar Inicio o el botón «Ventana flotante», exclusivamente en teléfono/tablet que lo permitan. La reproducción continúa en PiP y las opciones completas reaparecen al volver. El cierre pausa/libera según el ciclo de vida. **En Android TV/Google TV está deshabilitado** por comprobación de tipo de dispositivo, sin botón ni entrada automática. No solicita permisos de superposición.

Ver [PARIDAD.md](PARIDAD.md) para equivalencias y límites.

El portal está portado y tiene pruebas de equivalencia criptográfica contra el JavaScript archivado; la aceptación real del perfil/sesión y reproducción de cada CDN requiere pruebas en la conexión del usuario. Las restricciones regionales y de autorización se muestran como errores, no se eluden.

## Compatibilidad objetivo

| Equipo | Requisito | Validación física |
|---|---|---|
| Celular | Android 8 / API 26 o posterior | Pendiente |
| Lenovo Tab P11 / variantes | Android 8+, orientación y ventana adaptables | Pendiente; registrar generación y firmware |
| TCL Android TV / Google TV | API 26+, mando D-pad | Pendiente; registrar modelo |
| TCL Roku / Samsung Tizen | No ejecutan este APK | Cliente de su plataforma |

APK universal: armeabi-v7a, arm64-v8a, x86 y x86_64 de dependencias AndroidX. Sin motor C/C++ propio. Compatibilidad con el sistema no certifica HEVC, HDR, Dolby, 4K o todos los códecs del equipo.

## Estructura efectiva

```text
app/                 Activity, ViewModel y UI adaptativa, catálogo, ficha, ajustes y overlays
core/model/          modelos y políticas sin dependencia de Android
core/data/           protocolo Kotlin, OkHttp, sesión Keystore, Room y DataStore
core/player/         único adaptador Media3 y MediaSession
```

Los features se separan por pantallas dentro de app en esta beta; no hay carpetas vacías que aparenten módulos implementados. El contrato CatalogRepository permite pruebas locales y evolución del portal sin reescribir la UI.

## Compilar

JDK 21, SDK Platform **37.2**, Build Tools 37.0.0. `targetSdk=37`, `minSdk=26`. El SDK de compilación menor 37.2 no obliga a actualizar el equipo a esa versión.

```sh
cd android
./gradlew :app:assembleDebug :core:model:test :core:data:testDebugUnitTest :app:lintDebug
./gradlew :app:connectedDebugAndroidTest
```

Abrir android/ en Android Studio; local.properties y las herramientas locales no se suben. El wrapper verifica SHA-256 de Gradle. El workflow Android beta genera APK y evidencia de pruebas, sin modificar publicaciones de Tizen/Windows.

La beta de prueba se entrega **con firma de desarrollo**, no como publicación de Play Store ni con certificado definitivo. Para distribución definitiva se debe provisionar una firma privada estable y su respaldo. No comprometer claves en Git. Una firma diferente no puede actualizar una instalación previa sin migración/reinstalación.

## Transporte y alcance HTTP

HTTPS, TLS validado y DNS del sistema acotado con alternativa DoH. Se conservan credenciales por origen, incluso en segmentos HLS, y se eliminan al cruzar redirecciones de origen. Cambiar de vídeo no reutiliza el mapa de autorización del anterior.

Android bloquea HTTP por defecto. Solo dos dominios heredados ya observados (yuwc.swzablvpm.com y buec.kyalbhxgw.com) tienen excepción explícita en network_security_config.xml, y el transporte repite esa lista. Un CDN HTTP nuevo queda bloqueado hasta revisar su alcance; no se habilita HTTP global ni se transforma HTTPS en HTTP para sortear errores.

## Próximas validaciones y pendientes

- Dispositivos físicos, TV/VOD prolongados, 45–120 min, códecs, busca aleatoria de largo alcance, suspend/resume, muerte del proceso y mando OK largo.
- Comparativa de respuestas reales con los otros clientes. La conexión real al portal no queda certificada por un test de fixture.
- Firma de distribución definitiva/Play Store. Esta beta mantiene la firma de desarrollo de la alpha para permitir su actualización. No es una certificación de dispositivos ni de todas las rutas reales del proveedor.
- La búsqueda de canales y los filtros combinados de búsqueda se aplican a las páginas consultadas; no se presentan como índice exhaustivo local. Se conserva «Cargar más».

Ver ../docs/ARQUITECTURA-ANDROID-Y-TIZEN10.md para la decisión original y las fuentes oficiales. El protocolo se adapta de companion/lib/magis.js, cuyo archivo original permanece intacto; conservar LICENSE-UPSTREAM.

## Wi-Fi y datos celulares

Sin selector de modos. La app usa la red que proporciona Android y admite Wi-Fi y datos celulares 3G/4G/5G según el dispositivo y el operador. No cambia ni selecciona bandas del módem. En conexiones celulares se aplica un presupuesto inicial de hasta 720p, o 480p cuando el ahorro de Android está activo, si el portal ofrece esas variantes; en Wi-Fi no se impone ese límite. Media3 adapta fuentes HLS/DASH según la velocidad y variantes disponibles. Una fuente progresiva fija no se transcodifica: si solo existe 720p no se inventa 480p. El presupuesto inicial se decide al abrir el vídeo; cambiar la red no fuerza un reinicio del actual. No requiere permisos telefónicos.

## Publicación de esta beta

La validación de Android y la publicación son workflows separados. `publish-android-beta.yml` exige un run exitoso de `android-alpha.yml` correspondiente al mismo SHA de fuente y verifica el APK público ya firmado mediante SHA-256, apksigner y zipalign. El keystore no se sube a GitHub. Los tres archivos públicos se transfieren en una rama temporal que se retira después de la publicación. Ver VALIDACION.md para el run, el commit y la descarga de esta beta.
