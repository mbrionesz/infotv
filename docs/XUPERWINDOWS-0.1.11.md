# XuperWindows 0.1.11 beta

Corrige renovaciones de autorización VOD superpuestas: se espera tanto al portal como a la confirmación del motor; una renovación fallida se informa una vez, se cancela al cerrar y tiene límite de 18 s. Se evita renovar sobre un reproductor ya cerrado. Tres fallos consecutivos al consultar el estado dejan de silenciarse.

Un EOF prematuro con duración conocida informa un corte; no adelanta el reloj artificialmente al final ni marca el título como completado. Si el EOF coincide con una autorización caducada, espera su renovación. Los subtítulos se reaplican tras el primer fotograma de la nueva conexión.

Se conserva el objetivo de caché libVLC de 2000 ms, el transporte DNS/Host/SNI/TLS y los perfiles. No es una reserva garantizada de vídeo descargado ni un tamaño de RAM.

Publicación conjunta limpia con el WGT Tizen 0.10.21 ya publicado, conservado byte por byte. Los instaladores Windows anteriores se retiran junto con las publicaciones anteriores tras validar la nueva. Las etiquetas e historia Git se conservan.

Validación final: 345 pruebas generales, 28 de escritorio y reproducción real x64/x86 (HEVC/AAC visible dentro de Electron, pausa, seek, EOF, recuperación y motores empaquetados). [Ejecución Windows](https://github.com/mbrionesz/infotv/actions/runs/44170685892), fuente inmutable `v0.1.11-beta.1`.

Publicación conjunta: https://github.com/mbrionesz/infotv/releases/tag/v0.10.21-beta.2

SHA256 de los instaladores descargados coincidente con los activos públicos:

- x64: `f6feab54b3ccb1f26457249c94f5beb6df348bb2557be12274bff1fa1fb1771a`
- x86: `9f7c6c52e3c749ae365ba661759f0a6791b8310973780634f0f8b785cbd62bc8`

El WGT Tizen conserva el SHA256 `a9041cc7ba17dffdd34d933f005da81927a23093caffaa26ebc45e418c7c2727`. No cambia la versión instalada del TV.

Política solicitada por el usuario: cada publicación nueva debe contener solo la última versión de cada plataforma. Verificar ambas y su integridad antes de retirar publicaciones anteriores; conservar etiquetas e historia Git.
