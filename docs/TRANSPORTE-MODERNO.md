# Transporte Samsung modernizado, con DNS integrado

Incorporado en la serie 0.8 beta y ampliado a 17 resolutores en 0.8.5. Las pruebas de laboratorio no sustituyen la validación física en el Samsung QN70F.

## Qué cambió

| Componente | Anterior | Nuevo |
| --- | --- | --- |
| cURL | 7.68.0 | 8.23.0 |
| OpenSSL | 1.1.1w | 3.5.9 LTS |
| zlib | 1.2.8 del SDK | 1.4 |
| Compilador/bindings | Samsung Emscripten 1.39.4.7 | El mismo SDK, para conservar Tizen Sockets Extension |

Las bibliotecas se compilan desde archivos oficiales con SHA-256 fijados en `native/dependencies.json`. No se utilizan los puertos `USE_CURL`/`USE_SSL` del SDK, que incorporaban las versiones antiguas. El módulo informa las versiones realmente enlazadas mediante `net_build_info()`, expuestas en `XuperNativeTransport.snapshot().libraries` y en Diagnóstico.

## DNS conservado

Se conservan las ocho IP originales, las seis añadidas en 0.8.4 y se suman tres IP de dos proveedores en 0.8.5. Control D usa el endpoint wire `/p0`; los demás utilizan `/dns-query`.

| Proveedor | Direcciones | Host/SNI HTTPS |
| --- | --- | --- |
| Cloudflare | 1.1.1.1, 1.0.0.1 | cloudflare-dns.com |
| Google | 8.8.8.8, 8.8.4.4 | dns.google |
| AdGuard | 94.140.14.14, 94.140.15.15 | dns.adguard-dns.com |
| Quad9 | 9.9.9.9, 149.112.112.112 | dns.quad9.net |
| NextDNS | 45.90.28.0, 45.90.30.0 | dns.nextdns.io |
| Control D | 76.76.2.0, 76.76.10.0 | freedns.controld.com |
| AliDNS | 223.5.5.5, 223.6.6.6 | dns.alidns.com |
| DNS.SB | 185.222.222.222, 45.11.45.11 | doh.dns.sb |
| Mullvad | 194.242.2.2 | dns.mullvad.net |

- DoH wire-format por IP mediante `CURLOPT_CONNECT_TO`, conservando el dominio real en URL, Host y SNI.
- TLS 1.2 o posterior, certificado y hostname verificados, CA de Mozilla empaquetadas. No se desactiva la validación.
- Carrera de los diecisiete resolutores, presupuesto de 5 s y primera respuesta IPv4 válida.
- Caché acotada de hasta 10 minutos respetando TTL; cooldown de 5 minutos tras fallo y deduplicación de consultas concurrentes.
- Se conserva el fallback anterior e informado si falta la extensión, falla DoH o falla el transporte. En ese estado el navegador puede utilizar el DNS del TV: no se declara DNS seguro activo cuando no lo está.
- Las rutas de portal, listas y vídeo mantienen el broker nativo y las credenciales correspondientes a cada origen.

## Adaptaciones necesarias del SDK

1. **Entropía:** el SDK no ofrece `getentropy`. OpenSSL se configura con `--with-rand-seed=devrandom`; los dispositivos aleatorios de Emscripten usan `crypto.getRandomValues`. El runtime generado no contiene un fallback `Math.random`.
2. **Sockets no bloqueantes:** cURL 8 crea sockets TCP con `SOCK_NONBLOCK` desde la apertura. El SDK Samsung aborta si se intenta `F_SETFL` sobre un socket. La adaptación acotada de `native/patches/curl-nonblock-tizen.patch` evita ese cambio posterior para estos sockets, que ya son no bloqueantes. Proxy, escucha de servidores y socketpair no forman parte de esta compilación. No se elimina la concurrencia de DoH para ocultar el problema.
3. **Superficie acotada:** se desactivan protocolos y módulos innecesarios, carga dinámica de proveedores OpenSSL y resolutores con hilos. El punto de entrada nativo permite únicamente HTTP/HTTPS. La resolución DoH continúa siendo IPv4/A, como en el protocolo existente.

El SDK y su compilador siguen siendo antiguos. Actualizar las bibliotecas no moderniza el firmware del TV ni constituye una garantía de riesgo cero.

## Pruebas del binario WASM real

`npm run test:native-wasm` carga exactamente `app/vendor/native/transport.js`, `.wasm` y `.data`. Una adaptación de sockets de laboratorio conecta esos imports Samsung con un servidor HTTPS local; no sustituye cURL/OpenSSL por el TLS del navegador o por el cURL del sistema.

Resultados:

- Las versiones devueltas por el binario son cURL 8.23.0, OpenSSL/3.5.9 y zlib 1.4.
- HTTPS devuelve 200 al conectar por IP a un hostname de prueba, conservando Host y SNI.
- Un hostname que no coincide con el certificado se rechaza con error cURL 60 (retorno nativo -61).
- La respuesta gzip se descomprime correctamente.
- Las diecisiete conexiones DoH se abren a las IP configuradas y puerto 443, con sockets no bloqueantes. No se usa una dirección obtenida del DNS del proveedor en esa prueba.
- El servidor DoH controlado entrega un mensaje DNS que el parser nativo valida y convierte en respuesta IPv4.

Estas son pruebas del WASM y del protocolo con sockets de laboratorio, no una prueba de los servidores públicos desde Chile ni del firmware Samsung. La confianza del certificado se configura únicamente en la memoria de la instancia de prueba; el WGT conserva su CA de Mozilla.

La suite incluye pruebas internas, la integración HLS con autorización/AES-128, MP4/TS con audio y vídeo, selección de episodios y la regresión de seguridad del frontend. Los flujos usan medios controlados.

## Reconstruir

Con el SDK oficial previamente activado y las herramientas make, Perl, patch y curl disponibles:

```sh
node tools/build-native.mjs /ruta/emscripten-release-bundle/emsdk
npm run build
npm test
npm run test:native-wasm
npm run package
```

Se pueden indicar `--work-dir` y `--output`; `EM_CACHE` y `EM_PORTS` permiten reutilizar las rutas de caché del SDK. `NATIVE_JOBS` limita los procesos de compilación a un máximo de ocho. Las descargas y la primera configuración/compilación pueden tardar varios minutos. Los pasos siguientes verifican fuentes y artefactos; los builds normales utilizan el WASM precompilado incluido en el repositorio.

Las acciones de publicación y empaquetado ejecutarán la prueba del WASM antes de generar sus archivos.

## Comprobación pendiente en el QN70F

1. Instalar una versión de revisión firmada con el perfil habitual de Apps2Samsung.
2. Abrir un canal y comprobar en Diagnóstico `available: true`, las versiones nuevas y hosts con `mode: secure-dns` y respuesta HTTP. Cargar las versiones no demuestra por sí solo que DoH o el vídeo estén funcionando.
3. Probar cambio de canales, una señal estable durante al menos 15 minutos y un título VOD.
4. Ante un fallo, conservar código y fase TCP/TLS/HTTP, sin enviar tokens o certificados privados.

Las fuentes que solo sirven HTTP continúan sin cifrado. La actualización del cliente no puede convertirlas por sí sola en HTTPS.
