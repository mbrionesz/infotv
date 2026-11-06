# XuperTizen 0.5.2 alpha.1

Amplía de tres a cuatro los candidatos que conserva el reproductor. Los logs del
usuario confirman cuatro alternativas recibidas para seis canales del portal;
no prueban que todas reproduzcan. El adaptador extrae hosts live de cdn_list,
conserva main_addr y spared_addr sin duplicados y firma cada alternativa con su
propio authBase. El recorte a tres estaba después de ese adaptador.

Se prueban primero los cuatro candidatos con las direcciones y cabeceras del
adaptador. Solo al agotarlos se construyen variantes HTTPS, sin repetir una URL
ya presente. El adaptador de vivo sigue construyendo rutas HTTP /live/{code}.m3u8
a partir de los hosts; no se afirma que esas URL completas vengan del portal.
No se comparten credenciales entre CDN ni se baja de HTTPS a HTTP en esta lógica.
El plazo inicial total sigue en 30 s: un servidor que no responde puede consumir
parte del tiempo disponible para alternativas posteriores.

Diagnóstico añade cdnReceived (principal más reservas recibidas) y cdnAvailable
(candidatos válidos admitidos, máximo cuatro). cdnAttempt sigue identificando el
candidato de origen, también durante su variante HTTPS. Se conserva la renovación
única tras 404. No se memoriza aún un CDN preferido entre sesiones.

Corrige el mensaje de fallback HTTP del portal: un fallo HTTPS no demuestra
filtrado TLS/SNI de la operadora. No se agregan resolutores ni listas externas.

Validación local: 42 pruebas unitarias y Chromium con los primeros tres
candidatos fallando y el cuarto reproduciendo H.264/AAC AES-128. Se verifica que
las solicitudes del cuarto usan su propia autorización, incluidos segmentos y
clave. Se mantienen las pruebas de renovación 404 y controles de reproducción.
Las respuestas del portal se simulan; no se probaron los cuatro servidores reales
desde esta nube. La prueba física corresponde al usuario; 0.5.2 queda pendiente.
Este cambio no corrige específicamente levelParsingError ni garantiza FPS,
sincronía de audio o disponibilidad del cuarto host.
