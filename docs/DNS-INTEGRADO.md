# DNS integrado experimental — 0.4.0 alpha.1

La 0.3.1 sólo consultaba DoH para diagnóstico. La 0.4 añade un **transporte real**
para conectar el portal y HLS a las IP resueltas. Es una alfa experimental,
pendiente de instalación y validación física en el QN55QN70FAGXZS con Tizen 9.
No se garantiza la extensión en todos los modelos Tizen 4–9+.

## Ruta dentro del televisor

`browser/dnsx.js` → dos workers → `native/transport.cpp`, compilado con el SDK
Samsung Emscripten para Tizen Sockets Extension. El WGT incluye JS, WASM, datos CA
y licencias: no requiere Node/PC, servidor de terceros ni VPN durante el uso.
El módulo comprueba que puede crear/cerrar un socket real antes de anunciarse.
Si la extensión falta o el módulo no inicia, se conserva la ruta XHR/DNS del TV
con el motivo visible. El mínimo de instalación 4.0 no acredita el transporte
nativo en todos esos televisores.

1. Se consulta Cloudflare 1.1.1.1/1.0.0.1, Google 8.8.8.8/8.8.4.4 y AdGuard
   94.140.14.14/94.140.15.15 en paralelo mediante DNS-over-HTTPS wire-format.
2. cURL conecta por IP con `CURLOPT_CONNECT_TO`, conservando el dominio original
   en Host/SNI: cloudflare-dns.com, dns.google o dns.adguard-dns.com. Se exige
   TLS 1.2+ y certificado válido, usando CA de Mozilla empaquetadas.
3. Gana la primera respuesta IPv4 válida. Plazo global 5 s, limpieza de las seis
   transferencias, caché central acotada a 64 hosts/hasta 10 minutos respetando TTL
   y deduplicación de consultas simultáneas.
4. Si no responde ninguno, se usa el resolver del sistema durante 5 minutos.
   Ese fallback se informa; no se presenta como protección activa.
5. Las solicitudes HTTP/HTTPS del protocolo del portal pasan por ese transporte.
   cURL usa `CURLOPT_RESOLVE` para conectar a la IP segura conservando URL,
   Host/SNI y verificación del certificado del servidor original.
6. HLS.js utiliza el mismo transporte en manifiestos, variantes, segmentos y
   claves AES. Mantiene cabeceras/credenciales por CDN, rangos HTTP y limpieza.
   Un deadline limita el trabajo; callbacks de reproducción cerrada se ignoran.

Las redirecciones se resuelven de nuevo por host; no se permite HTTPS→HTTP.
Las credenciales no se reenvían automáticamente a un origen diferente. No hay
registro de tokens, URLs firmadas, sesiones o licencias en el diagnóstico.
Las sesiones prestadas/semillas siguen desactivadas en el widget.

## Qué no queda cubierto

- AVPlay administra sus propios sockets. HLS pasa por HLS.js cuando el transporte
  Samsung está disponible; AVPlay/HTML5 progresivo aún usa el DNS del TV. No se
  afirma que se haya cambiado el DNS de todo el sistema operativo.
- MP4/TS progresivo protegido con headers arbitrarios sigue sin soporte.
- Los carteles XHR directos no pasan por este transporte.
- No resuelve restricciones regionales o de autorización: `portal100024` sigue
  siendo un rechazo regional, aunque el DNS responda bien.
- El cuerpo de cada respuesta nativa se limita a 16 MiB; no es un proxy continuo
  para descargar películas completas. Cada worker comienza con 32 MiB de memoria;
  se usan hasta dos y el heap puede crecer.
- El SDK disponible es antiguo: cURL 7.68.0 y OpenSSL actualizado desde 1.1.1d a
  1.1.1w para esta compilación. **Ambas ramas carecen de mantenimiento actual.**
  Esta alfa no tiene auditoría de seguridad ni se presenta como lista para una
  distribución estable; hace falta modernizar ese toolchain/dependencias.

## Comprobarlo en la TV

Abrir un canal y después Diagnóstico (columna derecha de la guía, o Azul fuera
de ella). Amarillo consulta el estado. El informe incluye viewport, panel,
escala, versión, motor y últimos hosts, sin rutas firmadas:

- `engine: samsung-wasm-curl`: el módulo inició y superó la prueba de socket.
- `mode: secure-dns` + IP/resolutor: la petición usó la dirección obtenida por DoH.
- `httpStatus`: hubo respuesta HTTP; 401/403 pueden ser autorización, aunque la
  conexión funcione. `tlsVerified` sólo indica HTTPS completado correctamente.
- `mode: system-fallback`: se recurrió al DNS del TV.
- `engine: xhr-system-dns` y `reason`: extensión ausente/inicio fallido.

No se etiqueta una diferencia DNS como «DNS alterado» sin evidencia. No se ha
implementado comparación del resolver del sistema contra DoH; un CDN puede
responder con IP diferentes legítimamente. El estado de acceso a los seis
resolutores en una TV real también está pendiente.

## Verificación y reproducción del build

- 22 pruebas: broker, deduplicación/caché/fallback, más las pruebas anteriores.
- El mismo código C++ compilado para Linux conecta a una IP de loopback forzada,
  conserva Host/SNI y valida el certificado; se rechaza un nombre incorrecto.
  Este ensayo utiliza el cURL/OpenSSL del sistema, no el runtime Samsung.
- El binario WASM y CA empaquetados cargan bajo la CSP del WGT en Chromium con
  bindings Samsung simulados, y detectan el rechazo del socket. No simula una TV.
- Puente del protocolo probado con M3U local. HLS real AES-128 H.264/AAC decodificado
  por la ruta del cargador nativo con adaptador HTTP local; se comprueban headers
  en manifiesto/segmentos/clave. Sin canal real del proveedor validado.
- El binario Samsung compila con el SDK real. Sus sockets/TLS/DoH en el QN70F
  permanecen pendientes de prueba física; no se declara que el bloqueo esté resuelto.

Para reconstruir el módulo (SDK oficial ya descargado y extraído):

```sh
node tools/build-native.mjs /ruta/emscripten-release-bundle/emsdk
npm run build
npm test
npm run test:browser
npm run package
```

El script activa el SDK de forma local, actualiza el puerto OpenSSL con hash
SHA-512 fijado y genera hashes de fuentes/artefactos. El build normal verifica
los binarios precompilados; no requiere el SDK en cada build de GitHub Actions.
Pruebas nativas: g++, pkg-config, libcurl development y openssl. Chromium/FFmpeg
siguen siendo herramientas sólo de desarrollo.

Referencias oficiales:

- https://developer.samsung.com/smarttv/develop/api-references/webassembly-api-references/tizen-sockets-extension-api-references.html
- https://developer.samsung.com/smarttv/develop/extension-libraries/webassembly/tizen-sockets-extension/sample-curl-application-built-using-cli-tools.html
- https://developer.samsung.com/smarttv/develop/extension-libraries/webassembly/getting-started/downloading-and-installing.html
