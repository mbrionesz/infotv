# Tester Windows revisión 4 · superposición de siguiente capítulo

El vídeo nativo se recortaba a todo lo ancho en la coordenada superior del botón «Siguiente capítulo». El HTML quedaba visible, pero toda la zona inferior del vídeo se sustituía por el fondo negro de la app.

Ahora el botón se comunica como una oclusión rectangular local. La superficie nativa conserva tamaño, proporción y HWND; su región visible excluye únicamente el botón. El resto del vídeo continúa visible a los lados y debajo. Las barras completas de controles conservan su recorte y los menús conservan su comportamiento. Al desaparecer el botón, la región vuelve al vídeo completo. Las oclusiones se validan en el proceso principal y se recalculan al cambiar el tamaño o la pantalla completa.

Las pruebas verifican el área conservada, las coordenadas DOM y el cambio de tamaño. La prueba real de Electron añade una oclusión clicable sobre vídeo HEVC y exige píxeles de vídeo por debajo de la altura del botón, donde antes se producía la franja negra.

La revisión conserva el perfil del portal, el cargador Vulkan local y la caché de libmpv. La versión normal publicada sigue utilizando libVLC, con perfil de instalación independiente. La reserva en tiempo se informa en el tester mediante las métricas de libmpv; los 2 segundos de preparación de libVLC no equivalen a toda su reserva disponible. El tester no crea nuevas calidades, idiomas ni subtítulos que no proporcione la fuente.
