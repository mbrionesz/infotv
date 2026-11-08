# XuperTizen 0.8.2 beta

- Conserva el reproductor y su vídeo descargado mientras reintenta listas incoherentes: el margen depende del buffer disponible, con un máximo de 12 segundos. Ya no reinicia automáticamente al tercer rechazo si hay reserva suficiente.
- Un 404 temporal durante reproducción con buffer se reintenta antes de renovar la dirección del canal y destruir la sesión. Los presupuestos de recuperación siguen limitados.
- Mantiene el rechazo de listas que provocarían saltos del reloj, la salida al menú, las protecciones de seguridad y los ocho DNS integrados. No reduce globalmente el buffer ni desactiva TLS.

Instala el WGT con la firma habitual de Apps2Samsung. Pendiente confirmar en Samsung con las señales reales; los servidores pueden seguir devolviendo errores definitivos.
