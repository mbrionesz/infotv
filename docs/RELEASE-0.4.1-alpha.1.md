# XuperTizen 0.4.1 alpha.1

Corrige la regresión de 0.4.0 reportada en TV: el socket podía abrirse, pero una
transferencia HTTP/TLS fallida dejaba sin cargar el catálogo. Ahora esa petición
vuelve a XHR y se suspende el transporte nativo durante el resto de la sesión.
La recuperación también cubre el manifiesto y el cargador HLS. **El fallback usa
el DNS del TV; no implica que se haya reparado el DNS integrado en ese equipo.**

Diagnóstico conserva el código cURL y separa los seis resolutores configurados de
las IP devueltas para portal/CDN. No hay resolutores inventados: Cloudflare
1.1.1.1/1.0.0.1, Google 8.8.8.8/8.8.4.4 y AdGuard 94.140.14.14/94.140.15.15.
Las direcciones de prueba permanecen sólo en tests, fuera del runtime del WGT.

25 pruebas y reproducción HLS AES-128 en Chromium aprobadas, incluyendo caída del
transporte nativo a XHR. Falta instalar esta corrección en el Samsung e identificar
el código del fallo real; no se garantiza reproducción del proveedor. El módulo
sigue siendo experimental y conserva las limitaciones/dependencias antiguas
explicadas en docs/DNS-INTEGRADO.md. No se omite la validación TLS.

Descargar el WGT 0.4.1 para Apps2Samsung. Tras abrir un canal, enviar foto de
Diagnóstico con `lastFailure`, `reason` y las IP/campos en cuestión.
