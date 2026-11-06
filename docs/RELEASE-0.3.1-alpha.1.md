# XuperTizen 0.3.1 alpha.1

Actualización de navegación y recuperación de vídeo, tras revisar las dos
referencias PDF y sus repositorios LG/TypeScript-Tizen.

- Botones reutilizados en guía, selección incremental del teclado, controles de
  catálogo cacheados y menos lecturas de layout en menú. Repetición de flechas
  limitada antes del despacho; sin demora para pulsaciones individuales.
- Diagnóstico con P50/P95 del manejador y próximo frame en la propia sesión.
- HLS recupera hasta tres CDN con autorización independiente por servidor y un
  plazo global de inicio de 30 s. No se comparten credenciales entre CDN.
- **Diagnóstico DoH**: Amarillo en Diagnóstico consulta seis resolutores por IP,
  primera respuesta válida en 5 s, TLS validado, caché hasta 10 minutos respetando
  TTL y pausa de 5 minutos tras fallo. **No cambia el DNS del transporte de vídeo**
  ni implementa el Host/SNI/lookup de Node. Fallar no demuestra bloqueo DNS.

Benchmark sintético Chromium CPU ×6: P95 menú 9,3 → 0,8 ms, guía 5,6 → 2,4 ms,
teclado 1,7 → 1,3 ms. No son medidas del Samsung ni latencia física del mando.
19 pruebas unitarias y prueba Chromium con HLS AES-128, cambio a CDN alternativo
y headers exigidos en manifiesto/segmentos/clave aprobadas. Sin canal real validado.

WGT autónomo sin firma, mínimo declarado Tizen 4.0, objetivo 4–9+; instalación con
Apps2Samsung. Falta probar 0.3.1 en el QN55QN70FAGXZS con Tizen 9. El código regional
portal100024 no prueba un fallo DNS ni se promete corregirlo cambiando resolver.

Para diagnosticar: guía → columna derecha → Diagnóstico; fuera de ella, Azul.
Amarillo comprueba DNS, flechas verticales desplazan el informe y Return cierra.
Enviar foto del informe tras fallar un canal, sin tokens ni certificados.
