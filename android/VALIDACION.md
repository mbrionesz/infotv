# Primera alpha: verificación

- Nombre visible XuperAndroid; revisión de código UI sin textos Samsung, Tizen o Windows.
- Compilación debug y release optimizada, pruebas unitarias y lint completados.
- 11 pruebas unitarias: políticas de progreso, audio, datos celulares y equivalencia de cifrado/firma con el JavaScript existente; autorización por origen y rechazo HTTP fuera del alcance permitido.
- 3 pruebas instrumentadas aprobadas en Android 15 / API 35: navegación táctil/ajustes/búsqueda; H.264/AAC local con Media3 y apertura de audio/subtítulos; cambio de dimensiones a tablet/TV y cambio entre TV/Películas/Series por foco y D-pad.
- Ejecución: https://github.com/mbrionesz/infotv/actions/runs/45547487275
- APK universal optimizado de aproximadamente 4,5 MiB, firma de desarrollo verificada y comprobación zipalign de 16 KiB. Las pruebas instrumentadas usan el build debug; el release optimizado está compilado y verificado, pendiente de prueba física.

No certifica TCL o Lenovo P11 físicos, Android 8/17 reales, variantes de códec de cada fabricante ni reproducción autenticada del portal. El contenido local se identifica como prueba y no se presenta como contenido real del catálogo. El emulador local sin aceleración sufrió un ANR de arranque; la validación reproducible se completó en CI con aceleración, sin extrapolar su rendimiento a equipos físicos.

La optimización de conexión no tiene selector de modos. Se utiliza el transporte Android, presupuesto de calidad inicial en conexiones celulares y adaptación de Media3 cuando hay variantes. No cambia las bandas del módem ni transcodifica fuentes fijas. El presupuesto se aplica al abrir el vídeo.
