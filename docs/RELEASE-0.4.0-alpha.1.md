# XuperTizen 0.4.0 alpha.1 — DNS integrado experimental

Añade un transporte HTTP/TLS dentro del WGT mediante Tizen Sockets Extension y
WebAssembly. Cuando la extensión está disponible, **portal y HLS conectan a las
IP obtenidas por DoH** conservando Host/SNI y la validación del certificado.

- Cloudflare, Google y AdGuard: seis IP en paralelo, primera respuesta IPv4 válida,
  plazo global 5 s, caché hasta 10 min respetando TTL, fallback DNS del TV por 5 min.
- cURL por sockets Samsung; HLS.js usa el transporte para manifiestos/segmentos/
  claves y autorización de cada CDN. Sin PC, Node, proxy externo o VPN en el uso.
- Diagnóstico identifica motor, IP, resolutor, respuesta HTTP, fallback y geometría.
- Si falta la extensión, vuelve a XHR/DNS del TV. **La compatibilidad de sockets
  con el QN70F/Tizen 9 está pendiente; instalar no garantiza que se active.**

22 pruebas aprobadas, incluida conexión del código C++ a IP forzada con Host/SNI
y rechazo de certificado de otro nombre en Linux. WASM cargado en Chromium con
bindings simulados; HLS real cifrado mediante el adaptador HTTP local. Sin prueba
física de DoH/sockets ni canal real del proveedor en esta versión.

AVPlay progresivo e imágenes directas siguen usando DNS del TV; no se cambia el
resolver del sistema. No evita restricciones regionales o de autorización.

**Alfa experimental:** el SDK Samsung disponible usa cURL 7.68.0 y OpenSSL 1.1.1w,
ramas antiguas sin mantenimiento actual. Se mantiene TLS verificado, pero faltan
modernización de dependencias y auditoría antes de distribución estable.

WGT sin firma, mínimo declarado Tizen 4.0 y fallback por capacidades. Instalar con
Apps2Samsung y revisar Diagnóstico después de seleccionar un canal: buscar motor
`samsung-wasm-curl` y `mode: secure-dns`. Si aparece `xhr-system-dns`, enviar una
foto del campo `reason`. Detalles en docs/DNS-INTEGRADO.md.
