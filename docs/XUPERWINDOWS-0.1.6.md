# XuperWindows 0.1.6 beta

- Vídeo HEVC dentro del área de reproducción de XuperWindows, sin interfaz independiente de mpv/VLC. La superficie nativa es una ventana hija sin marco, no enfocable y sin entrada en la barra de tareas. Usa HWND creado exclusivamente por el proceso principal: VLC `--drawable-hwnd` con interfaz dummy en x64 y x86.
- La superficie sigue la posición y dimensiones del vídeo, minimización y pantalla completa. Cuando se muestran los controles, recorta su región visible para dejar espacio a los controles HTML, conservando el tamaño de vídeo sin cambiar su proporción; durante los ajustes cede el área a los menús. No se ha eliminado el proxy con DNS seguro ni el guardado de progreso.
- «Seguir viendo»: indicación de botón derecho y menú Eliminar, válido para el clic secundario del touchpad.
- Listas de TV con desplazamiento nativo y reciclaje de 12 botones, espaciadores y carga de páginas al alcanzar el final. La rueda no activa canales ni categorías por accidente.
- TMDB continúa excluido de Windows. No modifica la versión WGT publicada.

Validación local: pruebas de control de superficie, proxy/códecs e interfaz; rueda real en Chromium, selección tras scroll, paginación sin salto, retorno por teclado y eliminación mediante contextmenu. La validación de renderizado nativo requiere el trabajo Windows de GitHub Actions; las pruebas usan un clip sintético HEVC/AAC, no una sesión prolongada del portal.

La prueba Windows exige píxeles de color del clip sintético dentro de la superficie, además del reloj y la decodificación. Las pruebas de decodificación aisladas usan GDI; la prueba de imagen incrustada utiliza la selección gráfica normal de VLC. Solo la prueba fuerza decodificación por software para el servidor sin GPU HEVC.

Se eliminó la indicación antigua de cerrar una ventana externa. La superficie utiliza BaseWindow sin un renderizador Chromium adicional.

Validación final aprobada: https://github.com/mbrionesz/infotv/actions/runs/44114817011 . Fuente de instaladores: `v0.1.6-beta.2`. Imagen HEVC/AAC visible incrustada en x64 y x86, controles y EOF; 345 pruebas del núcleo y 15 de escritorio; rueda/touchpad real, clic secundario para eliminar y paginación conservando la categoría cargada. La prueba x86 ejecutó un proceso de 32 bits en Windows x64 (WOW64). Falta una sesión prolongada con el portal y hardware del usuario.
