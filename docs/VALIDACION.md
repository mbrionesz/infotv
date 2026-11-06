# Validación de XuperTizen 0.2.0 alpha

Pruebas realizadas en Linux/Chromium. No constituyen una prueba de Samsung ni
una certificación de Tizen 4–9+.

| Comprobación | Resultado |
|---|---|
| Inicio autónomo, sin formulario de PC ni llamadas RPC a companion | Aprobado en Chromium |
| HLS.js 1.6.15: H.264/AAC MPEG-TS AES-128 → MSE | Vídeo sintético decodificado, tiempo de reproducción avanza |
| Origen de vídeo distinto al frontend | Aprobado con CORS habilitado en el servidor local de prueba |
| Autorización Content-Auth/Content-License | Comprobada en manifiestos, segmentos y clave AES; peticiones sin cabeceras se rechazan |
| Pausa/reanudación, cambio de canal, cierre, menú, Return y leyenda | Aprobados en navegador |
| CSP del manifiesto aplicada a la prueba de navegador | Verificada junto con HLS.js/worker |
| AVPlay: apertura, rectángulo, pausa/play, seek, audio y cierre | Prueba con API Samsung simulada aprobada; sin hardware |
| 3DES/ECB/PKCS7 y MD5 del protocolo | Comparados con Node/OpenSSL, incluyendo UTF-8 y límites de bloque |
| Pruebas unitarias totales | 7 aprobadas: 3 de la adaptación actual y 4 de la pasarela histórica |
| npm audit | 0 vulnerabilidades reportadas en la consulta realizada |
| Bundle | Compilado para Chrome 56; requisito mínimo 4.0 en config.xml |
| Portal real: conectividad | Endpoint respondió; no es el anterior fallo de conexión del sandbox |
| Portal real: preflight | HTTP 403, cuerpo «Invalid CORS request» |
| Portal real: activación anónima mediante transporte de diagnóstico | Rechazo portal100024 (región). Sin rescate por sesiones prestadas |
| Catálogo y canal del proveedor dentro del WGT | Pendientes, no validados |
| Apps2Samsung y certificados | README/forma de catálogo revisados. Instalación y firma sin ejecutar |
| Tizen 4/5/6/7/8/9+ y Samsung QN70F | Sin prueba física |
| HEVC, AC-3, E-AC-3, DTS | Capacidades consultables; reproducción no validada |
| Fluidez sostenida y consumo de memoria en TV | Pendientes de medir |

Repetir desde la raíz:

```sh
npm ci
npm run build
npm test
npm run test:browser
npm run package
```

La prueba de navegador utiliza FFmpeg para generar un clip local, no para
reproducir dentro del WGT. El catálogo de esa prueba está simulado. La captura
`standalone-hls-test.png` muestra ese patrón de prueba, no un canal del proveedor.

`node tools/probe-provider.mjs` es un diagnóstico opcional de red por curl y el
proxy configurado; no forma parte del WGT ni demuestra que XHR/CORS funcione en
Samsung. Imprime estados, no tokens ni URLs firmadas.

Las pruebas históricas de companion se conservan para comprobar la referencia
0.1 y no se contabilizan como validación de la independencia del PC.
