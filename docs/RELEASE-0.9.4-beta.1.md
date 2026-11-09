# XuperTizen 0.9.4 beta

- Películas/series conservan las direcciones y autorizaciones renovadas si después deben reabrir el decodificador. Evita reenviar credenciales ya caducadas durante esa recuperación, sin mezclar cabeceras entre CDN.
- El límite de recuperación de reloj VOD se aplica por cinco minutos, en vez de agotarse para todo el episodio. Se mantiene acotado para evitar bucles.
- Herramienta de consulta de totales del catálogo desde Windows mediante el inspector local de Apps2Samsung. Véase [la guía](CATALOGO-WINDOWS.md).

No modifica TV en vivo ni los 17 DNS. Las pruebas simulan caducidad y recuperación con vídeos reales de prueba; todavía requiere una sesión larga con el proveedor en Samsung. No garantiza ausencia de cortes del servidor.
