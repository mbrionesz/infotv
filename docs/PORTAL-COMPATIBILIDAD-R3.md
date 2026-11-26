# Compatibilidad del portal · tester revisión 3

El usuario recibió `v3/snToken → portal200001 版本已停止使用` y un 404 posterior al intentar `v7/getLiveData`.

La comparación estática de Samsung 1.19.4 y las consultas propias al portal permitieron identificar un perfil coherente aceptado para bootstrap: APK 49902, cabecera APK 43404, sistema/paquete `2025-08-07 05:40:11_36_16_`, SDK 36. Cambiar solamente la cabecera a 49902 o usar el perfil 49920 no fue una solución validada. El perfil se configura explícitamente durante la compilación; `companion/lib/magis.js` se conserva byte por byte con SHA256 `fa910167e612539f54cad7535f96da1dce7abb5b3525b499a1a1edcc8c4cbf77`.

Las respuestas difieren entre hosts: algunos devuelven `portal200001` mientras otros aceptan el mismo perfil. Antes, cualquier JSON se promovía como host preferido y un rechazo finalizaba la carrera, cancelando respuestas que podían funcionar. Ahora ese rechazo permite continuar con los otros hosts configurados, sin provocar un intento HTTP plano por ese motivo. Solo una respuesta aceptada promueve el host. Si todos fallan, se conserva el error de versión en lugar de ocultarlo detrás del 404 de una ruta alternativa.

Se probaron solicitudes propias, sin descargar ni reutilizar sesiones de otros clientes. `v3/snToken` devolvió éxito y el intento de activación llegó a `portal100024` (región denegada desde este entorno). Esto verifica que el bloqueo de versión no es inevitable con el perfil nuevo, pero no demuestra reproducción ni catálogo completos desde la región del usuario. No se intenta eludir el rechazo regional.

Pruebas automáticas: conservación del fuente original, perfil coherente, carrera entre host rechazado y host sano, ausencia de HTTP plano como respuesta a versión retirada, conservación del error entre rutas y mensajes en español. La revisión 3 conserva el cargador Vulkan local, los controles y la caché del tester revisión 2. Actualizarla no borra el perfil.

## Configuración compartida y Android beta 10

Los valores efectivos anteriores se centralizan en `shared/portal-profile.json`. El adaptador Tizen/Windows lo lee al compilar; Android genera las constantes Kotlin del mismo archivo. No se utiliza el perfil del `magis.js` archivado como referencia del perfil efectivo. Beta 8/9 de Android todavía enviaban el perfil archivado de 2024; beta 10 corrige esa diferencia y renueva las sesiones antiguas conservando la identidad de instalación.

El reporte Android `aaa100083` corresponde a una sesión no iniciada, distinto del rechazo de versión `portal200001`. Se corrigió además una carrera reproducida con transporte simulado: una consulta antigua podía invalidar la sesión que otra ya había renovado. El rechazo tardío ahora conserva la sesión nueva y cada petición utiliza sus propias credenciales. No se comprobó la causa exacta en la tablet física ni se hicieron nuevas consultas reales al portal durante esta corrección. Ver `android/VALIDACION.md`.
