# XuperTizen 0.4.2 alpha.1

Cambios dirigidos por las fotos de la QN70F con 0.4.1: DoH devuelve direcciones,
pero el portal muestra cURL 28 (timeout) y el vídeo agota sus intentos antes de
recibir el manifiesto HLS. No hay evidencia todavía de fallo de códec.

- HTTP/HTTPS conecta mediante CURLOPT_CONNECT_TO, la ruta ya usada por las
  consultas DoH. Conserva dominio de URL, Host/SNI y verificación TLS.
- Recoge las respuestas A alternativas del DNS y prueba hasta dos IP dentro de
  un presupuesto de tiempo acotado. Rechaza direcciones nulas/privadas del DNS
  público; no incorpora IP de prueba al runtime.
- El timeout del portal permite recuperar su ruta XHR, sin desactivar globalmente
  el transporte nativo de los canales. Un fallo de vídeo afecta a ese origen;
  los otros CDN conservan la posibilidad de usar DNS seguro.
- Diagnóstico muestra esquema/puerto, intentos e IP, tiempos de conexión TCP,
  negociación TLS, primer byte y total. cURL 28 no se presenta como rechazo del
  certificado. No se exponen rutas firmadas, licencias o cabeceras.

28 pruebas aprobadas más HLS AES-128 H.264/AAC real en Chromium: segunda IP,
aislamiento portal/vídeo, conexión C++ local con Host/SNI correctos y rechazo de
certificado de otro nombre. WASM recompilado con SDK Samsung y hashes verificados.
**La 0.4.2 sigue pendiente de probar en la TV; no se garantiza aún un canal real.**

Alfa experimental; se mantienen las dependencias antiguas del SDK y las
limitaciones descritas en docs/DNS-INTEGRADO.md. El fallback XHR usa el DNS del TV.
DoH no elimina bloqueos por IP, SNI, restricciones regionales o autorización.

Instalar el WGT 0.4.2 con Apps2Samsung. Abrir un canal y, si falla, enviar la parte
`hosts[].attempts` / `lastFailure.metrics.phase` de Diagnóstico. Así se distingue
si no conecta por TCP, no completa TLS o espera HTTP después de conectar.
