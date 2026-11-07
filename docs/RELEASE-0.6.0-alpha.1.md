# XuperTizen 0.6.0 alpha.1

## Directo 720p: menor distancia al borde de la lista

Al detectar 720p real, objetivo de dos segmentos en lugar de tres; con segmentos
próximos a 5 s puede acercar unos 5 s al borde publicado. No es latencia extremo a
extremo garantizada. Un único avance inicial solo ocurre con vídeo reproduciéndose
y destino ya almacenado. Mantiene Pausa, velocidad 1x y búfer de arranque/espera
3/6 s. Dos stalls después del arranque restauran objetivo estable de tres segmentos
para esa apertura. FHD, VOD y otras resoluciones mantienen el perfil estable.

Ajustes → Reproducción permite desactivar el perfil; se aplica al siguiente canal.
Se conservan formato de pantalla, audio preferido y ajustes de subtítulos. Se retira
el selector de relay ajeno a Samsung del panel de reproducción.

## Inicio y ajustes Samsung

Nueva dirección visual para inicio y centro de ajustes: superficies azul noche,
foco claro, tipografía legible y geometría vectorial escalable. Se conserva el lienzo
1920x1080 y el escalado al viewport que informa el TV; Chromium valida 3840x2160.
Las capturas usan datos de prueba, no canales del proveedor. No se anuncia mayor
resolución del vídeo por dibujar la interfaz en UHD.

Paneles Samsung de reproducción, instalación, ayuda, información y diagnóstico;
se retiran del flujo Samsung la leyenda de port LG y las instrucciones de IPK.
Los avisos y licencias de terceros permanecen incluidos en el paquete.

## Diagnóstico

Tarjetas con etapa, resolución, reserva y candidato actual, más informe técnico.
Nueva acción manual Medir conexión CDN: hasta seis orígenes, HTTP HEAD sin rutas
privadas, tokens ni cabeceras de licencia. Prioridad inferior a reproducción.
Muestra host, esquema, duración y HTTP; por API conserva métricas TCP/TLS/TTFB
cuando el transporte Samsung las proporciona. No es ping ICMP: 403/404 indican
respuesta HTTP, no acceso al canal. Fallos CORS/TLS/red se muestran como no medibles,
no como prueba de bloqueo DNS. Una prueba HEAD fallida no desactiva el transporte
nativo del origen. DNS seguro conserva su acción separada con botón amarillo.

Mando: izquierda/derecha elige acción, OK ejecuta, arriba/abajo desplaza detalles,
Return cierra. La medición no se ejecuta automáticamente en segundo plano.

## Investigación FHD

[Informe y fuentes](INVESTIGACION-SECUENCIAS-HLS.md). Se revisaron código, historial,
PR 7465 y 8048, issue 7962, RFC 8216 y un caso público de Stack Overflow.
Media-sequence-mismatch valida asociaciones entre secuencias y URI, no carga de CPU.
Existen antecedentes de bugs del cliente, pero no se ha probado que expliquen esta
señal FHD. No se desactiva la validación ni se renumeran segmentos. HLS/worker 1.7.4,
reparación de espacios de dominio y candidatos hasta 16 se mantienen.

## Validación

Pasaron 66 pruebas unitarias y Chromium: H.264/AAC AES-128, worker local, perfil
720p de dos segmentos, preferencias, D-Pad, quinto candidato, reporte HEAD, tarjetas
de diagnóstico y escalado 3840x2160 sin recorte horizontal. La prueba de continuidad
de 60 s conserva recuperación ante 404/503, listas defectuosas y desajustes de
secuencia. [Resultados](benchmarks/live-continuity-v060.json).

[Inicio UHD](screenshots/home-v060-4k.png) · [Ajustes UHD](screenshots/settings-v060-4k.png) ·
[Diagnóstico UHD](screenshots/diagnostics-v060-4k.png). Datos de prueba simulados,
adaptador HTTP local y Chromium; no sockets/decodificador del Samsung.

Prueba física Samsung y medición del retraso real pendientes.
WGT sin firma para firmar e instalar con Apps2Samsung.
