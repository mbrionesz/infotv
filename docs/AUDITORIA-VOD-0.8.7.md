# Películas y series: comparación y límites

Referencia local estudiada: juliochemoreno/TizenXuperTV, commit 314308b82f2d986742669ac2fe6f3389dd410600 (1.12.2). El código de referencia no se ejecutó con credenciales del usuario.

Ambas apps solicitan startPlayVOD, seleccionan pista/licencia y consultan getSlbInfo para construir una ruta /vod/{contentId}_media.ts o .mp4 con Content-Auth y Content-License. No basta con pasar estas URLs a HLS.js: un archivo TS completo no es una lista HLS.

La referencia convierte las bases VOD a HTTP y pasa cabeceras a AVPlay mediante CUSTOM_MESSAGE. Nuestra app usaba HTTPS incluso cuando el portal había indicado HTTP: eso podía cambiar puerto y servicio. La corrección conserva el protocolo explícito. No copia la conversión general a HTTP ni presume que CUSTOM_MESSAGE sea un mecanismo portable para cabeceras HTTP de AVPlay. Tampoco copia la aceptación de cualquier ruta firmada cuando faltan rutas gratuitas.

Nuestra reproducción autorizada usa lecturas Range mediante el transporte Samsung (con DoH) y después MP4Box o mpegts.js sobre MediaSource. El fallback XHR sigue dependiendo del DNS del sistema y de las restricciones de su plataforma; no se presenta como equivalente al transporte nativo. La compatibilidad de códecs de AVPlay y MediaSource puede ser distinta, aun en el mismo TV.

Se corrigieron fallos comprobables: getSlb no intentaba v14 ante v15 semánticamente vacío; los MediaError del elemento de vídeo se ignoraban con el motor progresivo; el HTTP de una respuesta inválida no llegaba al diagnóstico; el historial de un CDN de respaldo seguía mostrando el host principal. Se acota la espera inicial por ruta, manteniendo el límite global y cancelando lecturas anteriores. Los eventos de error de una fuente antigua se ignoran mientras carga el módulo o si ya no existe MediaError; las fábricas síncronas fallidas no pueden reemplazar una sesión nueva.

Las pruebas unitarias no contactan el proveedor: mockean las respuestas dentro del módulo real de resolución, impiden llamadas de red y verifican v15/v14, rutas gratuitas, protocolos y credenciales por CDN. El navegador genera archivos de prueba, simula autorización, decodifica vídeo/audio y reproduce un segundo episodio. Esto comprueba la arquitectura y las correcciones; no demuestra que un CDN real esté accesible desde la conexión del usuario.

Para investigar un fallo físico, abrir un título y copiar en Apps2Samsung:

```js
console.log(JSON.stringify({version:XuperStandalone.version,player:XuperStandalone.diagnostics().player,transport:XuperNativeTransport.snapshot()},null,2))
```

El resultado permite separar resolución, transporte nativo/XHR, HTTP/Range y códecs. No desactivar TLS ni añadir servidores DNS a ciegas: primero comprobar fase, esquema y código de error.
