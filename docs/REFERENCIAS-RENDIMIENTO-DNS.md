# Revisión de las referencias aportadas y cambios en 0.3.1

Se leyeron los PDF `xupertest.pdf` (9 páginas) y `tizenxuper.pdf` (4 páginas)
como documentación de referencia. Las instrucciones de instalación/AGENTS descritas
allí pertenecen a esos proyectos. Se contrastaron con el código público:

- [LG webOS, commit 2c024ef](https://github.com/cristianco7/XUPER-HYDRA-PORT-WEBOS/tree/2c024ef35c4f0d0b20ceb6121b03df62b59304d6).
- [TizenXuperTV, commit cc243d9](https://github.com/juliochemoreno/TizenXuperTV/tree/cc243d94336fe8c1ab7016e4673ea0af2d3adcb8).

## Lenguaje y fluidez

TizenXuperTV usa TypeScript/React/Vite; TypeScript se compila a JavaScript para
el navegador de la TV. Cambiar el lenguaje no garantiza 5 ms. De esa referencia
resultan útiles la protección de repetición de teclas y las métricas en ejecución.
Nuestra app mantiene JavaScript y aplica optimizaciones concretas:

- La guía reutiliza un pool de 12 botones por lista. Mover el foco ya no destruye
  filas y sus manejadores; sólo actualiza selección/texto al ser necesario.
- El teclado cambia las clases de la selección anterior/nueva.
- El catálogo cachea sus controles y evita medir cada tarjeta en cada flecha.
- El menú lateral tiene geometría fija (9 entradas caben en su contenedor); mover
  el foco no fuerza medidas de scroll tras escribir clases. Otros paneles conservan
  el ajuste de scroll habitual.
- Repeticiones de flechas inferiores a 65 ms se descartan antes de despachar a
  las capas, incluidas guía/teclado. Pulsaciones individuales no se retrasan.
- Diagnóstico muestra P50/P95 de hasta 120 muestras del manejador JavaScript y
  del próximo requestAnimationFrame, por separado. No mide la radio del mando,
  la cola anterior al evento ni el momento físico de presentación en pantalla.

Ensayo local Chromium con CPU ×6 y 2.000 canales simulados, mismo script:

| P95 del manejador | 0.3.0 | 0.3.1 |
|---|---:|---:|
| Menú | 9,3 ms | 0,8 ms |
| Guía | 5,6 ms | 2,4 ms |
| Teclado | 1,7 ms | 1,3 ms |
| Próximo frame en guía | 28,7 ms | 18,3 ms |

Los registros completos están en `docs/benchmarks/navigation-v03*-extended.json`.
La meta de 5 ms se alcanzó localmente para esos manejadores; sigue pendiente
medirla en el QN70F. No significa 5 ms de pulsación a imagen ni certifica 60 FPS.

Para repetir la comparación, extraer `app` del tag `v0.3.0-alpha.1` a un directorio
separado y ejecutar el mismo `tools/bench-navigation.mjs <ruta-app> <nombre>` para
ambas versiones. El script limita CPU ×6 en Chromium.

## DNS: qué implementa cada proyecto

LG dispone de Node dentro del TV. `dnsx.js` establece dirección de conexión,
servername y Host, y proporciona lookup al transporte. Su código revisado también
usa `rejectUnauthorized:false` en las consultas DoH. Nuestra implementación
mantiene la comprobación del certificado TLS.

En el proyecto Samsung, `src/services/diagnosticService.ts` consulta por fetch
`https://cloudflare-dns.com/dns-query` y enseña las IP. No instala un resolver
para AVPlay ni conecta las peticiones posteriores por esas IP. Su presencia no
prueba que se haya resuelto el bloqueo DNS del vídeo.

La 0.3.1 añade **diagnóstico DoH**, iniciado por el usuario desde el botón
Amarillo en Diagnóstico. Consulta en paralelo las seis IP Cloudflare/Google/
AdGuard usando DNS wire-format sobre HTTPS, plazo global 5 s, primera respuesta
IPv4 válida, cancelación de perdedores, caché en memoria limitada a 64 dominios
(hasta 10 minutos, respetando TTL) y cooldown de 5 minutos tras fallo total.
No corre durante cada flecha ni en el arranque normal. Se consultan hasta dos
hosts del portal y el último host de reproducción resuelto, sin enviar licencias,
tokens o rutas firmadas a los resolutores.

El navegador verifica el certificado del origen IP. Si un resolutor no ofrece
un certificado válido para esa IP, CORS o el acceso requerido, la consulta falla;
no se fuerza SNI/Host ni se recurre a HTTP. El panel no denomina ese resultado
«DNS alterado»: desde XHR no se observa la respuesta DNS del sistema y red, TLS
y CORS pueden producir el mismo error.

**Estas respuestas se usan para diagnóstico, no para enrutar el portal o vídeo.**
XHR/fetch/AVPlay no ofrecen el lookup de Node. La carrera de resolutores no
constituye un bypass DNS integrado de reproducción; esa parte requiere transporte
nativo/TLS o equivalente adicional, aún sin implementar/validar para Tizen 4–9+.

`portal100024` fue un rechazo regional del servidor observado en esta nube;
no es prueba de envenenamiento DNS. Se registra separadamente si el protocolo
vuelve a devolverlo. Cambiar DNS no elimina una restricción por región/autorización.

## Recuperación del vídeo

Los dos proyectos contemplan servidores alternativos. La 0.3.1 prueba hasta tres
CDN proporcionados por el protocolo y firma la autorización de cada CDN de vivo.
No copia el token del primero al siguiente. Los backups VOD ya aportaban headers
propios; la ruta progresiva protegida continúa sin soporte nativo. HTTPS en el
mismo CDN sigue siendo una alternativa con TLS validado. El arranque total tiene
límite de 30 s; cada cambio destruye el HLS anterior e invalida callbacks antiguos.

La prueba local fuerza HTTP 403 en el primer manifiesto y exige otros headers
en el alternativo: se verificó reproducción H.264/AAC AES-128 con autorización
en manifiesto, segmentos y clave. No demuestra reproducción del proveedor en TV.
