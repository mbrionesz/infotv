export function portalErrorMessage(message,code){
 if(code==='portal200001')return 'El portal dejó de aceptar el perfil de versión de esta app. Es necesaria una actualización de compatibilidad; borrar el historial o la caché no corrige este rechazo.';
 if(code==='portal100024')return 'El portal rechazó el acceso por la región de la conexión.';
 return String(message||'Error del portal');
}
