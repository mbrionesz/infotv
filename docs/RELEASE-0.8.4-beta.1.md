# XuperTizen 0.8.4 beta

- DNS integrado ampliado de 8 a 14 IP: añade NextDNS, Control D y AliDNS; conserva Quad9 y los otros proveedores existentes.
- Configuración de Host/SNI y rutas DoH verificada. Control D utiliza `/p0`; no se copia el endpoint incompatible de la app LG. Se mantiene la validación de certificados.
- Diagnóstico expone proveedor, IP y endpoint configurados. Se conservan el presupuesto de 5 s, caché, cooldown y fallback informado.

Los ocho hosts del portal y las rutas de vídeo no cambian. Más resolutores no equivalen a más CDN y no corrigen un 404 o una lista incoherente.

Incluye las correcciones de películas y series de 0.8.3. Instala el WGT con tu firma habitual en Apps2Samsung. Pendiente validar los nuevos DNS desde la red del TV.
