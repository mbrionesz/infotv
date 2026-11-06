# XuperTizen 0.2.0 alpha

Widget autónomo para Samsung Tizen, con **Tizen 4.0 como requisito mínimo** y
versiones 4–9+ como objetivo de pruebas. Se instala con **Apps2Samsung**. No
necesita un PC encendido ni el servicio Node/FFmpeg durante el uso.

**Es una alfa, sin validar en televisores físicos.** El canal del proveedor
original todavía no está verificado: una consulta OPTIONS al portal devolvió
`403 Invalid CORS request`. Hay que comprobar su acceso desde el widget instalado.
La activación anónima también fue rechazada por región (`portal100024`) desde
esta máquina. No se declara compatibilidad certificada con todos los modelos o códecs.

## Qué incluye

- Frontend aprobado: tema oscuro/menta, navegación con mando, «By MatiasB» en el
  menú y «XuperTizen by Matias» en el panel de búsqueda/selección de canales.
- Protocolo del catálogo y sesión adaptado de Node a JavaScript del widget:
  transporte XHR, 3DES/MD5 del protocolo, caché local y generación aleatoria segura.
  Sin descarga de sesiones prestadas ni dependencia de `localhost`.
- **HLS.js 1.6.15** empaquetado dentro del WGT: HLS con cabeceras de autorización
  en listas, segmentos y claves; ABR automático, buffer acotado, worker y limpieza
  al cambiar de señal. Requiere MSE y permiso CORS del origen cuando corresponda.
- **AVPlay** detectado en el dispositivo para fuentes que su API puede abrir.
  Los canales con cabeceras arbitrarias usan HLS.js: no se ignora la autorización
  al pasar una URL al reproductor nativo.
- Diagnóstico de capacidades de H.264/HEVC/AAC/AC-3/E-AC-3/DTS. HLS.js remultiplexa;
  **no convierte audio ni vídeo a códecs que el Samsung no tenga**.

## Instalar y descubrir con Apps2Samsung

Consulta [instalación](docs/INSTALAR-WINDOWS.md). El artefacto de esta versión es:

`dist/XuperTizen-0.2.0-alpha-Tizen4plus-UNSIGNED.wgt`

Apps2Samsung admite importar un WGT propio y gestionar firma/instalación según
su README actual. Nuestro paquete aún no se ha firmado ni instalado en la TV.
Los certificados se revisarán al final con el usuario.

Para descubrirlo como repositorio se necesita subir el WGT a una **GitHub
Release** de `mbrionesz/infotv` y agregar ese repo como fuente en Apps2Samsung.
Preparar el archivo local no lo publica ni lo incorpora al catálogo comunitario.
La primera alfa usa la etiqueta `v0.2.0-alpha.1`: consulta
[la release](https://github.com/mbrionesz/infotv/releases/tag/v0.2.0-alpha.1).
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

- Sin validación en Tizen 4, 5, 6, 7, 8, 9 o posteriores ni en el QN70F.
- CORS, cabeceras restringidas por el navegador, TLS del firmware, sesiones y
  disponibilidad del proveedor pueden impedir que cargue un canal real.
- MP4/TS progresivo que requiera cabeceras arbitrarias no está soportado por la
  ruta AVPlay de esta alfa. La ruta autenticada implementada es HLS.
- El antiguo Modo Fluido con FFmpeg se retira del WGT; no se presenta como una
  opción funcional sin su proceso externo. HLS adaptativo es una ruta distinta.
- La vista previa automática de canales en el inicio está desactivada para no
  iniciar dos decodificadores/sesiones; OK abre la reproducción completa.

[Resultados de pruebas](docs/VALIDACION.md) · [Arquitectura autónoma](docs/TIZEN-AUTONOMO.md)
· [Procedencia](docs/PORT.md) · [Licencia original](LICENSE-UPSTREAM)

La carpeta `companion` y los BAT antiguos se conservan como referencia de la
versión 0.1. No son el método de instalación ni ejecución de esta versión.
El código original es MIT; la marca/recursos de terceros conservan sus derechos.
Las licencias de HLS.js, CryptoJS y Buffer están incluidas en `app/vendor`.
