# XuperWindows 0.1.11 beta

Corrige renovaciones de autorización VOD superpuestas: se espera tanto al portal como a la confirmación del motor; una renovación fallida se informa una vez, se cancela al cerrar y tiene límite de 18 s. Se evita renovar sobre un reproductor ya cerrado. Tres fallos consecutivos al consultar el estado dejan de silenciarse.

Un EOF prematuro con duración conocida informa un corte; no adelanta el reloj artificialmente al final ni marca el título como completado. Si el EOF coincide con una autorización caducada, espera su renovación. Los subtítulos se reaplican tras el primer fotograma de la nueva conexión.

Se conserva el objetivo de caché libVLC de 2000 ms, el transporte DNS/Host/SNI/TLS y los perfiles. No es una reserva garantizada de vídeo descargado ni un tamaño de RAM.

Publicación conjunta limpia con el WGT Tizen 0.10.21 ya publicado, conservado byte por byte. Los instaladores Windows anteriores se retiran junto con las publicaciones anteriores tras validar la nueva. Las etiquetas e historia Git se conservan.
