# Instalar InfoTV en Samsung desde Windows

Estado: adaptación experimental. El instalador y el paquete necesitan validación
en Windows y en un Samsung real. El modelo objetivo es QN70F de 55 pulgadas;
comprueba el código completo del modelo y su firmware en Ajustes → Soporte →
Acerca de este TV. No se ha confirmado aquí la versión de Tizen de ese equipo.

## Diferencias frente al instalador de LG

El proyecto de referencia usa Developer Mode de LG, SSH, Luna y paquetes IPK.
Samsung utiliza Developer Mode de Samsung, SDB, certificados Samsung y paquetes
WGT. El PIN/clave SSH y los comandos `ares-*` de LG no sirven en Samsung.
El binario ARM de FFmpeg de LG tampoco se reutiliza.

En esta versión el catálogo, el proxy y FFmpeg viven en Windows. La TV ejecuta
la interfaz y el elemento de vídeo HTML5. **El PC debe permanecer encendido y
el servicio abierto durante el uso.** No es todavía una app autónoma de Samsung.
No se usa AVPlay en esta primera adaptación: los códecs y formatos que acepte
el elemento HTML5 deben comprobarse en el televisor. Remultiplexar con FFmpeg
no convierte un códec incompatible en compatible.

## 1. Preparar Windows

1. Extrae el kit completo en una carpeta local. No ejecutes el BAT desde el ZIP.
2. Instala Node.js LTS 22 o superior desde https://nodejs.org/.
3. Instala Tizen Studio desde https://developer.tizen.org/development/tizen-studio/.
   En Package Manager agrega Web CLI, Samsung TV Extension y Samsung Certificate
   Extension. La disponibilidad de esas extensiones depende de la versión actual
   del SDK. Consulta https://developer.samsung.com/smarttv/develop/getting-started/setting-up-sdk/installing-tv-sdk.html.
4. Para Modo Fluido, instala una compilación de FFmpeg para Windows de un
   distribuidor enlazado por https://ffmpeg.org/download.html y verifica su
   integridad según sus instrucciones. Pon `ffmpeg.exe` en PATH o define
   `INFOTV_FFMPEG` con su ruta completa. No se descarga ni ejecuta un EXE incluido
   en el proyecto de LG. La ausencia de FFmpeg deja Modo Fluido sin funcionar.
5. Conecta el PC y la TV al mismo router. Pueden usar Wi-Fi o Ethernet; no deben
   estar en una red de invitados ni tener aislamiento de clientes. No hace falta
   que ambos estén en la misma banda de Wi-Fi.

## 2. Preparar el Samsung

1. Consulta la IPv4 del PC (`ipconfig`) y la de la TV (Estado de red).
2. Abre Apps en la TV e introduce `12345` con el mando o teclado numérico para
   abrir Developer Mode, si ese procedimiento está disponible en tu firmware.
3. Activa Developer Mode y escribe la **IP del PC**, no la IP del televisor.
   Reinicia la TV conforme a la guía de Samsung.
4. En Tizen Studio → Device Manager conecta con la IP de la TV, puerto 26101.
   Acepta cualquier solicitud de autorización que muestre la TV.
5. En Certificate Manager crea un perfil **Samsung / TV**, con certificado de
   autor y distribuidor, e incluye el **DUID de tu televisor**. Esto requiere tu
   cuenta Samsung en tu PC. No compartas las claves privadas ni sus contraseñas.
6. En Device Manager usa «Permit to install applications» si tu SDK/modelo lo
   requiere. Conserva el nombre del perfil para el instalador.

Referencia del fabricante: https://developer.samsung.com/smarttv/develop/getting-started/using-sdk/tv-device.html
y https://developer.samsung.com/smarttv/develop/getting-started/setting-up-sdk/creating-certificates.html.
Estas páginas no pudieron consultarse desde el entorno durante esta entrega;
comprueba sus pasos para la versión de SDK y firmware que utilices.

## 3. Iniciar el servicio

Ejecuta `INICIAR-SERVICIO.bat`. Muestra una dirección de red y un código de enlace.
Conserva la ventana abierta y trata ese código como acceso a tu servicio local.
No abras puertos en el router ni lo publiques en Internet. El tráfico entre PC
y TV usa HTTP en tu LAN; úsalo únicamente en una red de confianza.

Si Windows bloquea el puerto, configura la red como **Privada** y permite TCP
8910 solamente desde la subred local. Puedes crear esa regla ejecutando una
PowerShell elevada desde la carpeta del kit:

```powershell
.\tools\start-companion.ps1 -ConfigureFirewall -PcIp 192.168.1.20
```

Si la política de PowerShell bloquea los scripts, revisa la procedencia de los
archivos y utiliza el mecanismo autorizado por tu equipo/administrador. Los BAT
no cambian ni evaden la política de ejecución. Si corresponde, usa `Unblock-File`
sobre los scripts descargados y una política RemoteSigned para tu usuario.

## 4. Firmar, instalar y abrir

Ejecuta `INSTALAR-SAMSUNG.bat`. Pide la IPv4 de la TV y el nombre exacto del perfil
de certificados. Comprueba el servicio, conecta SDB, construye, firma, instala
y abre `Infotv2026.InfoTV`. Interrumpe el proceso ante cualquier comando fallido.

También puedes indicar todo desde PowerShell:

```powershell
.\tools\install-samsung.ps1 -TvIp 192.168.1.30 -PcIp 192.168.1.20 -Profile MiSamsung -TizenRoot C:\tizen-studio
```

El WGT firmado queda en `dist\InfoTV-Samsung-SIGNED.wgt`. La copia de trabajo
está en `.local\tizen-app`; los certificados quedan en el SDK, no en este repo.
El WGT lleva la dirección y el código de enlace del PC. No lo publiques ni
compartas ese paquete personalizado. El kit genérico no contiene el código.

`InfoTV-0.1.0-UNSIGNED.wgt` es un archivo sin firma para inspección/construcción;
**no es instalable directamente en una TV comercial**. No renombres un IPK a WGT.

## Uso y diagnóstico

- Flechas y OK navegan; Return vuelve una vez; Play/Pause y avance se registran
  como teclas del mando Samsung. En el inicio, Return solicita salir según la
  navegación de la app original.
- Pulsa `0` fuera del reproductor para cambiar el PC/código de enlace. Si cambió
  la IP del PC, reinicia también el servicio con la nueva IP. Reserva la IP en
  DHCP para evitarlo. La configuración de enlace guardada tiene prioridad sobre
  la incluida en el WGT.
- Si no conecta: revisa que el proceso esté activo, IP, firewall privado,
  aislamiento Wi-Fi y Developer Mode. El puerto SDB 26101 instala; el 8910 sirve
  a la aplicación. Son funciones distintas.
- Si no reproduce: prueba primero Normal. Modo Fluido requiere FFmpeg de Windows
  y conserva el códec original. Disponibilidad del portal, sesiones, TLS, CORS
  y soporte de audio/vídeo pueden impedir la reproducción. No se ha validado el
  proveedor en vivo desde este entorno; no se promete acceso a su contenido.
- No se ejecuta el actualizador IPK de LG: `checkUpdate` informa que no hay
  actualización y `applyUpdate` no está expuesto. Para actualizar repite la firma
  e instalación con el mismo certificado de autor.

## Validación necesaria en QN70F

Comprueba arranque en frío; navegación mantenida sin saltos dobles; Return;
película H.264/AAC; HEVC si lo admite el modelo; TV en vivo; pausa/reanudación;
seek; cambio de audio/subtítulos; cambio de episodio; Modo Fluido; suspensión y
reapertura. Mide tiempo hasta primer fotograma y tirones durante al menos diez
minutos en la misma película antes de afirmar una mejora de reproducción.
