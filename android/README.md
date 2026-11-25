# XuperAndroid · 0.1.0 alpha 1

Cliente **nativo Kotlin + Compose + Media3**. Comparte los contratos y la identidad de XuperTizen/XuperWindows; no usa Electron, un reproductor externo ni una WebView para la interfaz.

## Alcance de esta primera implementación

- Móvil, tablet y Android TV/Google TV: TV, Películas, Series, lupa y ajustes. Inicio en Películas; en TV los tabs se activan al recibir foco.
- Catálogo paginado (36 títulos), categorías por géneros y países anunciados por el portal, ficha, temporadas, episodios y búsqueda con filtros. No descarga 50.000 títulos para pintar la portada ni guarda consultas.
- Media3 para VOD y TV; salto por tiempo cuando el medio lo permite, audio, subtítulos, fuentes/tamaños/colores, resolución/FPS observados y reserva en segundos. Controles traslúcidos en el mismo árbol nativo, ocultación a los tres segundos y botón de siguiente episodio solo en series.
- Room: progreso separado por tipo, episodios y favoritos; DataStore: preferencias; Keystore: sesión propia cifrada. No persiste enlaces de vídeo autorizados ni importa sesiones ajenas.
- Progreso de «Seguir viendo», eliminación por pulsación larga, pausa al ir a segundo plano, foco de audio y desconexión de audífonos. Girar la pantalla conserva el ViewModel/reproductor.
- Caché de imágenes de 8/16 MiB en RAM y 20 MiB en disco; reserva de vídeo objetivo de 30/60 s con presupuesto de 12/32 MiB según memoria reducida. Son objetivos acotados, no una garantía de RAM total ni duración universal del búfer.
- Modo local explícito para probar interfaz y H.264/AAC/SRT sin depender del portal. Los títulos de prueba **no son el catálogo del proveedor**.

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

Los features se separan por pantallas dentro de app en esta alpha; no hay carpetas vacías que aparenten módulos implementados. El contrato CatalogRepository permite pruebas locales y evolución del portal sin reescribir la UI.

## Compilar

JDK 21, SDK Platform **37.2**, Build Tools 37.0.0. `targetSdk=37`, `minSdk=26`. El SDK de compilación menor 37.2 no obliga a actualizar el equipo a esa versión.

```sh
cd android
./gradlew :app:assembleDebug :core:model:test :core:data:testDebugUnitTest :app:lintDebug
./gradlew :app:connectedDebugAndroidTest
```

Abrir android/ en Android Studio; local.properties y las herramientas locales no se suben. El wrapper verifica SHA-256 de Gradle. El workflow Android alpha genera APK y evidencia de pruebas, sin modificar publicaciones de Tizen/Windows.

La alpha se entrega **con firma de desarrollo**, no como publicación de Play Store ni con certificado definitivo. Antes de una beta pública se debe provisionar firma privada estable y su respaldo. No comprometer claves en Git. Una firma diferente no puede actualizar una instalación previa sin migración/reinstalación.

## Transporte y alcance HTTP

HTTPS, TLS validado y DNS del sistema acotado con alternativa DoH. Se conservan credenciales por origen, incluso en segmentos HLS, y se eliminan al cruzar redirecciones de origen. Cambiar de vídeo no reutiliza el mapa de autorización del anterior.

Android bloquea HTTP por defecto. Solo dos dominios heredados ya observados (yuwc.swzablvpm.com y buec.kyalbhxgw.com) tienen excepción explícita en network_security_config.xml, y el transporte repite esa lista. Un CDN HTTP nuevo queda bloqueado hasta revisar su alcance; no se habilita HTTP global ni se transforma HTTPS en HTTP para sortear errores.

## Próximas validaciones y pendientes

- Dispositivos físicos, TV/VOD prolongados, 45–120 min, códecs, busca aleatoria de largo alcance, suspend/resume, muerte del proceso y mando OK largo.
- Comparativa de respuestas reales con los otros clientes. La conexión real al portal no queda certificada por un test de fixture.
- Contador/historial del universo del catálogo, diagnósticos de red avanzados, colección de favoritos navegable, similares, renovación de autorización durante una reproducción larga, PiP y firma de distribución. La alpha guarda favoritos pero no tiene aún una pantalla propia para recorrerlos.
- La búsqueda de canales y los filtros combinados de búsqueda se aplican a las páginas consultadas; no se presentan como índice exhaustivo local. Se conserva «Cargar más».

Ver docs/ARQUITECTURA-ANDROID-Y-TIZEN10.md para la decisión original y las fuentes oficiales. El protocolo se adapta de companion/lib/magis.js, cuyo archivo original permanece intacto; conservar LICENSE-UPSTREAM.
