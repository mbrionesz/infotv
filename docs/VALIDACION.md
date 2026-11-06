# Validación actual — 0.4.0 alpha.1

22 pruebas aprobadas, más integración Chromium. El transporte de sockets/DoH
Samsung aún no tiene prueba física. [Resultados y límites completos](DNS-INTEGRADO.md).

Los resultados siguientes corresponden a la 0.3.1 y se conservan como historial.

# Validación de XuperTizen 0.3.1 alpha

La prueba física disponible corresponde a **0.2**, realizada por el usuario en
QN55QN70FAGXZS, Tizen 9, firmware T-PTMFUABC-0090-1301.0: lista de canales cargada,
menús lentos y reproducción sin inicio tras 20 s. **0.3.1 todavía no probada en TV.**

| Comprobación de 0.3 | Resultado local |
|---|---|
| Pruebas unitarias | 19 aprobadas, incluidas 4 de la pasarela histórica |
| Inicio autónomo y protocolo/TripleDES en worker | Aprobados en Chromium; sin PC/RPC |
| IndexedDB | Caducidad, límites, recuperación offline acotada y actualización en segundo plano |
| Miniaturas | Reducción y reutilización de blob cacheado verificadas en Chromium |
| Catálogo de 21.000 títulos sintéticos | Índice consultable con salida paginada; no es el catálogo del proveedor |
| Guía, QWERTY y catálogo de 36 tarjetas | Aprobados con metadatos simulados |
| HLS.js H.264/AAC MPEG-TS AES-128 | Decodifica y avanza el tiempo con vídeo sintético |
| Content-Auth/Content-License | Exigidos por servidor de prueba separado en manifiesto, segmentos y clave |
| Vista previa → pantalla completa, pausa, cambio y cierre | Aprobados en navegador con UA Samsung simulada |
| HTTP 403 de manifiesto | Error temprano con etapa/estado, sin exponer los headers |
| AVPlay y rectángulo en viewport 4K | API Samsung simulada; no hardware real |
| Códecs HEVC/AC-3/E-AC-3/DTS | Sin validación física; no hay transcodificador en el WGT |
| DoH por IP | Diagnóstico de carrera/caché/cooldown probado con transporte simulado; fallo de acceso controlado en Chromium |
| Cambio del resolver de vídeo / Host / SNI personalizados | No implementado; DNS del TV |
| CDN alternativo | HTTP 403 inicial → HLS real con otras credenciales en manifiesto/segmentos/clave |
| Canal real del proveedor en 0.3 | Pendiente en TV |
| Tizen 4–9+ y Apps2Samsung con 0.3 | Pendientes en hardware |

La consulta previa desde esta nube devolvió `403 Invalid CORS request` en
preflight y `portal100024` por región al activar sesión anónima. No demuestra
que la TV tenga el mismo problema: el usuario sí obtuvo su lista con la 0.2.

## Comparación de navegación

Chromium con CPU limitada ×6 y 2.000 canales simulados, mismo escenario:

| Métrica | 0.2 | 0.3 |
|---|---:|---:|
| Nodos DOM | 10.188 | 543 |
| Filas de inicio | 2.000 | 24 |
| Manejo de tecla P95 | 97,3 ms | 10,4 ms |
| Espera hasta siguiente frame P95 | 587,3 ms | 17,8 ms |
| Filas en guía nueva | — | 12 |

Registros en [benchmarks](benchmarks/). Son tiempos locales de un escenario
sintético; no acreditan 60 FPS, consumo de memoria o latencia en un Samsung.
El script `tools/bench-navigation.mjs` permite repetir el escenario.

```sh
npm ci
npm run build
npm test
npm run test:browser
npm run package
```

Chromium y FFmpeg se necesitan sólo en desarrollo para generar la señal de
prueba. El catálogo y canales de las capturas están simulados. Las pruebas de
companion no se presentan como evidencia de funcionamiento autónomo.

Comparación 0.3.0 → 0.3.1 y alcance DNS: [revisión de referencias](REFERENCIAS-RENDIMIENTO-DNS.md).
