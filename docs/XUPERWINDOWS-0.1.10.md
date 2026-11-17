# XuperWindows 0.1.10 beta

Corrige los clics del mouse sobre los controles VOD: la barra heredaba `pointer-events: none` del diseño de TV. Los controles y la barra de progreso aceptan puntero en Windows. Mover el cursor muestra los controles, también sobre la ventana nativa mediante una consulta de posición cada 120 ms solo con vídeo activo y ventana enfocada. El temporizador se libera al cerrar.

Clic en la barra solicita la posición sin descargar los minutos previos cuando el servidor y el medio permiten buscar por rangos. Se conserva el proxy con DNS/Host/SNI/TLS. No se promete seek exacto para fuentes no indexadas.

El inicio muestra durante nueve segundos los atajos F11 y Esc. Incluye la corrección de eventos de reloj/duración y la información de descarga/caché al pausar preparada después de 0.1.9. El objetivo nativo sigue en 2 s: no se presenta como reserva descargada ni se aumenta a cinco minutos.

La prueba real de Electron añade un clic con coordenadas en el botón de pausa, además de las pruebas existentes de vídeo incrustado, pausa, seek y motores empaquetados. La versión Tizen publicada permanece igual.
