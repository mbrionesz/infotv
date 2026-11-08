# Recuperación con reserva de vídeo

La comparación de código con 0.5.8 confirmó que ambas versiones usan HLS.js 1.7.4 y los mismos límites principales de buffer. La protección de secuencias añadida en 0.8.1 tenía un máximo de dos reintentos adicionales, independientemente del vídeo disponible: el log del TV muestra reinicios con más de diez segundos descargados. Esto no demuestra que todos los problemas del proveedor sean regresiones de la app, pero sí identifica una recuperación demasiado agresiva.

Ahora cada carga incoherente abre un margen acotado por el buffer inicial menos dos segundos de reserva y un máximo de doce segundos. Los reintentos se espacian entre 250 y 1500 ms. Se conserva el último estado aceptado; nunca se entrega la lista incoherente a HLS ni se reescriben secuencias o URLs. Si el buffer se agota, se cumple el plazo o se superan dieciséis respuestas, se mantiene la recuperación limitada de sesión/CDN. La pausa voluntaria no hace infinita la espera y la salida cancela el temporizador.

Los 404 fatales en reproducción en vivo con al menos tres segundos descargados usan primero el presupuesto de recuperación de red. No se renueva inmediatamente el origen ni se destruye la sesión. Fuera de ese caso se mantiene la renovación y el cambio de ruta existentes. No se convierten errores definitivos en éxito.

La prueba de navegador usa segmentos de cinco segundos, como la señal observada, cuatro respuestas incoherentes consecutivas y un intervalo de 404 temporales. Comprueba avance de frames sin reinicios ni renovaciones de origen durante esos fallos. También fuerza el reloj fuera del buffer y respuestas incoherentes persistentes para verificar que siga habiendo recuperación acotada y salida al menú. Las pruebas de TV en vivo incluyen solicitudes nativas simuladas, pausa explícita y autorización distinta por CDN.

No cambian el DNS, las bibliotecas TLS ni las protecciones de subtítulos, scripts y almacenamiento. Pendiente ensayo físico de esta versión en QN70F.
