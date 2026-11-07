# Centro de ajustes: revisión funcional

Cambios: las dos columnas son contenedores de desplazamiento del foco; sus posiciones se calculan en píxeles de layout, corrigiendo el factor 2 en 4K. Arriba/abajo se mantiene en la columna actual; derecha entra al contenido y izquierda desde su borde vuelve al menú. Cada opción enfocada muestra su panel, y al cambiar de sección se reinicia el desplazamiento del contenido. Los paneles dejan de depender de una caja absoluta que podía quedar fuera del área visible. Las opciones marcadas tienen contraste explícito.

| Opción | Comportamiento comprobado y límites |
| --- | --- |
| Mi cuenta | Perfil local; enlaces a lista, addons y compartir. No es una cuenta remota. |
| Mi lista | Se construyen historial y favoritos locales. El contenido depende de lo guardado en el TV. |
| Addons | Acceso al administrador de listas propias; la prueba de navegador general cubre entrada por teclado, carga M3U, favorito y reproducción de muestra. Se corrigió texto que prometía listas preinstaladas. |
| Compartir | Información de descarga e instalación; no realiza una instalación remota. |
| 720p experimental | Guarda `xt.lowDelay720`; el reproductor lo lee al abrir el siguiente canal. No cambia el retraso de origen. |
| Subtítulos | Guarda la preferencia y ahora también aplica `nn()` inmediatamente; necesita subtítulos disponibles. |
| Formato | Selección y aplicación al vídeo HTML del reproductor principal. La ruta AVPlay conserva su propio modo de presentación. |
| Audio preferido | Preferencia persistente. Se conectó al evento de pistas disponibles de HLS.js para seleccionar un idioma coincidente; conserva la pista predeterminada si no existe. La selección por idioma en AVPlay no está implementada. |
| Idioma de subtítulos | Preferencia utilizada al seleccionar subtítulos externos del proveedor al abrir contenido; no crea traducciones. |
| Tamaño y estilo | Persistencia y actualización de clases de subtítulos externos del reproductor principal; no modifica subtítulos incrustados en la imagen. |
| Control parental | Alterna y persiste el filtro de contenido adulto existente; no incorpora PIN ni clasifica contenido sin metadatos. |
| Pantalla | Automático/Compatibilidad HD alternan el escalado de interfaz; no cambian resolución del vídeo. |
| Diagnóstico | Acceso al panel de diagnóstico; la prueba general comprueba apertura y su información. Los resultados de red reales requieren el televisor. |
| Ayuda / Sobre nosotros | Paneles informativos; no son interruptores. |

Validación automatizada: `node tools/settings-audit-browser.mjs` recorre las diez secciones, llega al final del menú y del panel Reproducción, comprueba foco visible en 1080p/4K y activa grupos de preferencias, interruptores y modo de pantalla. Usa datos locales de prueba. Las pruebas de selección no certifican que una señal del proveedor contenga pistas alternativas, ni sustituyen la prueba física en Samsung.
