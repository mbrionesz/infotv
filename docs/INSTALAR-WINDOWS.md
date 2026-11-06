# Instalar XuperTizen con Apps2Samsung

La actualización autónoma es **0.5.3 alpha**. Requiere como mínimo Tizen 4.0
en el manifiesto. Su aceptación y funcionamiento en cada TV siguen pendientes
hasta probar el dispositivo. No requiere Windows ni un servidor durante el uso.

1. Descarga Apps2Samsung desde su repositorio oficial o instala en Windows con
   `winget install Apps2Samsung.Apps2Samsung` según su README.
2. Conecta el PC y el Samsung a la misma red sin aislamiento de clientes.
3. En Apps del televisor abre Developer Mode (`12345`, si el firmware lo admite),
   actívalo, indica la IP del PC instalador y reinicia la TV según Samsung.
4. En Apps2Samsung elige el televisor e importa
   `XuperTizen-0.5.3-alpha-Tizen4plus-UNSIGNED.wgt` como archivo propio.
5. Sigue los pasos de firma/instalación de Apps2Samsung. Su README indica que
   puede gestionar los certificados. Revisaremos ese paso al final; la firma debe corresponder al dispositivo que instale la actualización.
6. Abre XuperTizen desde la TV. No debe pedir IP de PC, código de enlace ni
   `INICIAR-SERVICIO.bat`. Esos pasos pertenecían a la versión anterior.

## Agregar nuestro repositorio como fuente

Apps2Samsung admite repositorios/releases y enlaces WGT como fuentes propias.
Una vez exista una GitHub Release con el WGT adjunto, agrega
`github.com/mbrionesz/infotv` desde sus fuentes. La CLI documenta:

```text
apps2samsung-cli sources add github.com/mbrionesz/infotv
```

`apps2samsung-source.json` es una propuesta de proveedor con el esquema 2 del
catálogo público consultado. Su importación específica como feed no se ha probado.
La ruta más sencilla para esta alfa es importar el WGT local. La inclusión en
el catálogo comunitario general depende de Apps2Samsung y no es automática.
Esta actualización corresponde a
https://github.com/mbrionesz/infotv/releases/tag/v0.5.3-alpha.1.

## Primera prueba en el Samsung

Verifica arranque, mando, búsqueda, catálogo real y un canal H.264/AAC. Si carga,
prueba cambio de canal, pausa, regreso al menú, reapertura y 15 minutos continuos.
Después comprueba las otras combinaciones de códec que ofrezca el proveedor.
En Ajustes → Diagnóstico comprueba la conectividad y conserva el mensaje de
error sin compartir tokens ni certificados privados.

La comprobación CORS del portal devolvió `403 Invalid CORS request`. Si el widget
instalado también queda bloqueado, la versión no puede declararse funcional con
ese proveedor. HLS.js no elimina CORS, firmas, autorización ni límites del códec.

## Referencias consultadas

- https://github.com/Apps2Samsung/Apps2Samsung/tree/beta (README actual de la aplicación).
- https://raw.githubusercontent.com/Apps2Samsung/Apps2Samsung/main/third-party-apps.json (esquema del catálogo).
- https://developer.samsung.com/smarttv/develop/api-references/samsung-product-api-references/avplay-api.html
- https://github.com/video-dev/hls.js/tree/v1.6.19 (versión empaquetada).

Después de instalar 0.4, comprobar el motor/estado DNS según [DNS integrado](DNS-INTEGRADO.md).
