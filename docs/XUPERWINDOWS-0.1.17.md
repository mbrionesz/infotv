# XuperWindows 0.1.17 beta y tester libmpv revisión 1

Los controles se ocultan después de tres segundos sin actividad en Windows y vuelven con el ratón o el teclado. Se conserva el panel al editar el campo de salto para no interrumpir la entrada. Tizen conserva su plazo anterior.

El panel es más compacto, con degradado y botones menos opacos. El recorte de la superficie nativa reserva solo el contenido real del panel, no toda la franja exterior. La composición nativa actual no permite transparencia real del HTML sobre el vídeo: el degradado es una mejora del fondo, no una nueva arquitectura de composición.

En el tester libmpv, los subtítulos se desplazan temporalmente por encima de los controles y vuelven abajo cuando estos se ocultan. El nuevo comando solo permite posiciones entre 20 y 100 y no cambia la fuente, color o pista elegida.

Se conserva la preferencia por español latino, con prioridad de elecciones manuales por título. Una pista etiquetada únicamente spa no permite confirmar si es doblaje latino o castellano.

Validación: 50 pruebas Windows, compilación, pruebas compartidas y CI de reproducción real, subtítulos, saltos, cierre del panel tras tres segundos y retorno con movimiento del ratón. El tester comprueba también el cambio real de posición de subtítulos mediante libmpv. Se conserva la recuperación DNS de 0.1.16 y su política de búfer.
