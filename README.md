# XuperTizen 0.5.5 alpha

Widget autónomo para Samsung Tizen, con **Tizen 4.0 como requisito mínimo** y
versiones 4–9+ como objetivo de pruebas. Se instala con **Apps2Samsung**. No
necesita un PC encendido ni el servicio Node/FFmpeg durante el uso.

**Alfa pendiente de nueva prueba en TV.** En el QN55QN70FAGXZS con Tizen 9,
el usuario confirmó que la versión 0.2 carga la lista de canales, pero los menús van lentos
y la reproducción termina esperando 20 segundos. La 0.3 corrige trabajo excesivo
de la interfaz y añade diagnóstico por etapa; todavía no confirma la reproducción
de esos canales en hardware. Tizen 4–9+ es un objetivo, no una certificación.

## DNS integrado experimental en 0.4

Ahora hay un transporte WebAssembly/cURL empaquetado para **portal y HLS**, que
conecta a IP resuelta por DoH conservando Host/SNI y TLS verificado. Requiere
Tizen Sockets Extension; si no está disponible, vuelve a XHR/DNS del TV y lo
informa. **Pendiente de prueba en el QN70F; no se garantiza que se active.**

La distribución es experimental: el SDK usa ramas antiguas de cURL/OpenSSL sin
mantenimiento actual; hace falta modernizarlas antes de una entrega estable.
[Alcance, pruebas y limitaciones del DNS integrado](docs/DNS-INTEGRADO.md).

## Qué incluye

- Frontend aprobado: tema oscuro/menta, navegación con mando, «By MatiasB» en el
  menú y «XuperTizen by Matias» en el panel de búsqueda/selección de canales.
- Foco actualizado sobre botones reutilizados, controles del catálogo cacheados
  y repetición de flechas limitada a 65 ms para evitar acumulación; las pulsaciones
  individuales se procesan inmediatamente. Métricas reales de la sesión en Diagnóstico.
- Recuperación HLS con hasta tres CDN, cada uno con sus credenciales; plazo global
  de arranque de 30 s. No se reutiliza la autorización de otro servidor.
- Guía en tres columnas con un máximo de 12 filas de canales en pantalla,
  vista previa, favoritos y paso a pantalla completa. Catálogo paginado de 36
  tarjetas, filtros por metadatos disponibles y teclado QWERTY con historial.
- Protocolo, TripleDES e índice de catálogo en un Web Worker empaquetado.
  IndexedDB guarda metadatos y miniaturas con caducidad y límites; no guarda
  sesiones ni licencias de reproducción. No se promete una cantidad de títulos:
  la prueba de 21.000 entradas utiliza datos sintéticos.
- Protocolo del catálogo y sesión adaptado de Node a JavaScript del widget:
  transporte XHR, 3DES/MD5 del protocolo, caché local y generación aleatoria segura.
  Sin descarga de sesiones prestadas ni dependencia de `localhost`.
- **HLS.js 1.6.19** empaquetado dentro del WGT: HLS con cabeceras de autorización
  en listas, segmentos y claves; ABR automático, buffer acotado y limpieza
  al cambiar de señal. Requiere MSE y permiso CORS del origen cuando corresponda.
- **AVPlay** detectado en el dispositivo para fuentes que su API puede abrir.
  Los canales con cabeceras arbitrarias usan HLS.js: no se ignora la autorización
  al pasar una URL al reproductor nativo.
- Diagnóstico de capacidades de H.264/HEVC/AAC/AC-3/E-AC-3/DTS. HLS.js remultiplexa;
  **no convierte audio ni vídeo a códecs que el Samsung no tenga**.

## Instalar y descubrir con Apps2Samsung

Consulta [instalación](docs/INSTALAR-WINDOWS.md). El artefacto de esta versión es:

`dist/XuperTizen-0.5.5-alpha-Tizen4plus-UNSIGNED.wgt`

Apps2Samsung admite importar un WGT propio y gestionar firma/instalación según
su README actual. La actualización se distribuye sin firma; la versión anterior sí fue instalada por el usuario.
Los certificados se revisarán al final con el usuario.

Para descubrirlo como repositorio se necesita subir el WGT a una **GitHub
Release** de `mbrionesz/infotv` y agregar ese repo como fuente en Apps2Samsung.
Preparar el archivo local no lo publica ni lo incorpora al catálogo comunitario.
Esta actualización usa la etiqueta `v0.5.5-alpha.1`: consulta
[la release](https://github.com/mbrionesz/infotv/releases/tag/v0.5.5-alpha.1).
La inclusión en el catálogo comunitario general requiere un trámite aparte.

## Desarrollar y verificar

Node.js 22+, npm y Python 3. El televisor no necesita estas herramientas.

```sh
npm ci
npm run build
npm test
npm run test:browser
npm run package
```

La prueba de navegador necesita Chromium y FFmpeg **sólo para generar el vídeo
sintético de prueba**. Ejecuta HLS.js de verdad con H.264/AAC y autorización en
un origen local separado. El catálogo de esa prueba está simulado.

`npm start` sirve únicamente una vista previa del frontend para desarrollo.
No es un servicio requerido por el WGT instalado.

## Límites de esta alfa

- La 0.4 no tiene validación física; la 0.2 presentó los fallos descritos en el QN70F.
- CORS, cabeceras restringidas por el navegador, TLS del firmware, sesiones y
  disponibilidad del proveedor pueden impedir que cargue un canal real.
- MP4/TS progresivo que requiera cabeceras arbitrarias no está soportado por la
  ruta AVPlay de esta alfa. La ruta autenticada implementada es HLS.
- El antiguo Modo Fluido con FFmpeg se retira del WGT; no se presenta como una
  opción funcional sin su proceso externo. HLS adaptativo es una ruta distinta.
- La guía reproduce sólo al pulsar OK y cierra la vista previa antes de pasar
  a pantalla completa. La caché de catálogo no permite reproducir canales offline.
- La 0.4 añade transporte DoH para portal y HLS si existen sockets Samsung.
  AVPlay progresivo y los dispositivos sin esa extensión siguen usando DNS del TV.
- Medición local con Chromium y CPU limitada: P95 del manejo de flechas pasó de
  9,3 a 0,8 ms entre 0.3.0 y 0.3.1; en la guía pasó de 5,6 a 2,4 ms. Es un ensayo sintético, no una medida de FPS del Samsung.

[Resultados de pruebas](docs/VALIDACION.md) · [Arquitectura autónoma](docs/TIZEN-AUTONOMO.md)
· [Procedencia](docs/PORT.md) · [Licencia original](LICENSE-UPSTREAM)

La carpeta `companion` y los BAT antiguos se conservan como referencia de la
versión 0.1. No son el método de instalación ni ejecución de esta versión.
El código original es MIT; la marca/recursos de terceros conservan sus derechos.
Las licencias de HLS.js, CryptoJS y Buffer están incluidas en `app/vendor`.

[Revisión de los PDF y repositorios de referencia](docs/REFERENCIAS-RENDIMIENTO-DNS.md).

La 0.4.3 conecta HTTP/TLS por IP con la misma ruta que DoH, prueba IP alternativas
y permite recuperar el portal por XHR sin apagar la ruta nativa del vídeo de otros
orígenes. El fallback XHR utiliza DNS del TV; consultar Diagnóstico para la ruta
activa. Pendiente de prueba física de esta versión.

La 0.4.3 corrige un Range inválido que provocaba HTTP 416, recupera errores
temporales de HLS sin cambiar inmediatamente de CDN y reutiliza conexiones TLS.
[Notas y límites de validación](docs/RELEASE-0.4.3-alpha.1.md).

La 0.4.4 activa un worker HLS local para separar el procesamiento de segmentos
AES/TS del hilo principal. Si una señal ofrece varias calidades, HLS puede bajar
la calidad al detectar fotogramas perdidos. Recupera bloqueos de reproducción de
forma acotada y añade datos de buffer, fotogramas y códecs al diagnóstico.
[Notas de esta versión](docs/RELEASE-0.4.4-alpha.1.md).

La 0.5.1 retira todos los presets públicos. No se incluyen ni descargan listas
externas automáticamente. La opción Agregar Addons permite únicamente añadir una
URL M3U propia; se mantiene la renovación única de la dirección del portal tras
HTTP 404. [Notas](docs/RELEASE-0.5.1-alpha.1.md).

La 0.5.2 admite hasta cuatro candidatos CDN y prueba las direcciones del
adaptador antes de construir alternativas HTTPS. Mantiene la autorización propia
de cada host. Diagnóstico muestra cdnReceived, cdnAvailable y cdnAttempt.
[Notas y límites](docs/RELEASE-0.5.2-alpha.1.md).

La 0.5.3 actualiza HLS.js y su worker a **1.6.19**. En HLS en vivo busca 3 s de
buffer antes de empezar y 6 s para reanudar tras un atasco, respetando Pausa. Las
ventanas cortas pueden reanudar con menos buffer tras una espera limitada. Se
reintentan listas rotas en el mismo candidato antes de cambiar de CDN.
[Notas y validación](docs/RELEASE-0.5.3-alpha.1.md).

La 0.5.4 corrige una regresión del buffer de 0.5.3: deja que HLS gestione los
huecos entre rangos y no pausa por waiting si ya tiene 6 s o un play pendiente.
Reintenta AbortError interno de forma limitada. Diagnóstico conserva hechos de
la respuesta de lista antes de parsearla para investigar TARGETDURATION.
[Notas](docs/RELEASE-0.5.4-alpha.1.md).

La 0.5.5 añade Quad9 (9.9.9.9 y 149.112.112.112), resolución/códecs/FPS en la
información del canal y texto de canales de 16 px en la guía. Se distinguen FPS
declarados de FPS medidos y no se presentan ceros como mediciones válidas.
[Notas](docs/RELEASE-0.5.5-alpha.1.md).
